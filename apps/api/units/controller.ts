import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import {
	Unit,
	UnitLevel,
	UnitLevelName,
	UnitParams,
	UnitQuery,
	UnitDB as InteralUnitDB,
	UpdateUnitMap
} from '../schema'
import unitRepo from './repo'
import userRepo from '../users/repo'
import { GetUnitsQuery, UnitDB } from './units'

const COMMANDER_FIELDS = [
	'commanderId',
	'deputyCommanderId',
	'politicalCommanderId',
	'deputyPoliticalCommanderId'
] as const

type findOneRequest = {
	id?: number
	alias: string
	name?: string
	level?: UnitLevelName

	parentId?: number | null
	validUnitIds: number[]
}
class controller {
	constructor(private readonly repo: Repository) {}

	private async validateHierarchy(
		level: UnitLevelName,
		parentId: number | null | undefined,
		excludeId?: number
	): Promise<void> {
		if (parentId === undefined || parentId === null) {
			const rootLevel = UnitLevel.fromName(level)
			if (UnitLevel.isLargerThan(UnitLevel.COMPANY, rootLevel)) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Root unit must be Company level or larger. Got: ${level}`
					)
				)
			}
			return
		}

		if (parentId === excludeId) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('A unit cannot be its own parent')
			)
		}

		const parent = await this.repo.getOne({ id: parentId })
		if (parent === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Parent unit not found: ${parentId}`)
			)
		}

		const parentLevel = UnitLevel.fromName(parent.level)
		const childLevel = UnitLevel.fromName(level)

		if (UnitLevel.isEqual(parentLevel, childLevel)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`parent level and unit level can't be the same. Parent level:${parent.level} - Unit level: ${level}`
				)
			)
		}

		if (UnitLevel.isLargerThan(childLevel, parentLevel)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`unit level can't be higher than parent. Parent level: ${parent.level} - Unit level: ${level}`
				)
			)
		}
	}

	private async validateCommanders(
		params: Array<
			Partial<Record<(typeof COMMANDER_FIELDS)[number], number | null>>
		>
	): Promise<void> {
		const ids = Array.from(
			new Set(
				params
					.flatMap((p) => COMMANDER_FIELDS.map((f) => p[f]))
					.filter(
						(id): id is number => id !== undefined && id !== null
					)
			)
		)
		if (ids.length === 0) return

		const found = await userRepo.findByIds(ids)
		const foundIds = new Set(found.map((u) => u.id))
		const missing = ids.filter((id) => !foundIds.has(id))
		if (missing.length > 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Commander/deputy user(s) not found: ${missing.join(', ')}`
				)
			)
		}
	}

	async create(params: UnitParams[]): Promise<UnitParams[]> {
		log.trace('UnitController.create params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Empty request data`)
			)
		}

		for (const param of params) {
			await this.validateHierarchy(param.level, param.parentId)
		}
		await this.validateCommanders(params)

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async isInitRootUnit(): Promise<{
		initialized: boolean
		rootUnitId?: number
	}> {
		const root = await this.repo.findRoot().catch(AppError.handleAppErr)
		if (root === undefined) {
			return { initialized: false }
		}

		return { initialized: true, rootUnitId: root.id }
	}

	async initRootUnit(param: UnitParams): Promise<UnitParams> {
		log.trace('UnitController.initRootUnit param', { param })

		const { initialized } = await this.isInitRootUnit()
		if (initialized) {
			throw AppError.handleAppErr(
				AppError.unavailable('Root unit is already initialized')
			)
		}

		const [created] = await this.create([{ ...param, parentId: null }])
		return created
	}

	async delete(
		units: InteralUnitDB[],
		validUnitIds: number[]
	): Promise<InteralUnitDB[]> {
		log.trace('UnitController.delete params', {
			params: units,
			validUnitIds
		})
		const ids = units.map((u) => u.id)
		const checkUnitIds = ids.every((id) => validUnitIds.includes(id))
		if (checkUnitIds === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission delete unit with this id"
				)
			)
		}

		const existingUnits = await this.repo.findByIds(ids)
		const rootUnits = existingUnits.filter(
			(u) => u.parentId === null || u.parentId === undefined
		)
		if (rootUnits.length > 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Root unit(s) can't be deleted: ${rootUnits.map((u) => u.name).join(', ')}`
				)
			)
		}

		return this.repo.delete(units).catch(AppError.handleAppErr)
	}

	async update(
		params: InteralUnitDB[],
		validUnitIds: number[]
	): Promise<InteralUnitDB[]> {
		log.trace('UnitController.update params', { params, validUnitIds })

		const ids = params.map((u) => u.id)
		const isIdsEmpty = ids.length === 0
		if (isIdsEmpty) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const isValidRequest = ids.every((id) => validUnitIds.includes(id))
		if (isValidRequest === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission update this unit"
				)
			)
		}

		const existingUnits = await this.repo.findByIds(ids)
		const existingById = new Map(existingUnits.map((u) => [u.id, u]))

		for (const param of params) {
			const existing = existingById.get(param.id)
			if (existing === undefined) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(`Unit not found: ${param.id}`)
				)
			}

			const effectiveLevel = param.level ?? existing.level
			const effectiveParentId =
				param.parentId !== undefined
					? param.parentId
					: existing.parentId

			await this.validateHierarchy(
				effectiveLevel,
				effectiveParentId,
				param.id
			)
		}
		await this.validateCommanders(params)

		const updateMap: UpdateUnitMap = params.map(
			({ id, ...updatePayload }) => {
				const cleanupPayload = Object.fromEntries(
					Object.entries(updatePayload).filter(
						([_, value]) => value !== undefined
					)
				)

				const isUpdatePayloadEmpty =
					Object.keys(cleanupPayload).length === 0
				if (isUpdatePayloadEmpty) {
					throw AppError.handleAppErr(
						AppError.invalidArgument(
							`No update data provided. At least one field must be provided to update record with id: ${id}`
						)
					)
				}

				return { id, updatePayload: cleanupPayload }
			}
		)

		return this.repo.update(updateMap).catch(AppError.handleAppErr)
	}

	find(q: GetUnitsQuery, unitIds: number[]): Promise<Unit[]> {
		log.trace('UnitController.find params', { params: q })

		if (unitIds === undefined || unitIds.length === 0) {
			return Promise.resolve([])
		}
		const getUnitsQuery: UnitQuery = {
			ids: unitIds
		}

		if (q.level !== undefined) {
			getUnitsQuery.level = q.level
		}

		return this.repo.find(getUnitsQuery)
	}

	findAll(): Promise<Unit[]> {
		return this.repo.findAll()
	}

	findById(id: number): Promise<Unit | undefined> {
		log.trace('UnitController.findById params', { params: { id } })

		return this.repo
			.findById(id, {
				with: { parent: true, children: true, classes: true }
			})
			.catch(AppError.handleAppErr)
	}

	async findOne({
		validUnitIds,
		...p
	}: findOneRequest): Promise<Unit | undefined> {
		const params = { ...p } as InteralUnitDB
		log.trace('UnitController.findOne params', {
			params,
			id: params.id,
			validUnitIds
		})

		const unit = await this.repo.getOne(params).catch(AppError.handleAppErr)
		if (unit === undefined) {
			AppError.handleAppErr(AppError.invalidArgument('Invalid unit'))
		}

		const isValidUnitId = validUnitIds.includes(unit.id)
		if (isValidUnitId === false) {
			AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to read those units"
				)
			)
		}
		return unit
	}
}

const unitController = new controller(unitRepo)

export default unitController

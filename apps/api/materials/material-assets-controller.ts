import log from 'encore.dev/log'
import { MaterialAssetEventRepository, MaterialAssetRepository } from '.'
import { AppError } from '../errors'
import {
	MaterialAsset,
	MaterialAssetDB,
	MaterialAssetParams,
	MaterialAssetQuery,
	UpdateMaterialAssetMap
} from '../schema/material-assets'
import { MaterialAssetEventParams } from '../schema/material-asset-events'
import materialAssetRepo from './material-assets-repo'
import materialAssetEventRepo from './material-asset-events-repo'

class controller {
	constructor(
		private readonly repo: MaterialAssetRepository,
		private readonly eventsRepo: MaterialAssetEventRepository
	) {}

	async create(
		params: MaterialAssetParams[],
		actorUserId?: number
	): Promise<MaterialAssetDB[]> {
		log.trace('MaterialAssetController.create params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Empty request data')
			)
		}

		const created = await this.repo
			.create(params)
			.catch(AppError.handleAppErr)

		const events: MaterialAssetEventParams[] = []
		for (const asset of created) {
			if (
				asset.assignedTrooperId !== null &&
				asset.assignedTrooperId !== undefined
			) {
				const full = await this.repo.getOne({ id: asset.id })
				events.push({
					assetId: asset.id,
					eventType: 'assigned',
					newValue: {
						assignedTrooperName: full?.assignedTrooper?.fullName
					},
					actorUserId
				})
			}
		}
		if (events.length > 0) {
			await this.eventsRepo.create(events).catch(AppError.handleAppErr)
		}

		return created
	}

	async update(
		params: { id: number; updatePayload: Record<string, unknown> }[],
		validUnitIds: number[],
		actorUserId?: number
	): Promise<MaterialAssetDB[]> {
		log.trace('MaterialAssetController.update params', { params })

		const ids = params.map((p) => p.id)
		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((a) => validUnitIds.includes(a.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to update those material assets"
				)
			)
		}

		const beforeById = new Map<number, MaterialAsset | undefined>()
		for (const id of ids) {
			beforeById.set(id, await this.repo.getOne({ id }))
		}

		const updated = await this.repo
			.update(params as UpdateMaterialAssetMap)
			.catch(AppError.handleAppErr)

		const events: MaterialAssetEventParams[] = []
		for (const asset of updated) {
			const before = beforeById.get(asset.id)
			if (before === undefined) continue

			const after = await this.repo.getOne({ id: asset.id })
			if (after === undefined) continue

			if (before.assignedTrooperId !== asset.assignedTrooperId) {
				if (
					asset.assignedTrooperId !== null &&
					asset.assignedTrooperId !== undefined
				) {
					events.push({
						assetId: asset.id,
						eventType: 'assigned',
						previousValue: {
							assignedTrooperName:
								before.assignedTrooper?.fullName
						},
						newValue: {
							assignedTrooperName: after.assignedTrooper?.fullName
						},
						actorUserId
					})
				} else {
					events.push({
						assetId: asset.id,
						eventType: 'unassigned',
						previousValue: {
							assignedTrooperName:
								before.assignedTrooper?.fullName
						},
						newValue: {},
						actorUserId
					})
				}
			}

			if (before.condition !== asset.condition) {
				events.push({
					assetId: asset.id,
					eventType: 'condition_changed',
					previousValue: { condition: before.condition },
					newValue: { condition: asset.condition },
					actorUserId
				})
			}

			if (before.status !== asset.status) {
				events.push({
					assetId: asset.id,
					eventType: 'status_changed',
					previousValue: { status: before.status },
					newValue: { status: asset.status },
					actorUserId
				})
			}

			if (
				before.unitId !== asset.unitId ||
				before.roomId !== asset.roomId
			) {
				events.push({
					assetId: asset.id,
					eventType: 'transferred',
					previousValue: {
						unitName: before.unit?.name,
						roomName: before.room?.name
					},
					newValue: {
						unitName: after.unit?.name,
						roomName: after.room?.name
					},
					actorUserId
				})
			}
		}

		if (events.length > 0) {
			await this.eventsRepo.create(events).catch(AppError.handleAppErr)
		}

		return updated
	}

	async delete(
		ids: number[],
		validUnitIds: number[]
	): Promise<MaterialAssetDB[]> {
		log.trace('MaterialAssetController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((a) => validUnitIds.includes(a.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to delete those material assets"
				)
			)
		}

		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(
		unitIds: number[],
		filters: Omit<MaterialAssetQuery, 'unitIds'>
	): Promise<MaterialAsset[]> {
		log.trace('MaterialAssetController.find', { unitIds, filters })

		if (unitIds.length === 0) {
			return Promise.resolve([])
		}

		return this.repo
			.find({ unitIds, ...filters })
			.catch(AppError.handleAppErr)
	}
}

const materialAssetController = new controller(
	materialAssetRepo,
	materialAssetEventRepo
)

export default materialAssetController

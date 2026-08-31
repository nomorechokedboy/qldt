import log from 'encore.dev/log'
import { BuildingRepository } from '.'
import { AppError } from '../errors'
import {
	Building,
	BuildingDB,
	BuildingParams,
	UpdateBuildingMap
} from '../schema/buildings'
import buildingRepo from './buildings-repo'

class controller {
	constructor(private readonly repo: BuildingRepository) {}

	async create(params: BuildingParams[]): Promise<BuildingDB[]> {
		log.trace('BuildingController.create params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Empty request data')
			)
		}

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async update(
		params: { id: number; updatePayload: Record<string, unknown> }[],
		validUnitIds: number[]
	): Promise<BuildingDB[]> {
		log.trace('BuildingController.update params', { params })

		const ids = params.map((p) => p.id)
		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((b) => validUnitIds.includes(b.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to update those buildings"
				)
			)
		}

		return this.repo
			.update(params as UpdateBuildingMap)
			.catch(AppError.handleAppErr)
	}

	async delete(ids: number[], validUnitIds: number[]): Promise<BuildingDB[]> {
		log.trace('BuildingController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((b) => validUnitIds.includes(b.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to delete those buildings"
				)
			)
		}

		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(unitIds: number[]): Promise<Building[]> {
		log.trace('BuildingController.find', { unitIds })

		if (unitIds.length === 0) {
			return Promise.resolve([])
		}

		return this.repo.find({ unitIds }).catch(AppError.handleAppErr)
	}
}

const buildingController = new controller(buildingRepo)

export default buildingController

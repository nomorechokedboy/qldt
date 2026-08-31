import log from 'encore.dev/log'
import { MaterialStockRepository } from '.'
import { AppError } from '../errors'
import {
	MaterialStock,
	MaterialStockDB,
	MaterialStockParams,
	MaterialStockQuery,
	UpdateMaterialStockMap
} from '../schema/material-stocks'
import materialStockRepo from './material-stocks-repo'

class controller {
	constructor(private readonly repo: MaterialStockRepository) {}

	async create(params: MaterialStockParams[]): Promise<MaterialStockDB[]> {
		log.trace('MaterialStockController.create params', { params })

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
	): Promise<MaterialStockDB[]> {
		log.trace('MaterialStockController.update params', { params })

		const ids = params.map((p) => p.id)
		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((s) => validUnitIds.includes(s.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to update those material stocks"
				)
			)
		}

		return this.repo
			.update(params as UpdateMaterialStockMap)
			.catch(AppError.handleAppErr)
	}

	async delete(
		ids: number[],
		validUnitIds: number[]
	): Promise<MaterialStockDB[]> {
		log.trace('MaterialStockController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((s) => validUnitIds.includes(s.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to delete those material stocks"
				)
			)
		}

		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(
		unitIds: number[],
		filters: Omit<MaterialStockQuery, 'unitIds'>
	): Promise<MaterialStock[]> {
		log.trace('MaterialStockController.find', { unitIds, filters })

		if (unitIds.length === 0) {
			return Promise.resolve([])
		}

		return this.repo
			.find({ unitIds, ...filters })
			.catch(AppError.handleAppErr)
	}
}

const materialStockController = new controller(materialStockRepo)

export default materialStockController

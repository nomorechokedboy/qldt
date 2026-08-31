import log from 'encore.dev/log'
import { MaterialTypeRepository } from '.'
import { AppError } from '../errors'
import {
	MaterialType,
	MaterialTypeDB,
	MaterialTypeParams,
	MaterialTypeQuery,
	UpdateMaterialTypeMap
} from '../schema/material-types'
import materialTypeRepo from './material-types-repo'

class controller {
	constructor(private readonly repo: MaterialTypeRepository) {}

	async create(params: MaterialTypeParams[]): Promise<MaterialTypeDB[]> {
		log.trace('MaterialTypeController.create params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Empty request data')
			)
		}

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async update(
		params: { id: number; updatePayload: Record<string, unknown> }[]
	): Promise<MaterialTypeDB[]> {
		log.trace('MaterialTypeController.update params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		return this.repo
			.update(params as UpdateMaterialTypeMap)
			.catch(AppError.handleAppErr)
	}

	async delete(ids: number[]): Promise<MaterialTypeDB[]> {
		log.trace('MaterialTypeController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(query: MaterialTypeQuery): Promise<MaterialType[]> {
		log.trace('MaterialTypeController.find', { query })

		return this.repo.find(query).catch(AppError.handleAppErr)
	}
}

const materialTypeController = new controller(materialTypeRepo)

export default materialTypeController

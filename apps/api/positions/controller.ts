import log from 'encore.dev/log'
import { PositionQuery, Repository, UpdatePositionMap } from '.'
import { AppError } from '../errors'
import { PositionDB, PositionParam } from '../schema/positions'
import positionRepo from './repo'

class controller {
	constructor(private readonly repo: Repository) {}

	async create(params: PositionParam[]): Promise<PositionDB[]> {
		log.trace('PositionController.create params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Empty request data')
			)
		}

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async update(params: UpdatePositionMap): Promise<PositionDB[]> {
		log.trace('PositionController.update params', { params })

		if (params.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		return this.repo.update(params).catch(AppError.handleAppErr)
	}

	async delete(ids: number[]): Promise<PositionDB[]> {
		log.trace('PositionController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(query: PositionQuery): Promise<PositionDB[]> {
		log.trace('PositionController.find', { query })

		return this.repo.find(query).catch(AppError.handleAppErr)
	}
}

const positionController = new controller(positionRepo)

export default positionController

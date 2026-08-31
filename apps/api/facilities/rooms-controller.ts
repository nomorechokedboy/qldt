import log from 'encore.dev/log'
import { RoomRepository } from '.'
import { AppError } from '../errors'
import { Room, RoomDB, RoomParams, UpdateRoomMap } from '../schema/rooms'
import roomRepo from './rooms-repo'

class controller {
	constructor(private readonly repo: RoomRepository) {}

	async create(params: RoomParams[]): Promise<RoomDB[]> {
		log.trace('RoomController.create params', { params })

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
	): Promise<RoomDB[]> {
		log.trace('RoomController.update params', { params })

		const ids = params.map((p) => p.id)
		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((r) => validUnitIds.includes(r.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to update those rooms"
				)
			)
		}

		return this.repo
			.update(params as UpdateRoomMap)
			.catch(AppError.handleAppErr)
	}

	async delete(ids: number[], validUnitIds: number[]): Promise<RoomDB[]> {
		log.trace('RoomController.delete params', { ids })

		if (ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}

		const existing = await this.repo.findByIds(ids)
		const isValid = existing.every((r) => validUnitIds.includes(r.unitId))
		if (isValid === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to delete those rooms"
				)
			)
		}

		return this.repo.delete(existing).catch(AppError.handleAppErr)
	}

	find(unitIds: number[], filters: { buildingId?: number }): Promise<Room[]> {
		log.trace('RoomController.find', { unitIds, filters })

		if (unitIds.length === 0) {
			return Promise.resolve([])
		}

		return this.repo
			.find({ unitIds, ...filters })
			.catch(AppError.handleAppErr)
	}
}

const roomController = new controller(roomRepo)

export default roomController

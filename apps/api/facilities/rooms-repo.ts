import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { RoomRepository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	Room,
	RoomDB,
	RoomParams,
	RoomQuery,
	rooms,
	UpdateRoomMap
} from '../schema/rooms'
import { handleDatabaseErr } from '../utils'

class repo implements RoomRepository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(params: RoomParams[]): Promise<RoomDB[]> {
		log.info('RoomRepo.create params: ', { params })
		return this.db
			.insert(rooms)
			.values(params)
			.returning()
			.catch(handleDatabaseErr)
	}

	update(params: UpdateRoomMap): Promise<RoomDB[]> {
		log.info('RoomRepo.update params: ', { params })

		return this.db
			.transaction(async (tx) => {
				const updatedRecords: RoomDB[] = []

				for (const { id, updatePayload } of params) {
					const updated = await tx
						.update(rooms)
						.set(updatePayload)
						.where(eq(rooms.id, id))
						.returning()

					if (updated.length > 0) {
						updatedRecords.push(updated[0])
					}
				}

				return updatedRecords
			})
			.catch(handleDatabaseErr)
	}

	delete(r: RoomDB[]): Promise<RoomDB[]> {
		const ids = r.map((room) => room.id)
		log.trace('RoomRepo.delete params: ', { params: ids })

		return this.db
			.delete(rooms)
			.where(inArray(rooms.id, ids))
			.returning()
			.catch(handleDatabaseErr)
	}

	find(query: RoomQuery): Promise<Room[]> {
		const conditions: SQL[] = []
		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(inArray(rooms.unitId, query.unitIds))
		}

		if (query.buildingId !== undefined) {
			conditions.push(eq(rooms.buildingId, query.buildingId))
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(rooms.id, query.ids))
		}

		return this.db.query.rooms
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: {
					unit: true,
					building: true,
					materialStocks: { with: { materialType: true } },
					materialAssets: { with: { materialType: true } }
				}
			})
			.catch(handleDatabaseErr) as unknown as Room[]
	}

	findByIds(ids: number[]): Promise<RoomDB[]> {
		return this.db.query.rooms
			.findMany({ where: inArray(rooms.id, ids) })
			.catch(handleDatabaseErr)
	}

	getOne(params: Partial<RoomDB>): Promise<Room | undefined> {
		if (!params || Object.keys(params).length === 0) {
			throw new Error(
				'Invalid parameters: at least one field must be provided'
			)
		}

		const conditions = Object.entries(params)
			.filter(([_, value]) => value !== undefined && value !== null)
			.map(([key, value]) => eq(rooms[key as keyof typeof rooms], value))

		if (conditions.length === 0) {
			throw new Error('Invalid parameters: no valid fields provided')
		}

		return this.db.query.rooms
			.findFirst({
				where:
					conditions.length === 1
						? conditions[0]
						: and(...conditions),
				with: {
					unit: true,
					building: true,
					materialStocks: { with: { materialType: true } },
					materialAssets: { with: { materialType: true } }
				}
			})
			.catch(handleDatabaseErr) as unknown as Room | undefined
	}
}

const roomRepo = new repo(orm)

export default roomRepo

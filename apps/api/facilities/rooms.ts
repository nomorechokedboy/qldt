import { APICallMeta, currentRequest } from 'encore.dev'
import { api, Query } from 'encore.dev/api'
import roomController from './rooms-controller'
import roomRepo from './rooms-repo'
import { setAuditContext } from '../middleware/audit'

export type RoomBody = {
	unitId: number
	buildingId?: number | null
	name: string
	type?: string
	description?: string
}

export type RoomDB = RoomBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreateRoomRequest {
	data: Array<RoomBody>
}

interface CreateRoomResponse {
	data: Array<RoomDB>
}

export const CreateRoom = api(
	{ auth: true, expose: true, method: 'POST', path: '/rooms' },
	async (body: CreateRoomRequest): Promise<CreateRoomResponse> => {
		const created = await roomController.create(body.data)

		setAuditContext({
			resourceIds: created.map((r) => r.id),
			newValue: created
		})

		return { data: created.map((r) => ({ ...r }) as RoomDB) }
	}
)

export interface GetRoomsQuery {
	buildingId?: Query<number>
}

interface GetRoomsResponse {
	data: Array<RoomDB>
}

export const GetRooms = api(
	{ auth: true, expose: true, method: 'GET', path: '/rooms' },
	async (q: GetRoomsQuery): Promise<GetRoomsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const unitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await roomController.find(unitIds, {
			buildingId: q.buildingId
		})

		return { data: data.map((r) => ({ ...r }) as RoomDB) }
	}
)

interface UpdateRoomPayload extends Partial<RoomBody> {
	id: number
}

interface UpdateRoomBody {
	data: UpdateRoomPayload[]
}

export const UpdateRooms = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/rooms' },
	async (body: UpdateRoomBody) => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const updateMap = body.data.map(({ id, ...updatePayload }) => ({
			id,
			updatePayload: Object.fromEntries(
				Object.entries(updatePayload).filter(
					([_, value]) => value !== undefined
				)
			)
		}))

		const ids = updateMap.map((u) => u.id)
		const previous = await roomRepo.findByIds(ids)
		const updated = await roomController.update(updateMap, validUnitIds)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: updated
		})

		return { data: updated.map((r) => ({ ...r }) as RoomDB) }
	}
)

interface DeleteRoomRequest {
	ids: number[]
}

interface DeleteRoomResponse {
	ids: number[]
}

export const DeleteRooms = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/rooms' },
	async (body: DeleteRoomRequest): Promise<DeleteRoomResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const deleted = await roomController.delete(body.ids, validUnitIds)

		setAuditContext({ resourceIds: body.ids, previousValue: deleted })

		return { ids: body.ids }
	}
)

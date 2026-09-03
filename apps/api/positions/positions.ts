import { api, Query } from 'encore.dev/api'
import { setAuditContext } from '../middleware/audit'
import positionController from './controller'
import positionRepo from './repo'

export type PositionBody = {
	level: string
	code: string
	name: string
	priority: number
}

export type PositionDB = PositionBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreatePositionRequest {
	data: Array<PositionBody>
}

interface CreatePositionResponse {
	data: Array<PositionDB>
}

export const CreatePositions = api(
	{ auth: true, expose: true, method: 'POST', path: '/positions' },
	async (body: CreatePositionRequest): Promise<CreatePositionResponse> => {
		const created = await positionController.create(body.data)
		const resp = created.map((p) => ({ ...p }) as PositionDB)

		setAuditContext({
			resourceIds: resp.map((p) => p.id),
			newValue: resp
		})

		return { data: resp }
	}
)

export interface GetPositionsQuery {
	level?: Query<string>
}

interface GetPositionsResponse {
	data: Array<PositionDB>
}

export const GetPositions = api(
	{ auth: true, expose: true, method: 'GET', path: '/positions' },
	async (q: GetPositionsQuery): Promise<GetPositionsResponse> => {
		const data = await positionController.find(q)

		return { data: data.map((p) => ({ ...p }) as PositionDB) }
	}
)

interface UpdatePositionPayload extends Partial<PositionBody> {
	id: number
}

export interface UpdatePositionBody {
	data: UpdatePositionPayload[]
}

export const UpdatePositions = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/positions' },
	async (body: UpdatePositionBody) => {
		const updateMap = body.data.map(({ id, ...updatePayload }) => ({
			id,
			updatePayload: Object.fromEntries(
				Object.entries(updatePayload).filter(
					([_, value]) => value !== undefined
				)
			)
		}))

		const ids = updateMap.map((u) => u.id)
		const previous = await positionRepo.findByIds(ids)
		const updated = await positionController.update(updateMap)
		const resp = updated.map((p) => ({ ...p }) as PositionDB)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: resp
		})

		return { data: resp }
	}
)

interface DeletePositionRequest {
	ids: number[]
}

interface DeletePositionResponse {
	ids: number[]
}

export const DeletePositions = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/positions' },
	async (body: DeletePositionRequest): Promise<DeletePositionResponse> => {
		const deleted = await positionController.delete(body.ids)

		setAuditContext({
			resourceIds: body.ids,
			previousValue: deleted
		})

		return { ids: body.ids }
	}
)

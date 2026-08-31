import { APICallMeta, currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import buildingController from './buildings-controller'
import buildingRepo from './buildings-repo'
import { setAuditContext } from '../middleware/audit'

export type BuildingBody = {
	unitId: number
	name: string
	description?: string
}

export type BuildingDB = BuildingBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreateBuildingRequest {
	data: Array<BuildingBody>
}

interface CreateBuildingResponse {
	data: Array<BuildingDB>
}

export const CreateBuilding = api(
	{ auth: true, expose: true, method: 'POST', path: '/buildings' },
	async (body: CreateBuildingRequest): Promise<CreateBuildingResponse> => {
		const created = await buildingController.create(body.data)

		setAuditContext({
			resourceIds: created.map((b) => b.id),
			newValue: created
		})

		return { data: created.map((b) => ({ ...b }) as BuildingDB) }
	}
)

interface GetBuildingsResponse {
	data: Array<BuildingDB>
}

export const GetBuildings = api(
	{ auth: true, expose: true, method: 'GET', path: '/buildings' },
	async (): Promise<GetBuildingsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const unitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await buildingController.find(unitIds)

		return { data: data.map((b) => ({ ...b }) as BuildingDB) }
	}
)

interface UpdateBuildingPayload extends Partial<BuildingBody> {
	id: number
}

interface UpdateBuildingBody {
	data: UpdateBuildingPayload[]
}

export const UpdateBuildings = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/buildings' },
	async (body: UpdateBuildingBody) => {
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
		const previous = await buildingRepo.findByIds(ids)
		const updated = await buildingController.update(updateMap, validUnitIds)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: updated
		})

		return { data: updated.map((b) => ({ ...b }) as BuildingDB) }
	}
)

interface DeleteBuildingRequest {
	ids: number[]
}

interface DeleteBuildingResponse {
	ids: number[]
}

export const DeleteBuildings = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/buildings' },
	async (body: DeleteBuildingRequest): Promise<DeleteBuildingResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const deleted = await buildingController.delete(body.ids, validUnitIds)

		setAuditContext({ resourceIds: body.ids, previousValue: deleted })

		return { ids: body.ids }
	}
)

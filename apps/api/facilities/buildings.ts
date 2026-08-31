import { APICallMeta, currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import buildingController from './buildings-controller'

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

		const updated = await buildingController.update(updateMap, validUnitIds)

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

		await buildingController.delete(body.ids, validUnitIds)

		return { ids: body.ids }
	}
)

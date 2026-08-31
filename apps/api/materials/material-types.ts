import { api, Query } from 'encore.dev/api'
import { MaterialCategoryName } from '../schema/material-types'
import materialTypeController from './material-types-controller'

export type MaterialTypeBody = {
	name: string
	category: MaterialCategoryName
	unitOfMeasure?: string
	isSerialized: boolean
}

export type MaterialTypeDB = MaterialTypeBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreateMaterialTypeRequest {
	data: Array<MaterialTypeBody>
}

interface CreateMaterialTypeResponse {
	data: Array<MaterialTypeDB>
}

export const CreateMaterialType = api(
	{ auth: true, expose: true, method: 'POST', path: '/material-types' },
	async (
		body: CreateMaterialTypeRequest
	): Promise<CreateMaterialTypeResponse> => {
		const created = await materialTypeController.create(body.data)

		return { data: created.map((m) => ({ ...m }) as MaterialTypeDB) }
	}
)

export interface GetMaterialTypesQuery {
	category?: Query<MaterialCategoryName>
	isSerialized?: Query<boolean>
}

interface GetMaterialTypesResponse {
	data: Array<MaterialTypeDB>
}

export const GetMaterialTypes = api(
	{ auth: true, expose: true, method: 'GET', path: '/material-types' },
	async (q: GetMaterialTypesQuery): Promise<GetMaterialTypesResponse> => {
		const data = await materialTypeController.find(q)

		return { data: data.map((m) => ({ ...m }) as MaterialTypeDB) }
	}
)

interface UpdateMaterialTypePayload extends Partial<MaterialTypeBody> {
	id: number
}

export interface UpdateMaterialTypeBody {
	data: UpdateMaterialTypePayload[]
}

export const UpdateMaterialTypes = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/material-types' },
	async (body: UpdateMaterialTypeBody) => {
		const updateMap = body.data.map(({ id, ...updatePayload }) => ({
			id,
			updatePayload: Object.fromEntries(
				Object.entries(updatePayload).filter(
					([_, value]) => value !== undefined
				)
			)
		}))

		const updated = await materialTypeController.update(updateMap)

		return { data: updated.map((m) => ({ ...m }) as MaterialTypeDB) }
	}
)

interface DeleteMaterialTypeRequest {
	ids: number[]
}

interface DeleteMaterialTypeResponse {
	ids: number[]
}

export const DeleteMaterialTypes = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/material-types' },
	async (
		body: DeleteMaterialTypeRequest
	): Promise<DeleteMaterialTypeResponse> => {
		await materialTypeController.delete(body.ids)

		return { ids: body.ids }
	}
)

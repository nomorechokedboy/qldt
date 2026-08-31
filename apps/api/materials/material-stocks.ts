import { APICallMeta, currentRequest } from 'encore.dev'
import { api, Query } from 'encore.dev/api'
import { MaterialConditionName } from '../schema/material-stocks'
import materialStockController from './material-stocks-controller'
import materialStockRepo from './material-stocks-repo'
import { setAuditContext } from '../middleware/audit'

export type MaterialStockBody = {
	materialTypeId: number
	unitId: number
	roomId?: number | null
	quantity: number
	condition?: MaterialConditionName
}

export type MaterialStockDB = MaterialStockBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface AddMaterialStockRequest {
	data: Array<MaterialStockBody>
}

interface AddMaterialStockResponse {
	data: Array<MaterialStockDB>
}

export const AddMaterialStock = api(
	{ auth: true, expose: true, method: 'POST', path: '/material-stocks' },
	async (
		body: AddMaterialStockRequest
	): Promise<AddMaterialStockResponse> => {
		const created = await materialStockController.create(body.data)

		setAuditContext({
			resourceIds: created.map((s) => s.id),
			newValue: created
		})

		return { data: created.map((s) => ({ ...s }) as MaterialStockDB) }
	}
)

export interface GetMaterialStocksQuery {
	roomId?: Query<number>
	materialTypeId?: Query<number>
}

interface GetMaterialStocksResponse {
	data: Array<MaterialStockDB>
}

export const GetMaterialStocks = api(
	{ auth: true, expose: true, method: 'GET', path: '/material-stocks' },
	async (q: GetMaterialStocksQuery): Promise<GetMaterialStocksResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const unitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await materialStockController.find(unitIds, q)

		return { data: data.map((s) => ({ ...s }) as MaterialStockDB) }
	}
)

interface UpdateMaterialStockPayload extends Partial<MaterialStockBody> {
	id: number
}

export interface UpdateMaterialStockBody {
	data: UpdateMaterialStockPayload[]
}

export const UpdateMaterialStocks = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/material-stocks' },
	async (body: UpdateMaterialStockBody) => {
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
		const previous = await materialStockRepo.findByIds(ids)
		const updated = await materialStockController.update(
			updateMap,
			validUnitIds
		)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: updated
		})

		return { data: updated.map((s) => ({ ...s }) as MaterialStockDB) }
	}
)

interface DeleteMaterialStockRequest {
	ids: number[]
}

interface DeleteMaterialStockResponse {
	ids: number[]
}

export const DeleteMaterialStocks = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/material-stocks' },
	async (
		body: DeleteMaterialStockRequest
	): Promise<DeleteMaterialStockResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const deleted = await materialStockController.delete(
			body.ids,
			validUnitIds
		)

		setAuditContext({ resourceIds: body.ids, previousValue: deleted })

		return { ids: body.ids }
	}
)

import { APICallMeta, currentRequest } from 'encore.dev'
import { api, APIError, Query } from 'encore.dev/api'
import log from 'encore.dev/log'
import dayjs from 'dayjs'
import * as v from 'valibot'
import { getTypedRequestBody } from '../utils'
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

const ExportMaterialStocksRequestSchema = v.object({
	city: v.string(),
	commanderName: v.string(),
	commanderPosition: v.string(),
	commanderRank: v.string(),
	data: v.pipe(v.array(v.record(v.string(), v.any())), v.minLength(1)),
	date: v.optional(
		v.pipe(v.string(), v.isoDate()),
		dayjs().format('YYYY-MM-DD')
	),
	reportTitle: v.string(),
	underUnitName: v.string(),
	unitName: v.string(),
	templateId: v.optional(v.number())
})

export type ExportMaterialStocksRequest = v.InferInput<
	typeof ExportMaterialStocksRequestSchema
>

export const ExportMaterialStocks = api.raw(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/material-stocks/export'
	},
	async (req, resp) => {
		try {
			const body = await getTypedRequestBody(
				req,
				ExportMaterialStocksRequestSchema
			)

			const buffer =
				await materialStockController.handleExportMaterialStocks(body)

			resp.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			)
			resp.writeHead(200, { Connection: 'close' })
			return resp.end(buffer)
		} catch (err) {
			log.error('Material stock export error', { err })

			if (err instanceof APIError) {
				throw err
			}

			throw APIError.internal('Internal error for exporting file')
		}
	}
)

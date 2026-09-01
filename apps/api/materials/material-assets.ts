import { APICallMeta, currentRequest } from 'encore.dev'
import { api, APIError, Query } from 'encore.dev/api'
import log from 'encore.dev/log'
import dayjs from 'dayjs'
import * as v from 'valibot'
import { getAuthData } from '~encore/auth'
import { getTypedRequestBody } from '../utils'
import { MaterialAssetStatus } from '../schema/material-assets'
import { MaterialConditionName } from '../schema/material-stocks'
import materialAssetController from './material-assets-controller'
import materialAssetRepo from './material-assets-repo'
import { setAuditContext } from '../middleware/audit'

export type MaterialAssetBody = {
	materialTypeId: number
	unitId: number
	roomId?: number | null
	serialNumber: string
	condition?: MaterialConditionName
	status?: MaterialAssetStatus
	assignedTrooperId?: number | null
}

export type MaterialAssetDB = MaterialAssetBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreateMaterialAssetRequest {
	data: Array<MaterialAssetBody>
}

interface CreateMaterialAssetResponse {
	data: Array<MaterialAssetDB>
}

export const CreateMaterialAsset = api(
	{ auth: true, expose: true, method: 'POST', path: '/material-assets' },
	async (
		body: CreateMaterialAssetRequest
	): Promise<CreateMaterialAssetResponse> => {
		const authData = getAuthData()
		const actorUserId = authData?.userID
			? Number(authData.userID)
			: undefined

		const created = await materialAssetController.create(
			body.data,
			actorUserId
		)
		const resp = created.map((a) => ({ ...a }) as MaterialAssetDB)

		setAuditContext({
			resourceIds: resp.map((a) => a.id),
			newValue: resp
		})

		return { data: resp }
	}
)

export interface GetMaterialAssetsQuery {
	roomId?: Query<number>
	materialTypeId?: Query<number>
	status?: Query<MaterialAssetStatus>
	assignedTrooperId?: Query<number>
}

interface GetMaterialAssetsResponse {
	data: Array<MaterialAssetDB>
}

export const GetMaterialAssets = api(
	{ auth: true, expose: true, method: 'GET', path: '/material-assets' },
	async (q: GetMaterialAssetsQuery): Promise<GetMaterialAssetsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const unitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await materialAssetController.find(unitIds, q)

		return { data: data.map((a) => ({ ...a }) as MaterialAssetDB) }
	}
)

interface UpdateMaterialAssetPayload extends Partial<MaterialAssetBody> {
	id: number
}

export interface UpdateMaterialAssetBody {
	data: UpdateMaterialAssetPayload[]
}

export const UpdateMaterialAssets = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/material-assets' },
	async (body: UpdateMaterialAssetBody) => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []
		const authData = getAuthData()
		const actorUserId = authData?.userID
			? Number(authData.userID)
			: undefined

		const updateMap = body.data.map(({ id, ...updatePayload }) => ({
			id,
			updatePayload: Object.fromEntries(
				Object.entries(updatePayload).filter(
					([_, value]) => value !== undefined
				)
			)
		}))

		const ids = updateMap.map((u) => u.id)
		const previous = await materialAssetRepo.findByIds(ids)
		const updated = await materialAssetController.update(
			updateMap,
			validUnitIds,
			actorUserId
		)
		const resp = updated.map((a) => ({ ...a }) as MaterialAssetDB)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: resp
		})

		return { data: resp }
	}
)

interface DeleteMaterialAssetRequest {
	ids: number[]
}

interface DeleteMaterialAssetResponse {
	ids: number[]
}

export const DeleteMaterialAssets = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/material-assets' },
	async (
		body: DeleteMaterialAssetRequest
	): Promise<DeleteMaterialAssetResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const deleted = await materialAssetController.delete(
			body.ids,
			validUnitIds
		)

		setAuditContext({
			resourceIds: body.ids,
			previousValue: deleted
		})

		return { ids: body.ids }
	}
)

const ExportMaterialAssetsRequestSchema = v.object({
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

export type ExportMaterialAssetsRequest = v.InferInput<
	typeof ExportMaterialAssetsRequestSchema
>

export const ExportMaterialAssets = api.raw(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/material-assets/export'
	},
	async (req, resp) => {
		try {
			const body = await getTypedRequestBody(
				req,
				ExportMaterialAssetsRequestSchema
			)

			const buffer =
				await materialAssetController.handleExportMaterialAssets(body)

			resp.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			)
			resp.writeHead(200, { Connection: 'close' })
			return resp.end(buffer)
		} catch (err) {
			log.error('Material asset export error', { err })

			if (err instanceof APIError) {
				throw err
			}

			throw APIError.internal('Internal error for exporting file')
		}
	}
)

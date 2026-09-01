import { api, Query } from 'encore.dev/api'
import { UnitDB as SchemaUnitDB, UnitLevelName, UnitParams } from '../schema'
import unitController from './controller'
import unitRepo from './repo'
import { ClassResponse } from '../classes/classes'
import { getAuthData } from '~encore/auth'
import { APICallMeta, currentRequest } from 'encore.dev'
import log from 'encore.dev/log'
import { setAuditContext } from '../middleware/audit'

type UnitBody = {
	alias: string
	name: string
	level: UnitLevelName

	parentId?: number | null

	commanderId?: number | null
	deputyCommanderId?: number | null
	politicalCommanderId?: number | null
	deputyPoliticalCommanderId?: number | null
}

export type UnitDB = UnitBody & {
	id: number
	createdAt: string
	updatedAt: string
}

interface CreateUnitRequest {
	data: Array<UnitBody>
}

interface CreateUnitResponse {
	data: Array<UnitDB>
}

export const CreateUnit = api(
	{ auth: true, expose: true, method: 'POST', path: '/units' },
	async (body: CreateUnitRequest): Promise<CreateUnitResponse> => {
		const unitParams: Array<UnitParams> = body.data.map((u) => ({
			...u
		}))

		const createdUnits = await unitController.create(unitParams)

		const resp = createdUnits.map((u) => ({ ...u }) as UnitDB)

		setAuditContext({
			resourceIds: createdUnits.map((u) => u.id!),
			newValue: createdUnits
		})

		return { data: resp }
	}
)

interface IsInitRootUnitResponse {
	data: boolean
	rootUnitId?: number
}

export const IsInitRootUnit = api(
	{
		auth: false,
		expose: true,
		method: 'GET',
		path: '/units/check-init-root'
	},
	async (): Promise<IsInitRootUnitResponse> => {
		const { initialized, rootUnitId } =
			await unitController.isInitRootUnit()

		return { data: initialized, rootUnitId }
	}
)

interface InitRootUnitRequest {
	alias: string
	name: string
	level: UnitLevelName
}

interface InitRootUnitResponse {
	data: UnitDB
}

export const InitRootUnit = api(
	{ auth: false, expose: true, method: 'POST', path: '/units/init-root' },
	async (body: InitRootUnitRequest): Promise<InitRootUnitResponse> => {
		const created = await unitController.initRootUnit({ ...body })

		return { data: created as UnitDB }
	}
)

type unit = Omit<UnitDB, 'parentId'>

export type Unit = unit & {
	parent: unit | null
	children: Unit[]
	classes: ClassResponse[]
}

export interface GetUnitsQuery {
	level?: UnitLevelName
}

interface GetUnitsResponse {
	data: Array<Unit>
}

export const GetUnits = api(
	{ auth: true, expose: true, method: 'GET', path: '/units' },
	async (q: GetUnitsQuery): Promise<GetUnitsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const unitIds = callMeta.middlewareData?.validUnitIds || []

		const resp = await unitController.find(q, unitIds)
		const data = resp.map((u) => ({ ...u }) as Unit)

		return { data }
	}
)

interface DeleteUnitRequest {
	ids: number[]
}

interface DeleteUnitResponse {
	ids: number[]
}

export const DeleteUnits = api(
	{ auth: true, expose: true, method: 'DELETE', path: '/units' },
	async (body: DeleteUnitRequest): Promise<DeleteUnitResponse> => {
		log.trace('units.DeleteUnits body', { body })
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const units: SchemaUnitDB[] = body.ids.map(
			(id) => ({ id }) as SchemaUnitDB
		)
		const deleted = await unitController.delete(units, validUnitIds)

		setAuditContext({ resourceIds: body.ids, previousValue: deleted })

		return { ids: body.ids }
	}
)

interface UpdateUnitPayload extends Partial<UnitBody> {
	id: number
}

interface UpdateUnitBody {
	data: UpdateUnitPayload[]
}

export const UpdateUnits = api(
	{ auth: true, expose: true, method: 'PATCH', path: '/units' },
	async (body: UpdateUnitBody) => {
		log.trace('units.UpdateUnits body', { body })
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const units: SchemaUnitDB[] = body.data.map(
			(u) => ({ ...u }) as SchemaUnitDB
		)
		const ids = units.map((u) => u.id)
		const previous = await unitRepo.findByIds(ids)
		const updated = await unitController.update(units, validUnitIds)

		setAuditContext({
			resourceIds: ids,
			previousValue: previous,
			newValue: updated
		})

		return {}
	}
)

interface GetUnitRequest {
	id?: Query<number>

	alias: string
	name?: Query<string>
	level?: Query<UnitLevelName>

	parentId?: Query<number> | null
}

interface GetUnitResponse {
	data: Unit | undefined
}

export const GetUnit = api(
	{ auth: true, expose: true, method: 'GET', path: '/units/:alias' },
	async ({ level, ...params }: GetUnitRequest): Promise<GetUnitResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitController
			.findOne({
				...params,
				level: level as UnitLevelName | undefined,
				validUnitIds
			})
			.then((resp) => (resp === undefined ? resp : ({ ...resp } as Unit)))
		return { data }
	}
)

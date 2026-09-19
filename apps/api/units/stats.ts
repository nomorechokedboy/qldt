import { APICallMeta, currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { UnitLevelName } from '../schema/units'
import { MaterialAssetStatus } from '../schema/material-assets'
import unitStatsController from './stats-controller'
import { Unit } from './units'

// Mirrors export/roster-utils.ts's RosterSummary shape, redeclared locally
// instead of imported: Encore's client generator names an imported type's
// module after its containing directory, and "export" collides with the
// reserved word, producing invalid generated code (`export.RosterSummary`).
interface TroopSummary {
	total: number
	sq: number
	qncn: number
	hsq: number
	bs: number
}

interface GetUnitStatsResponse {
	unit: Unit
	totalStudents: number
	buildingsCount: number
	roomsCount: number
	unitCounts: Partial<Record<UnitLevelName, number>>
	materialStockSummary: {
		materialTypeId: number
		materialTypeName: string
		totalQuantity: number
	}[]
	materialAssetSummary: { status: MaterialAssetStatus; count: number }[]
	troopSummary: TroopSummary
}

export const GetUnitStats = api(
	{ auth: true, expose: true, method: 'GET', path: '/units/:id/stats' },
	async ({ id }: { id: number }): Promise<GetUnitStatsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const stats = await unitStatsController.getStats(id, validUnitIds)

		return { ...stats, unit: stats.unit as unknown as Unit }
	}
)

interface GetUnitStatsStudentsResponse {
	data: Array<Record<string, unknown>>
}

export const GetUnitStatsStudents = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/units/:id/stats/students'
	},
	async ({ id }: { id: number }): Promise<GetUnitStatsStudentsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getStudents(id, validUnitIds)

		return { data: data.map((s) => ({ ...s })) }
	}
)

interface GetUnitStatsMaterialStocksResponse {
	data: Array<Record<string, unknown>>
}

export const GetUnitStatsMaterialStocks = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/units/:id/stats/material-stocks'
	},
	async ({
		id
	}: {
		id: number
	}): Promise<GetUnitStatsMaterialStocksResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getMaterialStocks(
			id,
			validUnitIds
		)

		return { data: data.map((s) => ({ ...s })) }
	}
)

interface GetUnitStatsMaterialAssetsResponse {
	data: Array<Record<string, unknown>>
}

export const GetUnitStatsMaterialAssets = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/units/:id/stats/material-assets'
	},
	async ({
		id
	}: {
		id: number
	}): Promise<GetUnitStatsMaterialAssetsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getMaterialAssets(
			id,
			validUnitIds
		)

		return { data: data.map((a) => ({ ...a })) }
	}
)

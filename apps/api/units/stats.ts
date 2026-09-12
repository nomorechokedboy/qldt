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
	{ auth: true, expose: true, method: 'GET', path: '/units/:alias/stats' },
	async ({ alias }: { alias: string }): Promise<GetUnitStatsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const stats = await unitStatsController.getStats(alias, validUnitIds)

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
		path: '/units/:alias/stats/students'
	},
	async ({
		alias
	}: {
		alias: string
	}): Promise<GetUnitStatsStudentsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getStudents(alias, validUnitIds)

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
		path: '/units/:alias/stats/material-stocks'
	},
	async ({
		alias
	}: {
		alias: string
	}): Promise<GetUnitStatsMaterialStocksResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getMaterialStocks(
			alias,
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
		path: '/units/:alias/stats/material-assets'
	},
	async ({
		alias
	}: {
		alias: string
	}): Promise<GetUnitStatsMaterialAssetsResponse> => {
		const callMeta = currentRequest() as APICallMeta
		const validUnitIds = callMeta.middlewareData?.validUnitIds || []

		const data = await unitStatsController.getMaterialAssets(
			alias,
			validUnitIds
		)

		return { data: data.map((a) => ({ ...a })) }
	}
)

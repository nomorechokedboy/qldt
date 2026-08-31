import { APICallMeta, currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import { UnitLevelName } from '../schema/units'
import { MaterialAssetStatus } from '../schema/material-assets'
import unitStatsController from './stats-controller'
import { Unit } from './units'

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

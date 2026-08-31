import { api } from 'encore.dev/api'
import { MaterialAssetEventType } from '../schema/material-asset-events'
import materialAssetEventRepo from './material-asset-events-repo'

export type MaterialAssetEventDB = {
	id: number
	createdAt: string
	updatedAt: string
	assetId: number
	eventType: MaterialAssetEventType
	previousValue?: Record<string, unknown> | null
	newValue?: Record<string, unknown> | null
	note?: string | null
	actor?: { id: number; displayName?: string } | null
}

interface GetMaterialAssetEventsResponse {
	data: Array<MaterialAssetEventDB>
}

export const GetMaterialAssetEvents = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/material-assets/:assetId/events'
	},
	async ({
		assetId
	}: {
		assetId: number
	}): Promise<GetMaterialAssetEventsResponse> => {
		const data = await materialAssetEventRepo.find({ assetId })

		return { data: data.map((e) => ({ ...e }) as MaterialAssetEventDB) }
	}
)

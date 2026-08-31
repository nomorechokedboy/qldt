import {
	MaterialAsset,
	MaterialAssetDB,
	MaterialAssetParams,
	MaterialAssetQuery,
	UpdateMaterialAssetMap
} from '../schema/material-assets'
import {
	MaterialAssetEvent,
	MaterialAssetEventDB,
	MaterialAssetEventParams,
	MaterialAssetEventQuery
} from '../schema/material-asset-events'
import {
	MaterialStock,
	MaterialStockDB,
	MaterialStockParams,
	MaterialStockQuery,
	UpdateMaterialStockMap
} from '../schema/material-stocks'
import {
	MaterialType,
	MaterialTypeDB,
	MaterialTypeParams,
	MaterialTypeQuery,
	UpdateMaterialTypeMap
} from '../schema/material-types'

export interface MaterialTypeRepository {
	create(params: MaterialTypeParams[]): Promise<MaterialTypeDB[]>
	update(params: UpdateMaterialTypeMap): Promise<MaterialTypeDB[]>
	delete(materialTypes: MaterialTypeDB[]): Promise<MaterialTypeDB[]>
	find(query: MaterialTypeQuery): Promise<MaterialType[]>
	findByIds(ids: number[]): Promise<MaterialTypeDB[]>
	getOne(params: Partial<MaterialTypeDB>): Promise<MaterialType | undefined>
}

export interface MaterialStockRepository {
	create(params: MaterialStockParams[]): Promise<MaterialStockDB[]>
	update(params: UpdateMaterialStockMap): Promise<MaterialStockDB[]>
	delete(materialStocks: MaterialStockDB[]): Promise<MaterialStockDB[]>
	find(query: MaterialStockQuery): Promise<MaterialStock[]>
	findByIds(ids: number[]): Promise<MaterialStockDB[]>
	getOne(params: Partial<MaterialStockDB>): Promise<MaterialStock | undefined>
}

export interface MaterialAssetRepository {
	create(params: MaterialAssetParams[]): Promise<MaterialAssetDB[]>
	update(params: UpdateMaterialAssetMap): Promise<MaterialAssetDB[]>
	delete(materialAssets: MaterialAssetDB[]): Promise<MaterialAssetDB[]>
	find(query: MaterialAssetQuery): Promise<MaterialAsset[]>
	findByIds(ids: number[]): Promise<MaterialAssetDB[]>
	getOne(params: Partial<MaterialAssetDB>): Promise<MaterialAsset | undefined>
}

export interface MaterialAssetEventRepository {
	create(params: MaterialAssetEventParams[]): Promise<MaterialAssetEventDB[]>
	find(query: MaterialAssetEventQuery): Promise<MaterialAssetEvent[]>
}

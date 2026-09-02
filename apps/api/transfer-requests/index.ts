import {
	CreateTransferRequestMaterialAssetInput,
	CreateTransferRequestMaterialStockInput,
	CreateTransferRequestTrooperInput,
	TransferRequest,
	TransferRequestDB,
	TransferRequestItemStatus,
	TransferRequestParams,
	TransferRequestQuery,
	UpdateTransferRequestMap
} from '../schema/transfer-requests'

export interface Repository {
	create(
		header: TransferRequestParams,
		items: {
			troopers: CreateTransferRequestTrooperInput[]
			materialAssets: CreateTransferRequestMaterialAssetInput[]
			materialStocks: CreateTransferRequestMaterialStockInput[]
		}
	): Promise<TransferRequestDB>
	find(query: TransferRequestQuery): Promise<TransferRequest[]>
	getOne(id: number): Promise<TransferRequest | undefined>
	update(params: UpdateTransferRequestMap): Promise<TransferRequestDB[]>
	setTrooperItemStatus(
		id: number,
		status: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void>
	setMaterialAssetItemStatus(
		id: number,
		status: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void>
	setMaterialStockItemStatus(
		id: number,
		status: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void>
}

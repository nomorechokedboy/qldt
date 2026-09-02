import { and, eq, inArray, SQL } from 'drizzle-orm'
import log from 'encore.dev/log'
import { Repository } from '.'
import orm, { DrizzleDatabase } from '../database'
import {
	CreateTransferRequestMaterialAssetInput,
	CreateTransferRequestMaterialStockInput,
	CreateTransferRequestTrooperInput,
	TransferRequest,
	TransferRequestDB,
	TransferRequestItemStatus,
	TransferRequestParams,
	TransferRequestQuery,
	transferRequestMaterialAssets,
	transferRequestMaterialStocks,
	transferRequestTroopers,
	transferRequests,
	UpdateTransferRequestMap
} from '../schema/transfer-requests'
import { handleDatabaseErr } from '../utils'

const WITH_DETAILS = {
	sourceUnit: true,
	destinationUnit: true,
	destinationRoom: true,
	requestedBy: { columns: { password: false } },
	approver: { columns: { password: false } },
	decidedBy: { columns: { password: false } },
	troopers: { with: { student: true } },
	materialAssetItems: { with: { materialAsset: true } },
	materialStockItems: { with: { materialType: true } }
} as const

class repo implements Repository {
	constructor(private readonly db: DrizzleDatabase) {}

	create(
		header: TransferRequestParams,
		items: {
			troopers: CreateTransferRequestTrooperInput[]
			materialAssets: CreateTransferRequestMaterialAssetInput[]
			materialStocks: CreateTransferRequestMaterialStockInput[]
		}
	): Promise<TransferRequestDB> {
		log.info('TransferRequestRepo.create params', { header, items })

		return this.db
			.transaction(async (tx) => {
				const [created] = await tx
					.insert(transferRequests)
					.values(header)
					.returning()

				if (items.troopers.length > 0) {
					await tx.insert(transferRequestTroopers).values(
						items.troopers.map((t) => ({
							transferRequestId: created.id,
							studentId: t.studentId
						}))
					)
				}

				if (items.materialAssets.length > 0) {
					await tx.insert(transferRequestMaterialAssets).values(
						items.materialAssets.map((m) => ({
							transferRequestId: created.id,
							materialAssetId: m.materialAssetId
						}))
					)
				}

				if (items.materialStocks.length > 0) {
					await tx.insert(transferRequestMaterialStocks).values(
						items.materialStocks.map((m) => ({
							transferRequestId: created.id,
							materialTypeId: m.materialTypeId,
							condition: m.condition,
							quantity: m.quantity
						}))
					)
				}

				return created
			})
			.catch(handleDatabaseErr)
	}

	find(query: TransferRequestQuery): Promise<TransferRequest[]> {
		const conditions: SQL[] = []

		if (query.unitIds !== undefined && query.unitIds.length > 0) {
			conditions.push(
				inArray(transferRequests.sourceUnitId, query.unitIds)
			)
		}

		if (query.status !== undefined) {
			conditions.push(eq(transferRequests.status, query.status))
		}

		if (query.requestedByUserId !== undefined) {
			conditions.push(
				eq(transferRequests.requestedByUserId, query.requestedByUserId)
			)
		}

		if (query.approverUserId !== undefined) {
			conditions.push(
				eq(transferRequests.approverUserId, query.approverUserId)
			)
		}

		if (query.ids !== undefined && query.ids.length > 0) {
			conditions.push(inArray(transferRequests.id, query.ids))
		}

		return this.db.query.transferRequests
			.findMany({
				where:
					conditions.length === 0
						? undefined
						: conditions.length === 1
							? conditions[0]
							: and(...conditions),
				with: WITH_DETAILS,
				orderBy: (t, { desc }) => [desc(t.createdAt)]
			})
			.catch(handleDatabaseErr) as unknown as Promise<TransferRequest[]>
	}

	getOne(id: number): Promise<TransferRequest | undefined> {
		return this.db.query.transferRequests
			.findFirst({
				where: eq(transferRequests.id, id),
				with: WITH_DETAILS
			})
			.catch(handleDatabaseErr) as unknown as Promise<
			TransferRequest | undefined
		>
	}

	update(params: UpdateTransferRequestMap): Promise<TransferRequestDB[]> {
		log.info('TransferRequestRepo.update params', { params })

		return this.db
			.transaction(async (tx) => {
				const updated: TransferRequestDB[] = []

				for (const { id, updatePayload } of params) {
					const rows = await tx
						.update(transferRequests)
						.set(updatePayload)
						.where(eq(transferRequests.id, id))
						.returning()

					if (rows.length > 0) {
						updated.push(rows[0])
					}
				}

				return updated
			})
			.catch(handleDatabaseErr)
	}

	async setTrooperItemStatus(
		id: number,
		itemStatus: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void> {
		await this.db
			.update(transferRequestTroopers)
			.set({ itemStatus, failureReason: failureReason ?? null })
			.where(eq(transferRequestTroopers.id, id))
			.catch(handleDatabaseErr)
	}

	async setMaterialAssetItemStatus(
		id: number,
		itemStatus: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void> {
		await this.db
			.update(transferRequestMaterialAssets)
			.set({ itemStatus, failureReason: failureReason ?? null })
			.where(eq(transferRequestMaterialAssets.id, id))
			.catch(handleDatabaseErr)
	}

	async setMaterialStockItemStatus(
		id: number,
		itemStatus: TransferRequestItemStatus,
		failureReason?: string
	): Promise<void> {
		await this.db
			.update(transferRequestMaterialStocks)
			.set({ itemStatus, failureReason: failureReason ?? null })
			.where(eq(transferRequestMaterialStocks.id, id))
			.catch(handleDatabaseErr)
	}
}

const transferRequestRepo = new repo(orm)

export default transferRequestRepo

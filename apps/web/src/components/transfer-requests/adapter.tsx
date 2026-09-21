import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { transfer_requests } from '@/api/client'
import {
	DetailRow,
	ItemRow,
	ItemSection
} from '@/components/proposals/detail-parts'
import type {
	ExtraRowAction,
	ProposalAdapter
} from '@/components/proposals/proposal-adapter'
import useTransferRequests from '@/hooks/useTransferRequests'
import {
	useApproveTransferRequest,
	useCancelTransferRequest,
	useExportTransferRequestHandover,
	useRejectTransferRequest
} from '@/hooks/useTransferRequestActions'
import { toastApiError } from '@/lib/api-error'
import CreateTransferRequestForm from './create-transfer-request-form'

export type TransferRequestRow = transfer_requests.TransferRequestResp

const hasMaterialItems = (row: TransferRequestRow) =>
	!!row.materialAssetItems?.length || !!row.materialStockItems?.length

// What is moving, e.g. "1 quân nhân, 2 khí tài".
function resourceSummary(t: TFunction<'proposals'>, row: TransferRequestRow) {
	const parts: string[] = []
	if (row.troopers?.length)
		parts.push(t('transfer.trooperSummary', { count: row.troopers.length }))
	if (row.materialAssetItems?.length)
		parts.push(
			t('transfer.assetSummary', { count: row.materialAssetItems.length })
		)
	if (row.materialStockItems?.length)
		parts.push(
			t('transfer.stockSummary', { count: row.materialStockItems.length })
		)
	return parts.length > 0 ? parts.join(', ') : '—'
}

// Once approved, a request that moves materials can be exported as a handover
// report.
function useExportHandoverAction(): ExtraRowAction<TransferRequestRow> {
	const { t } = useTranslation('proposals')
	const { mutateAsync, isPending } = useExportTransferRequestHandover()

	const run = useCallback(
		async (id: number) => {
			try {
				await mutateAsync(id)
			} catch (err) {
				toastApiError(t('transfer.exportFailed'), err)
			}
		},
		[t, mutateAsync]
	)

	return useMemo(
		() => ({
			label: t('transfer.exportHandover'),
			isVisible: (row) =>
				row.status === 'approved' && hasMaterialItems(row),
			run,
			isPending
		}),
		[t, run, isPending]
	)
}

const middleColumns = (
	t: TFunction<'proposals'>
): ColumnDef<TransferRequestRow>[] => [
	{
		id: 'sourceUnit.name',
		accessorFn: (row) => row.sourceUnit?.name ?? '',
		header: t('transfer.source'),
		cell: ({ row }) => row.original.sourceUnit?.name ?? '—'
	},
	{
		id: 'destinationUnit.name',
		accessorFn: (row) => row.destinationUnit?.name ?? '',
		header: t('transfer.destination'),
		cell: ({ row }) => row.original.destinationUnit?.name ?? '—'
	},
	{
		id: 'resourceSummary',
		header: t('transfer.resources'),
		cell: ({ row }) => (
			<span className='text-sm'>{resourceSummary(t, row.original)}</span>
		)
	}
]

export const transferRequestAdapter: ProposalAdapter<TransferRequestRow> = {
	kind: 'transfer',
	permissionPrefix: 'transfer_requests',
	requestedByKey: 'transfer.requestedBy',
	useList: (status) =>
		useTransferRequests({
			status: status as transfer_requests.GetTransferRequestsQuery['status']
		}),
	useApprove: useApproveTransferRequest,
	useCancel: useCancelTransferRequest,
	useReject: useRejectTransferRequest,
	useExtraAction: useExportHandoverAction,
	CreateForm: CreateTransferRequestForm,
	middleColumns,
	renderLead: (row, t) => (
		<>
			<DetailRow label={t('transfer.sourceUnit')}>
				{row.sourceUnit?.name ?? '—'}
			</DetailRow>
			<DetailRow label={t('transfer.destinationUnit')}>
				{row.destinationUnit?.name ?? '—'}
			</DetailRow>
			<DetailRow label={t('transfer.destinationRoom')}>
				{row.destinationRoom?.name ?? '—'}
			</DetailRow>
		</>
	),
	renderExtraSections: (row, t) => (
		<>
			{!!row.materialAssetItems?.length && (
				<ItemSection title={t('transfer.assets')}>
					{row.materialAssetItems.map((m) => (
						<ItemRow
							key={m.id}
							label={m.materialAsset?.serialNumber ?? `#${m.id}`}
							itemStatus={m.itemStatus}
							failureReason={m.failureReason}
						/>
					))}
				</ItemSection>
			)}
			{!!row.materialStockItems?.length && (
				<ItemSection title={t('transfer.stocks')}>
					{row.materialStockItems.map((m) => (
						<ItemRow
							key={m.id}
							label={`${m.materialType?.name ?? `#${m.id}`} (${m.condition}) x ${m.quantity}`}
							itemStatus={m.itemStatus}
							failureReason={m.failureReason}
						/>
					))}
				</ItemSection>
			)}
		</>
	)
}

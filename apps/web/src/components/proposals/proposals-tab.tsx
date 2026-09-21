import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import DataTableSkeleton from '@/components/data-table-skeleton'
import { ErrorState } from '@/components/error-state'
import RefreshButton from '@/components/refresh-button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import useAuth from '@/hooks/useAuth'
import { toastApiError } from '@/lib/api-error'
import { getProposalColumns } from './columns'
import type { ProposalAdapter, ProposalRow } from './proposal-adapter'
import ProposalDetailSheet from './proposal-detail-sheet'
import RejectDialog from './reject-dialog'
import { STATUS_VALUES } from './status'

export default function ProposalsTab<TRow extends ProposalRow>({
	adapter
}: {
	adapter: ProposalAdapter<TRow>
}) {
	const { t } = useTranslation('proposals')
	const { kind, CreateForm } = adapter
	const [status, setStatus] = useState<string>('')
	const [selected, setSelected] = useState<TRow | null>(null)
	const [rejectingId, setRejectingId] = useState<number | null>(null)

	const { user, hasPermission } = useAuth()

	const { data, isLoading, error, refetch } = adapter.useList(
		status || undefined
	)

	const approveMutation = adapter.useApprove()
	const cancelMutation = adapter.useCancel()

	const canApprove = hasPermission(`${adapter.permissionPrefix}:approve`)
	const canReject = hasPermission(`${adapter.permissionPrefix}:reject`)

	const { mutateAsync: approve } = approveMutation
	const { mutateAsync: cancel } = cancelMutation

	const handleApprove = useCallback(
		async (id: number) => {
			if (!confirm(t(`${kind}.confirmApprove`))) return
			try {
				await approve(id)
				toast.success(t(`${kind}.approved`))
			} catch (err) {
				toastApiError(t(`${kind}.approveFailed`), err)
			}
		},
		[t, kind, approve]
	)

	const handleCancel = useCallback(
		async (id: number) => {
			if (!confirm(t(`${kind}.confirmCancel`))) return
			try {
				await cancel(id)
				toast.success(t(`${kind}.cancelled`))
			} catch (err) {
				toastApiError(t(`${kind}.cancelFailed`), err)
			}
		},
		[t, kind, cancel]
	)

	const columns = useMemo(
		() =>
			getProposalColumns<TRow>({
				t,
				targetColumn: adapter.targetColumn(t),
				currentUserId: user?.id,
				canApprove,
				canReject,
				isApproving: approveMutation.isPending,
				isCancelling: cancelMutation.isPending,
				onView: setSelected,
				onApprove: handleApprove,
				onReject: setRejectingId,
				onCancel: handleCancel
			}),
		[
			t,
			adapter,
			user?.id,
			canApprove,
			canReject,
			approveMutation.isPending,
			cancelMutation.isPending,
			handleApprove,
			handleCancel
		]
	)

	if (error) {
		return <ErrorState error={error as Error} onRetry={() => refetch()} />
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<Select
					value={status || 'all'}
					onValueChange={(v) => setStatus(v === 'all' ? '' : v)}
				>
					<SelectTrigger className='h-8 w-[180px]'>
						<SelectValue placeholder={t('status.label')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>{t('status.all')}</SelectItem>
						{STATUS_VALUES.map((value) => (
							<SelectItem key={value} value={value}>
								{t(`status.${value}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className='flex items-center gap-3'>
					<CreateForm onSuccess={() => refetch()} />
					<RefreshButton onRefresh={() => refetch()} />
				</div>
			</div>

			{isLoading ? (
				<DataTableSkeleton columns={7} rows={8} />
			) : (
				<DataTable
					columns={columns}
					data={data ?? []}
					toolbarVisible={false}
					placeholder={t(`${kind}.emptyTable`)}
					getRowId={(row) => String(row.id)}
				/>
			)}

			<ProposalDetailSheet
				adapter={adapter}
				proposal={selected}
				onClose={() => setSelected(null)}
			/>

			{rejectingId !== null && (
				<RejectDialog
					adapter={adapter}
					id={rejectingId}
					open
					onOpenChange={(open) => !open && setRejectingId(null)}
				/>
			)}
		</div>
	)
}

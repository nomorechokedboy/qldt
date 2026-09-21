import type { activity_status_proposals } from '@/api/client'
import type { ProposalAdapter } from '@/components/proposals/proposal-adapter'
import { activityStatusLabel } from '@/data/activity-statuses'
import {
	useApproveActivityStatusProposal,
	useCancelActivityStatusProposal,
	useRejectActivityStatusProposal
} from '@/hooks/useActivityStatusProposalActions'
import useActivityStatusProposals from '@/hooks/useActivityStatusProposals'
import { formatDbTimestamp } from '@/lib/utils'
import CreateActivityStatusProposalForm from './create-proposal-form'
import { isRangedTarget } from './date-range'

export type ActivityStatusProposalRow =
	activity_status_proposals.ActivityStatusProposalResp

type Dates = {
	effectiveDate: string | null
	startDate: string | null
	endDate: string | null
}

// A trooper's own dates, when set, win over the proposal's. Only the dates
// that apply to the target status are returned.
function resolveDates(target: string, header: Dates, override?: Dates): Dates {
	if (!isRangedTarget(target)) {
		return {
			effectiveDate: override?.effectiveDate ?? header.effectiveDate,
			startDate: null,
			endDate: null
		}
	}
	return {
		effectiveDate: null,
		startDate: override?.startDate ?? header.startDate,
		endDate: override?.endDate ?? header.endDate
	}
}

export const activityStatusAdapter: ProposalAdapter<ActivityStatusProposalRow> =
	{
		kind: 'activity',
		permissionPrefix: 'activity_status_proposals',
		useList: (status) =>
			useActivityStatusProposals({
				status: status as activity_status_proposals.GetActivityStatusProposalsQuery['status']
			}),
		useApprove: useApproveActivityStatusProposal,
		useCancel: useCancelActivityStatusProposal,
		useReject: useRejectActivityStatusProposal,
		CreateForm: CreateActivityStatusProposalForm,
		targetColumn: (t) => ({
			id: 'targetActivityStatus',
			accessorKey: 'targetActivityStatus',
			header: t('activity.targetStatus'),
			cell: ({ row }) =>
				activityStatusLabel(row.original.targetActivityStatus)
		}),
		renderTarget: (row, t) => (
			<>
				<span className='text-muted-foreground'>
					{t('activity.targetStatus')}
				</span>
				<span>{activityStatusLabel(row.targetActivityStatus)}</span>
			</>
		),
		renderDates: (row, t) =>
			isRangedTarget(row.targetActivityStatus) ? (
				<>
					<span className='text-muted-foreground'>
						{t('activity.startDate')}
					</span>
					<span>{row.startDate ?? '—'}</span>
					<span className='text-muted-foreground'>
						{t('activity.endDate')}
					</span>
					<span>{row.endDate ?? '—'}</span>
				</>
			) : (
				<>
					<span className='text-muted-foreground'>
						{t('common.effectiveDate')}
					</span>
					<span>{row.effectiveDate ?? '—'}</span>
				</>
			),
		renderTrooperMeta: (row, trooper, t) => {
			const dates = resolveDates(row.targetActivityStatus, row, trooper)
			return isRangedTarget(row.targetActivityStatus) ? (
				<span>
					{dates.startDate ?? '—'} → {dates.endDate ?? '—'}
				</span>
			) : (
				<span>
					{t('common.itemEffectiveDate', {
						date: dates.effectiveDate ?? '—'
					})}
				</span>
			)
		},
		renderTrooperEnd: (trooper, t) =>
			trooper.revertedAt && (
				<span>
					{t('activity.itemRevertedAt', {
						date: formatDbTimestamp(trooper.revertedAt)
					})}
				</span>
			)
	}

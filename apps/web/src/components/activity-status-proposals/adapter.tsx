import type { activity_status_proposals } from '@/api/client'
import { unitTargetTrooperColumns } from '@/components/proposals/columns'
import { DetailRow } from '@/components/proposals/detail-parts'
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
		middleColumns: (t) =>
			unitTargetTrooperColumns(t, {
				id: 'targetActivityStatus',
				accessorKey: 'targetActivityStatus',
				header: t('activity.targetStatus'),
				cell: ({ row }) =>
					activityStatusLabel(row.original.targetActivityStatus)
			}),
		renderLead: (row, t) => (
			<>
				<DetailRow label={t('common.unit')}>
					{row.unit?.name ?? '—'}
				</DetailRow>
				<DetailRow label={t('activity.targetStatus')}>
					{activityStatusLabel(row.targetActivityStatus)}
				</DetailRow>
			</>
		),
		renderDates: (row, t) =>
			isRangedTarget(row.targetActivityStatus) ? (
				<>
					<DetailRow label={t('activity.startDate')}>
						{row.startDate ?? '—'}
					</DetailRow>
					<DetailRow label={t('activity.endDate')}>
						{row.endDate ?? '—'}
					</DetailRow>
				</>
			) : (
				<DetailRow label={t('common.effectiveDate')}>
					{row.effectiveDate ?? '—'}
				</DetailRow>
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

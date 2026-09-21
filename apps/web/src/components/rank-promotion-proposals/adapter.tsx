import type { rank_promotion_proposals } from '@/api/client'
import type { ProposalAdapter } from '@/components/proposals/proposal-adapter'
import {
	useApproveRankPromotionProposal,
	useCancelRankPromotionProposal,
	useRejectRankPromotionProposal
} from '@/hooks/useRankPromotionProposalActions'
import useRankPromotionProposals from '@/hooks/useRankPromotionProposals'
import CreateRankPromotionProposalForm from './create-proposal-form'

export type RankPromotionProposalRow =
	rank_promotion_proposals.RankPromotionProposalResp

// A trooper's own rank / date, when set, wins over the proposal's.
function resolveRank(
	header: { targetRank: string },
	override?: { targetRank: string | null }
): string {
	return override?.targetRank ?? header.targetRank
}

function resolveDate(
	header: { effectiveDate: string | null },
	override?: { effectiveDate: string | null }
): string | null {
	return override?.effectiveDate ?? header.effectiveDate
}

export const rankPromotionAdapter: ProposalAdapter<RankPromotionProposalRow> = {
	kind: 'rank',
	permissionPrefix: 'rank_promotion_proposals',
	useList: (status) =>
		useRankPromotionProposals({
			status: status as rank_promotion_proposals.GetRankPromotionProposalsQuery['status']
		}),
	useApprove: useApproveRankPromotionProposal,
	useCancel: useCancelRankPromotionProposal,
	useReject: useRejectRankPromotionProposal,
	CreateForm: CreateRankPromotionProposalForm,
	targetColumn: (t) => ({
		id: 'targetRank',
		accessorKey: 'targetRank',
		header: t('rank.targetRank'),
		cell: ({ row }) => row.original.targetRank
	}),
	renderTarget: (row, t) => (
		<>
			<span className='text-muted-foreground'>
				{t('rank.targetRank')}
			</span>
			<span>{row.targetRank}</span>
		</>
	),
	renderDates: (row, t) => (
		<>
			<span className='text-muted-foreground'>
				{t('common.effectiveDate')}
			</span>
			<span>{row.effectiveDate ?? '—'}</span>
		</>
	),
	renderTrooperMeta: (row, trooper, t) => (
		<>
			<span>
				{t('rank.itemRank', { rank: resolveRank(row, trooper) })}
			</span>
			<span>
				{t('common.itemEffectiveDate', {
					date: resolveDate(row, trooper) ?? '—'
				})}
			</span>
		</>
	)
}

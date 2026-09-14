import {
	CreateRankPromotionProposalTrooperInput,
	PendingRankPromotionTransition,
	RankPromotionProposal,
	RankPromotionProposalDB,
	RankPromotionProposalItemStatus,
	RankPromotionProposalParams,
	RankPromotionProposalQuery,
	UpdateRankPromotionProposalMap
} from '../schema/rank-promotion-proposals'

export interface Repository {
	create(
		header: RankPromotionProposalParams,
		troopers: CreateRankPromotionProposalTrooperInput[]
	): Promise<RankPromotionProposalDB>
	find(query: RankPromotionProposalQuery): Promise<RankPromotionProposal[]>
	getOne(id: number): Promise<RankPromotionProposal | undefined>
	update(
		params: UpdateRankPromotionProposalMap
	): Promise<RankPromotionProposalDB[]>
	setTrooperItemStatus(
		id: number,
		status: RankPromotionProposalItemStatus,
		failureReason?: string
	): Promise<void>
	markTrooperApplied(id: number, appliedAt: string): Promise<void>
	findPendingApplication(): Promise<PendingRankPromotionTransition[]>
	findLockedStudentIds(): Promise<number[]>
}

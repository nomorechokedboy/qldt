import {
	ActivityStatusProposal,
	ActivityStatusProposalDB,
	ActivityStatusProposalItemStatus,
	ActivityStatusProposalParams,
	ActivityStatusProposalQuery,
	CreateActivityStatusProposalTrooperInput,
	PendingTrooperTransition,
	UpdateActivityStatusProposalMap
} from '../schema/activity-status-proposals'

export interface Repository {
	create(
		header: ActivityStatusProposalParams,
		troopers: CreateActivityStatusProposalTrooperInput[]
	): Promise<ActivityStatusProposalDB>
	find(query: ActivityStatusProposalQuery): Promise<ActivityStatusProposal[]>
	getOne(id: number): Promise<ActivityStatusProposal | undefined>
	update(
		params: UpdateActivityStatusProposalMap
	): Promise<ActivityStatusProposalDB[]>
	setTrooperItemStatus(
		id: number,
		status: ActivityStatusProposalItemStatus,
		failureReason?: string
	): Promise<void>
	markTrooperApplied(id: number, appliedAt: string): Promise<void>
	markTrooperReverted(id: number, revertedAt: string): Promise<void>
	findPendingApplication(): Promise<PendingTrooperTransition[]>
	findPendingRevert(): Promise<PendingTrooperTransition[]>
}

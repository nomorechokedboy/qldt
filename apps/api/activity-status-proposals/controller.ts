import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import { notifyUser } from '../notifications/notify'
import {
	ActivityStatusProposal,
	ActivityStatusProposalQuery,
	CreateActivityStatusProposalInput
} from '../schema/activity-status-proposals'
import { UnitLevel } from '../schema/units'
import { UserDB } from '../schema/users'
import studentRepo from '../students/repo'
import {
	commanderIdsOf,
	eligibleApproverIdsOrEmpty
} from '../units/commander-eligibility'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import userRepo from '../users/repo'
import activityStatusProposalRepo from './repo'

class controller {
	constructor(private readonly repo: Repository) {}

	private isBattalionOrAbove(levelName: string): boolean {
		return !UnitLevel.isLargerThan(
			UnitLevel.BATTALION,
			UnitLevel.fromName(levelName)
		)
	}

	private async assertUnitIsBattalionOrAbove(unitId: number): Promise<void> {
		const unit = (await unitRepo.findByIds([unitId]))[0]
		if (unit === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Unit not found: ${unitId}`)
			)
		}

		if (!this.isBattalionOrAbove(unit.level)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Activity status proposals require a Battalion level or larger unit. Got: ${unit.level}`
				)
			)
		}
	}

	// Anyone holding one of the 4 leadership roles on the unit itself, or on
	// any of its ancestors, is a valid "higher commander" for a proposal
	// raised from that unit (a single-unit degenerate case of the shared
	// commander-eligibility helper, which also backs transfer-requests'
	// two-unit version).
	private eligibleApproverIds(unitId: number): Promise<Set<number>> {
		return eligibleApproverIdsOrEmpty([unitId])
	}

	async listEligibleApprovers(unitId: number): Promise<UserDB[]> {
		const ids = await this.eligibleApproverIds(unitId)
		if (ids.size === 0) {
			return []
		}
		return userRepo.findByIds([...ids])
	}

	async canDecide(unitId: number, userId: number): Promise<boolean> {
		const ids = await this.eligibleApproverIds(unitId)
		return ids.has(userId)
	}

	// A unit's own troopers plus every descendant unit's troopers — a
	// proposal raised from a battalion-or-above unit covers troopers
	// assigned anywhere in its subordinate chain, not only directly on the
	// unit itself.
	private unitAndDescendantIds(unitId: number): Promise<number[]> {
		return unitStatsRepo.findDescendantUnitIds(unitId)
	}

	private async getRequestOrThrow(
		id: number
	): Promise<ActivityStatusProposal> {
		const proposal = await this.repo.getOne(id)
		if (proposal === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Activity status proposal not found: ${id}`
				)
			)
		}
		return proposal
	}

	private notify(recipientId: number, title: string, message: string): void {
		notifyUser(
			recipientId,
			'activityStatusProposal',
			'activityStatusProposal',
			title,
			message
		)
	}

	async create(
		input: CreateActivityStatusProposalInput,
		requestedByUserId: number
	): Promise<ActivityStatusProposal> {
		log.trace('ActivityStatusProposalController.create input', {
			input,
			requestedByUserId
		})

		if (input.troopers.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'An activity status proposal must include at least one trooper'
				)
			)
		}

		await this.assertUnitIsBattalionOrAbove(input.unitId)

		const chain = await unitRepo.findAncestorChain(input.unitId)
		const requesterEligibleIds = new Set(
			chain.flatMap((u) => commanderIdsOf(u))
		)
		if (!requesterEligibleIds.has(requestedByUserId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to create an activity status proposal for this unit"
				)
			)
		}

		const eligibleApproverIds = await this.eligibleApproverIds(input.unitId)
		if (!eligibleApproverIds.has(input.approverUserId)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Selected approver is not a commander/deputy commander/political commander/deputy political commander of this unit or one of its ancestors'
				)
			)
		}

		const unitScopeIds = await this.unitAndDescendantIds(input.unitId)

		for (const t of input.troopers) {
			const student = (await studentRepo.find({ ids: [t.studentId] }))[0]
			const studentUnitId = student?.unit?.id
			if (
				student === undefined ||
				studentUnitId === undefined ||
				!unitScopeIds.includes(studentUnitId)
			) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Trooper ${t.studentId} does not currently belong to this unit`
					)
				)
			}
		}

		const created = await this.repo.create(
			{
				unitId: input.unitId,
				requestedByUserId,
				approverUserId: input.approverUserId,
				targetActivityStatus: input.targetActivityStatus,
				note: input.note ?? null,
				status: 'pending'
			},
			input.troopers
		)

		const proposal = await this.getRequestOrThrow(created.id)

		this.notify(
			input.approverUserId,
			'Đề xuất chế độ mới',
			`Đồng chí ${proposal.requestedBy?.displayName} đã tạo một đề xuất chế độ cần bạn duyệt`
		)
		this.notify(
			requestedByUserId,
			'Đã tạo đề xuất chế độ',
			'Đề xuất chế độ của bạn đã được gửi đi và đang chờ duyệt'
		)

		return proposal
	}

	find(
		query: ActivityStatusProposalQuery
	): Promise<ActivityStatusProposal[]> {
		return this.repo.find(query)
	}

	findOne(id: number): Promise<ActivityStatusProposal> {
		return this.getRequestOrThrow(id)
	}

	private async assertActorIsApprover(
		proposal: ActivityStatusProposal,
		actorUserId: number
	): Promise<void> {
		const eligibleIds = await this.eligibleApproverIds(proposal.unit!.id)
		if (!eligibleIds.has(actorUserId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to approve/reject this activity status proposal"
				)
			)
		}
	}

	async approve(
		id: number,
		actorUserId: number
	): Promise<ActivityStatusProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Activity status proposal is not pending'
				)
			)
		}
		await this.assertActorIsApprover(proposal, actorUserId)

		const unitScopeIds = await this.unitAndDescendantIds(proposal.unit!.id)

		const approvedItemIds: number[] = []
		const studentUpdates: Parameters<typeof studentRepo.update>[0] = []

		for (const item of proposal.troopers ?? []) {
			const student = (
				await studentRepo.find({ ids: [item.student!.id] })
			)[0]
			const studentUnitId = student?.unit?.id
			if (
				student === undefined ||
				studentUnitId === undefined ||
				!unitScopeIds.includes(studentUnitId)
			) {
				await this.repo.setTrooperItemStatus(
					item.id,
					'failed',
					'Trooper no longer belongs to this unit'
				)
				continue
			}

			studentUpdates.push({
				id: student.id,
				updatePayload: { activityStatus: proposal.targetActivityStatus }
			})
			approvedItemIds.push(item.id)
		}

		// One batched update (single transaction) for every valid trooper,
		// instead of one round-trip per trooper.
		if (studentUpdates.length > 0) {
			await studentRepo.update(studentUpdates)
		}

		for (const itemId of approvedItemIds) {
			await this.repo.setTrooperItemStatus(itemId, 'approved')
		}

		await this.repo.update([
			{
				id,
				updatePayload: {
					status: 'approved',
					decidedByUserId: actorUserId,
					decidedAt: new Date().toISOString()
				}
			}
		])

		const decided = await this.getRequestOrThrow(id)

		this.notify(
			decided.requestedBy!.id,
			'Đề xuất chế độ đã được duyệt',
			`Đề xuất chế độ của bạn đã được đồng chí ${decided.decidedBy?.displayName} duyệt`
		)
		this.notify(
			actorUserId,
			'Đã duyệt đề xuất chế độ',
			'Bạn đã duyệt một đề xuất chế độ'
		)

		return decided
	}

	async reject(
		id: number,
		actorUserId: number,
		rejectionReason: string
	): Promise<ActivityStatusProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Activity status proposal is not pending'
				)
			)
		}
		await this.assertActorIsApprover(proposal, actorUserId)

		await this.repo.update([
			{
				id,
				updatePayload: {
					status: 'rejected',
					decidedByUserId: actorUserId,
					decidedAt: new Date().toISOString(),
					rejectionReason
				}
			}
		])

		const decided = await this.getRequestOrThrow(id)

		this.notify(
			decided.requestedBy!.id,
			'Đề xuất chế độ bị từ chối',
			`Đề xuất chế độ của bạn đã bị đồng chí ${decided.decidedBy?.displayName} từ chối: ${rejectionReason}`
		)
		this.notify(
			actorUserId,
			'Đã từ chối đề xuất chế độ',
			'Bạn đã từ chối một đề xuất chế độ'
		)

		return decided
	}

	async cancel(
		id: number,
		actorUserId: number
	): Promise<ActivityStatusProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Activity status proposal is not pending'
				)
			)
		}
		if (proposal.requestedBy!.id !== actorUserId) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'Only the requester can cancel this activity status proposal'
				)
			)
		}

		await this.repo.update([
			{
				id,
				updatePayload: {
					status: 'cancelled',
					decidedByUserId: actorUserId,
					decidedAt: new Date().toISOString()
				}
			}
		])

		return this.getRequestOrThrow(id)
	}
}

const activityStatusProposalController = new controller(
	activityStatusProposalRepo
)

export default activityStatusProposalController

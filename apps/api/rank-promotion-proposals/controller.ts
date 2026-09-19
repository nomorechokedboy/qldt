import dayjs from 'dayjs'
import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import { notifyUser } from '../notifications/notify'
import {
	CreateRankPromotionProposalInput,
	PendingRankPromotionTransition,
	RankPromotionProposal,
	RankPromotionProposalQuery
} from '../schema/rank-promotion-proposals'
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
import { isDirectPromotion, isKnownRank } from './rank-order'
import rankPromotionProposalRepo from './repo'

class controller {
	constructor(private readonly repo: Repository) {}

	private isBattalionOrAbove(levelName: string): boolean {
		return !UnitLevel.isLargerThan(
			UnitLevel.BATTALION,
			UnitLevel.fromName(levelName)
		)
	}

	private async assertUnitIsBattalionOrAbove(unitId: number): Promise<void> {
		const unit = await unitRepo.findOne({ id: unitId })
		if (unit === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Unit not found: ${unitId}`)
			)
		}

		if (!this.isBattalionOrAbove(unit.level)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Rank promotion proposals require a Battalion level or larger unit. Got: ${unit.level}`
				)
			)
		}
	}

	// Anyone holding one of the 4 leadership roles on the unit itself, or on
	// any of its ancestors, is a valid "higher commander" for a proposal
	// raised from that unit (same shared commander-eligibility helper used by
	// activity-status-proposals and transfer-requests).
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

	// Students currently locked into a still-live proposal (pending, or
	// approved but not yet applied) - a trooper can't be targeted by a
	// second, concurrent promotion until the first one is decided/applied.
	// Exposed publicly so the frontend trooper picker can filter these out
	// too, but create() is the actual enforcement point.
	listLockedStudentIds(): Promise<number[]> {
		return this.repo.findLockedStudentIds()
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
	): Promise<RankPromotionProposal> {
		const proposal = await this.repo.getOne(id)
		if (proposal === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Rank promotion proposal not found: ${id}`
				)
			)
		}
		return proposal
	}

	// Resolves the target rank / effective date a given trooper actually runs
	// under: its own override if set, otherwise the proposal's batch-wide
	// default. Shared by create()'s validation, approve()'s "apply now vs.
	// defer to the sweep" decision, and the sweep itself.
	private resolve(
		header: { targetRank: string; effectiveDate?: string | null },
		override: { targetRank?: string | null; effectiveDate?: string | null }
	): { targetRank: string; effectiveDate?: string | null } {
		return {
			targetRank: override.targetRank ?? header.targetRank,
			effectiveDate: override.effectiveDate ?? header.effectiveDate
		}
	}

	private validateTrooperPromotion(
		studentId: number,
		currentRank: string | null,
		resolved: { targetRank: string; effectiveDate?: string | null }
	): void {
		if (!resolved.effectiveDate) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Trooper ${studentId} is missing an effective date (either on the proposal or on the trooper itself)`
				)
			)
		}
		if (!isKnownRank(resolved.targetRank)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Trooper ${studentId}'s target rank "${resolved.targetRank}" is not a recognized rank`
				)
			)
		}
		if (
			!currentRank ||
			!isDirectPromotion(currentRank, resolved.targetRank)
		) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Trooper ${studentId}'s target rank "${resolved.targetRank}" is not the next rank up from its current rank "${currentRank ?? ''}"`
				)
			)
		}
	}

	private notify(recipientId: number, title: string, message: string): void {
		notifyUser(
			recipientId,
			'rankPromotionProposal',
			'rankPromotionProposal',
			title,
			message
		)
	}

	async create(
		input: CreateRankPromotionProposalInput,
		requestedByUserId: number
	): Promise<RankPromotionProposal> {
		log.trace('RankPromotionProposalController.create input', {
			input,
			requestedByUserId
		})

		if (input.troopers.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'A rank promotion proposal must include at least one trooper'
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
					"You don't have permission to create a rank promotion proposal for this unit"
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
		const lockedStudentIds = new Set(await this.repo.findLockedStudentIds())

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

			if (lockedStudentIds.has(t.studentId)) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Trooper ${t.studentId} is already part of another pending or unapplied rank promotion proposal`
					)
				)
			}

			const resolved = this.resolve(input, t)
			this.validateTrooperPromotion(t.studentId, student.rank, resolved)
		}

		const created = await this.repo.create(
			{
				unitId: input.unitId,
				requestedByUserId,
				approverUserId: input.approverUserId,
				targetRank: input.targetRank,
				note: input.note ?? null,
				status: 'pending',
				effectiveDate: input.effectiveDate ?? null
			},
			input.troopers
		)

		const proposal = await this.getRequestOrThrow(created.id)

		this.notify(
			input.approverUserId,
			'Đề xuất thăng quân hàm mới',
			`Đồng chí ${proposal.requestedBy?.displayName} đã tạo một đề xuất thăng quân hàm cần bạn duyệt`
		)
		this.notify(
			requestedByUserId,
			'Đã tạo đề xuất thăng quân hàm',
			'Đề xuất thăng quân hàm của bạn đã được gửi đi và đang chờ duyệt'
		)

		return proposal
	}

	find(query: RankPromotionProposalQuery): Promise<RankPromotionProposal[]> {
		return this.repo.find(query)
	}

	findOne(id: number): Promise<RankPromotionProposal> {
		return this.getRequestOrThrow(id)
	}

	// Only the specific user chosen as approverUserId at creation time may
	// decide this proposal - being a generically-eligible commander for the
	// unit is not enough (that broader set only gates who can be PICKED as
	// approver, via listEligibleApprovers/eligibleApproverIds above).
	private assertActorIsApprover(
		proposal: RankPromotionProposal,
		actorUserId: number
	): void {
		if (proposal.approver?.id !== actorUserId) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'Only the designated approver can approve/reject this rank promotion proposal'
				)
			)
		}
	}

	async approve(
		id: number,
		actorUserId: number
	): Promise<RankPromotionProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Rank promotion proposal is not pending'
				)
			)
		}
		await this.assertActorIsApprover(proposal, actorUserId)

		const unitScopeIds = await this.unitAndDescendantIds(proposal.unit!.id)
		const today = dayjs().format('YYYY-MM-DD')
		const now = new Date().toISOString()

		const dueNowItemIds: number[] = []
		const deferredItemIds: number[] = []
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

			const resolved = this.resolve(proposal, item)
			if (
				!isKnownRank(resolved.targetRank) ||
				!isDirectPromotion(student.rank, resolved.targetRank)
			) {
				await this.repo.setTrooperItemStatus(
					item.id,
					'failed',
					`Target rank is no longer a valid promotion from the trooper's current rank "${student.rank}"`
				)
				continue
			}

			const dueDate = resolved.effectiveDate
			// No resolved date at all shouldn't happen post create()-time
			// validation, but if it does, don't silently strand the trooper
			// in limbo — apply now, same as the pre-dates behavior.
			const isDue = !dueDate || dueDate <= today

			if (isDue) {
				studentUpdates.push({
					id: student.id,
					updatePayload: { rank: resolved.targetRank }
				})
				dueNowItemIds.push(item.id)
			} else {
				deferredItemIds.push(item.id)
			}
		}

		// One batched update (single transaction) for every trooper due now,
		// instead of one round-trip per trooper.
		if (studentUpdates.length > 0) {
			await studentRepo.update(studentUpdates)
		}

		for (const itemId of dueNowItemIds) {
			await this.repo.markTrooperApplied(itemId, now)
		}
		for (const itemId of deferredItemIds) {
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
			'Đề xuất thăng quân hàm đã được duyệt',
			`Đề xuất thăng quân hàm của bạn đã được đồng chí ${decided.decidedBy?.displayName} duyệt`
		)
		this.notify(
			actorUserId,
			'Đã duyệt đề xuất thăng quân hàm',
			'Bạn đã duyệt một đề xuất thăng quân hàm'
		)

		return decided
	}

	async reject(
		id: number,
		actorUserId: number,
		rejectionReason: string
	): Promise<RankPromotionProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Rank promotion proposal is not pending'
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
			'Đề xuất thăng quân hàm bị từ chối',
			`Đề xuất thăng quân hàm của bạn đã bị đồng chí ${decided.decidedBy?.displayName} từ chối: ${rejectionReason}`
		)
		this.notify(
			actorUserId,
			'Đã từ chối đề xuất thăng quân hàm',
			'Bạn đã từ chối một đề xuất thăng quân hàm'
		)

		return decided
	}

	async cancel(
		id: number,
		actorUserId: number
	): Promise<RankPromotionProposal> {
		const proposal = await this.getRequestOrThrow(id)
		if (proposal.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Rank promotion proposal is not pending'
				)
			)
		}
		if (proposal.requestedBy!.id !== actorUserId) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'Only the requester can cancel this rank promotion proposal'
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

	// Hit periodically by an external scheduler (same "expose:false GET
	// endpoint polled by a k8s CronJob" convention as /students/cron,
	// /commander-digest/cron and /activity-status-proposals/cron). Unlike
	// activity-status-proposals there is only one sweep: approved-but-not-
	// yet-applied troopers whose resolved effectiveDate has arrived -> push
	// rank, stamp appliedAt. Nothing ever reverts a promotion.
	async runScheduledTransitions(): Promise<{
		applied: number
		failed: number
	}> {
		const today = dayjs().format('YYYY-MM-DD')
		const now = new Date().toISOString()

		const isDueForApplication = (
			item: PendingRankPromotionTransition
		): boolean => {
			const dueDate = item.effectiveDate ?? item.proposal.effectiveDate
			return !!dueDate && dueDate <= today
		}

		const pendingApplication = await this.repo.findPendingApplication()
		const dueApplication = pendingApplication.filter(isDueForApplication)

		// The trooper's rank can change between approval and the sweep date
		// (another promotion applied in the meantime, a manual edit, etc.), so
		// re-validate the next-rank-up progression here too - otherwise a
		// deferred item could silently apply a same-rank, junior, or
		// skipped-rank "promotion", same failure mode approve() already
		// guards against for items due immediately.
		const stillValid = (item: PendingRankPromotionTransition): boolean => {
			const target = item.targetRank ?? item.proposal.targetRank
			return (
				item.student !== null &&
				isKnownRank(target) &&
				isDirectPromotion(item.student.rank, target)
			)
		}

		const applicable = dueApplication.filter(stillValid)
		const noLongerValid = dueApplication.filter((item) => !stillValid(item))

		const applyUpdates: Parameters<typeof studentRepo.update>[0] =
			applicable.map((item) => ({
				id: item.student!.id,
				updatePayload: {
					rank: item.targetRank ?? item.proposal.targetRank
				}
			}))
		if (applyUpdates.length > 0) {
			await studentRepo.update(applyUpdates)
		}
		for (const item of applicable) {
			await this.repo.markTrooperApplied(item.id, now)
		}
		for (const item of noLongerValid) {
			await this.repo.setTrooperItemStatus(
				item.id,
				'failed',
				`Target rank is no longer a valid promotion from the trooper's current rank "${item.student?.rank ?? ''}"`
			)
		}

		log.info(
			'RankPromotionProposalController.runScheduledTransitions complete',
			{ applied: applicable.length, failed: noLongerValid.length }
		)

		return { applied: applicable.length, failed: noLongerValid.length }
	}
}

const rankPromotionProposalController = new controller(
	rankPromotionProposalRepo
)

export default rankPromotionProposalController

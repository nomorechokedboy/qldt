import dayjs from 'dayjs'
import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import { notifyUser } from '../notifications/notify'
import {
	ActivityStatusProposal,
	ActivityStatusProposalQuery,
	CreateActivityStatusProposalInput,
	isRangedTargetActivityStatus,
	PendingTrooperTransition,
	TargetActivityStatus
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
		const unit = await unitRepo.findOne({ id: unitId })
		if (unit === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Unit not found: ${unitId}`, {
					reason: 'unit_not_found',
					params: { id: unitId }
				})
			)
		}

		if (!this.isBattalionOrAbove(unit.level)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Activity status proposals require a Battalion level or larger unit. Got: ${unit.level}`,
					{
						reason: 'proposal_unit_level_too_small',
						params: { level: unit.level }
					}
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
					`Activity status proposal not found: ${id}`,
					{ reason: 'request_not_found', params: { id } }
				)
			)
		}
		return proposal
	}

	// Resolves the effective/start/end date a given trooper actually runs
	// under: its own override if set, otherwise the proposal's batch-wide
	// default. Shared by create()'s validation, approve()'s "apply now vs.
	// defer to the sweep" decision, and the sweep itself.
	private resolveDates(
		target: TargetActivityStatus,
		header: {
			effectiveDate?: string | null
			startDate?: string | null
			endDate?: string | null
		},
		override: {
			effectiveDate?: string | null
			startDate?: string | null
			endDate?: string | null
		}
	): {
		effectiveDate?: string | null
		startDate?: string | null
		endDate?: string | null
	} {
		if (!isRangedTargetActivityStatus(target)) {
			return {
				effectiveDate: override.effectiveDate ?? header.effectiveDate
			}
		}
		return {
			startDate: override.startDate ?? header.startDate,
			endDate: override.endDate ?? header.endDate
		}
	}

	private validateTrooperDates(
		target: TargetActivityStatus,
		studentId: number,
		dates: {
			effectiveDate?: string | null
			startDate?: string | null
			endDate?: string | null
		}
	): void {
		if (!isRangedTargetActivityStatus(target)) {
			if (!dates.effectiveDate) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Trooper ${studentId} is missing an effective date (either on the proposal or on the trooper itself)`,
						{
							reason: 'trooper_missing_effective_date',
							params: { id: studentId }
						}
					)
				)
			}
			return
		}

		if (!dates.startDate || !dates.endDate) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Trooper ${studentId} is missing a start/end date (either on the proposal or on the trooper itself)`,
					{
						reason: 'trooper_missing_date_range',
						params: { id: studentId }
					}
				)
			)
		}
		if (dates.startDate > dates.endDate) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Trooper ${studentId}'s start date must not be after its end date`,
					{
						reason: 'trooper_start_after_end',
						params: { id: studentId }
					}
				)
			)
		}
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
					'An activity status proposal must include at least one trooper',
					{ reason: 'request_empty' }
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
					'Selected approver is not a commander/deputy commander/political commander/deputy political commander of this unit or one of its ancestors',
					{ reason: 'approver_not_eligible' }
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
						`Trooper ${t.studentId} does not currently belong to this unit`,
						{
							reason: 'trooper_not_in_unit',
							params: { id: t.studentId }
						}
					)
				)
			}

			const resolved = this.resolveDates(
				input.targetActivityStatus,
				input,
				t
			)
			this.validateTrooperDates(
				input.targetActivityStatus,
				t.studentId,
				resolved
			)
		}

		const created = await this.repo.create(
			{
				unitId: input.unitId,
				requestedByUserId,
				approverUserId: input.approverUserId,
				targetActivityStatus: input.targetActivityStatus,
				note: input.note ?? null,
				status: 'pending',
				effectiveDate: input.effectiveDate ?? null,
				startDate: input.startDate ?? null,
				endDate: input.endDate ?? null
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

	// Only the specific user chosen as approverUserId at creation time may
	// decide this proposal - being a generically-eligible commander for the
	// unit is not enough (that broader set only gates who can be PICKED as
	// approver, via listEligibleApprovers/eligibleApproverIds above).
	private assertActorIsApprover(
		proposal: ActivityStatusProposal,
		actorUserId: number
	): void {
		if (proposal.approver?.id !== actorUserId) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'Only the designated approver can approve/reject this activity status proposal'
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
					'Activity status proposal is not pending',
					{ reason: 'not_pending' }
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

			const resolved = this.resolveDates(
				proposal.targetActivityStatus,
				proposal,
				item
			)
			const dueDate = isRangedTargetActivityStatus(
				proposal.targetActivityStatus
			)
				? resolved.startDate
				: resolved.effectiveDate
			// No resolved date at all shouldn't happen post create()-time
			// validation, but if it does, don't silently strand the trooper
			// in limbo — apply now, same as the pre-dates behavior.
			const isDue = !dueDate || dueDate <= today

			if (isDue) {
				studentUpdates.push({
					id: student.id,
					updatePayload: {
						activityStatus: proposal.targetActivityStatus
					}
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
					'Activity status proposal is not pending',
					{ reason: 'not_pending' }
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
					'Activity status proposal is not pending',
					{ reason: 'not_pending' }
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

	// Hit periodically by an external scheduler (same "expose:false GET
	// endpoint polled by a k8s CronJob" convention as /students/cron and
	// /commander-digest/cron — this codebase has no in-process cron job).
	// Two independent sweeps:
	//  1. approved-but-not-yet-applied troopers whose resolved
	//     effectiveDate/startDate has arrived -> push activityStatus, stamp
	//     appliedAt.
	//  2. applied troopers on a ranged status whose resolved endDate has
	//     arrived -> revert activityStatus to 'serving', stamp revertedAt.
	async runScheduledTransitions(): Promise<{
		applied: number
		reverted: number
	}> {
		const today = dayjs().format('YYYY-MM-DD')
		const now = new Date().toISOString()

		const isDueForApplication = (
			item: PendingTrooperTransition
		): boolean => {
			const dueDate = isRangedTargetActivityStatus(
				item.proposal.targetActivityStatus
			)
				? (item.startDate ?? item.proposal.startDate)
				: (item.effectiveDate ?? item.proposal.effectiveDate)
			return !!dueDate && dueDate <= today
		}

		const pendingApplication = await this.repo.findPendingApplication()
		const dueApplication = pendingApplication.filter(isDueForApplication)

		const applyUpdates: Parameters<typeof studentRepo.update>[0] =
			dueApplication
				.filter((item) => item.student !== null)
				.map((item) => ({
					id: item.student!.id,
					updatePayload: {
						activityStatus: item.proposal.targetActivityStatus
					}
				}))
		if (applyUpdates.length > 0) {
			await studentRepo.update(applyUpdates)
		}
		for (const item of dueApplication) {
			await this.repo.markTrooperApplied(item.id, now)
		}

		const isDueForRevert = (item: PendingTrooperTransition): boolean => {
			if (
				!isRangedTargetActivityStatus(
					item.proposal.targetActivityStatus
				)
			) {
				return false
			}
			const dueDate = item.endDate ?? item.proposal.endDate
			return !!dueDate && dueDate <= today
		}

		const pendingRevert = await this.repo.findPendingRevert()
		const dueRevert = pendingRevert.filter(isDueForRevert)

		const revertUpdates: Parameters<typeof studentRepo.update>[0] =
			dueRevert
				.filter((item) => item.student !== null)
				.map((item) => ({
					id: item.student!.id,
					updatePayload: { activityStatus: 'serving' }
				}))
		if (revertUpdates.length > 0) {
			await studentRepo.update(revertUpdates)
		}
		for (const item of dueRevert) {
			await this.repo.markTrooperReverted(item.id, now)
		}

		log.info(
			'ActivityStatusProposalController.runScheduledTransitions complete',
			{ applied: dueApplication.length, reverted: dueRevert.length }
		)

		return { applied: dueApplication.length, reverted: dueRevert.length }
	}
}

const activityStatusProposalController = new controller(
	activityStatusProposalRepo
)

export default activityStatusProposalController

import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import materialAssetEventRepo from '../materials/material-asset-events-repo'
import materialAssetRepo from '../materials/material-assets-repo'
import materialStockRepo from '../materials/material-stocks-repo'
import {
	CreateTransferRequestInput,
	TransferRequest,
	TransferRequestQuery
} from '../schema/transfer-requests'
import { Unit, UnitDB, UnitLevel } from '../schema/units'
import {
	MaterialConditionName,
	MaterialStockDB,
	UpdateMaterialStockMap
} from '../schema/material-stocks'
import { Student } from '../schema/student'
import studentRepo from '../students/repo'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import userRepo from '../users/repo'
import { UserDB } from '../schema/users'
import transferRequestRepo from './repo'

const COMMANDER_FIELDS = [
	'commanderId',
	'deputyCommanderId',
	'politicalCommanderId',
	'deputyPoliticalCommanderId'
] as const

class controller {
	constructor(private readonly repo: Repository) {}

	private commanderIdsOf(unit: UnitDB): number[] {
		return COMMANDER_FIELDS.map((f) => unit[f]).filter(
			(id): id is number => id !== null && id !== undefined
		)
	}

	// Units at-or-above both the source and destination units in the
	// hierarchy (ancestor-or-self of both). Any of their 4 leadership roles
	// is a valid "superior commander" for a transfer between those two units.
	private async commonAncestorUnits(
		sourceUnitId: number,
		destinationUnitId: number
	): Promise<UnitDB[]> {
		const [sourceChain, destChain] = await Promise.all([
			unitRepo.findAncestorChain(sourceUnitId),
			unitRepo.findAncestorChain(destinationUnitId)
		])
		const destIds = new Set(destChain.map((u) => u.id))
		return sourceChain.filter((u) => destIds.has(u.id))
	}

	private async eligibleApproverIds(
		sourceUnitId: number,
		destinationUnitId: number
	): Promise<Set<number>> {
		const commonUnits = await this.commonAncestorUnits(
			sourceUnitId,
			destinationUnitId
		)
		if (commonUnits.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Source and destination units have no common superior unit'
				)
			)
		}
		return new Set(commonUnits.flatMap((u) => this.commanderIdsOf(u)))
	}

	// Same eligibility rule as eligibleApproverIds, but never throws for a
	// source/destination pair with no common superior unit — used for
	// read-only UI hints (approver picker, "can this user decide" flags)
	// where an empty result is a valid answer rather than an error.
	private async eligibleApproverIdsOrEmpty(
		sourceUnitId: number,
		destinationUnitId: number
	): Promise<Set<number>> {
		const commonUnits = await this.commonAncestorUnits(
			sourceUnitId,
			destinationUnitId
		)
		return new Set(commonUnits.flatMap((u) => this.commanderIdsOf(u)))
	}

	// Users eligible to approve a transfer between the given source and
	// destination units, for populating the approver picker up front (the
	// same eligibility rule is re-enforced in create()/approve()).
	async listEligibleApprovers(
		sourceUnitId: number,
		destinationUnitId: number
	): Promise<UserDB[]> {
		const ids = await this.eligibleApproverIdsOrEmpty(
			sourceUnitId,
			destinationUnitId
		)
		if (ids.size === 0) {
			return []
		}
		return userRepo.findByIds([...ids])
	}

	// Whether the given user currently holds one of the 4 leadership roles
	// on a unit that is ancestor-or-self of both the source and destination
	// units — i.e. whether they're allowed to approve/reject this specific
	// pending request. Used to drive the approve/reject buttons in the UI so
	// they only show for actually-eligible commanders, not everyone holding
	// the org-wide transfer_requests:approve/reject permission.
	async canDecide(
		sourceUnitId: number,
		destinationUnitId: number,
		userId: number
	): Promise<boolean> {
		const ids = await this.eligibleApproverIdsOrEmpty(
			sourceUnitId,
			destinationUnitId
		)
		return ids.has(userId)
	}

	private studentUnitId(student: Student): number | undefined {
		return student.unit?.id
	}

	// A unit's own resources plus every descendant unit's resources — a
	// transfer request sourced from a unit is allowed to move troopers/
	// materials belonging to any of its subordinate units, not only items
	// registered directly on the unit itself.
	private unitAndDescendantIds(unitId: number): Promise<number[]> {
		return unitStatsRepo.findDescendantUnitIds(unitId)
	}

	private isCompanyOrAbove(levelName: string): boolean {
		return !UnitLevel.isLargerThan(
			UnitLevel.COMPANY,
			UnitLevel.fromName(levelName)
		)
	}

	private async assertUnitIsCompanyOrAbove(
		unitId: number,
		label: string
	): Promise<void> {
		const unit = (await unitRepo.findByIds([unitId]))[0]
		if (unit === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`${label} unit not found: ${unitId}`)
			)
		}

		if (!this.isCompanyOrAbove(unit.level)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					`Transfer requests require ${label} unit to be Company level or larger. Got: ${unit.level}`
				)
			)
		}
	}

	// Candidate destination units for a transfer request: any Company-level-
	// or-larger unit in the org, independent of the requester's own
	// validUnitIds scope (a transfer's destination is not necessarily part
	// of the requester's own command). Eligibility of the actual requester/
	// approver is still enforced separately in create()/approve().
	async listDestinationCandidateUnits(): Promise<Unit[]> {
		const all = await unitRepo.findAll()
		return all.filter((u) => this.isCompanyOrAbove(u.level))
	}

	private async getRequestOrThrow(id: number): Promise<TransferRequest> {
		const request = await this.repo.getOne(id)
		if (request === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Transfer request not found: ${id}`)
			)
		}
		return request
	}

	async create(
		input: CreateTransferRequestInput,
		requestedByUserId: number
	): Promise<TransferRequest> {
		log.trace('TransferRequestController.create input', {
			input,
			requestedByUserId
		})

		const troopers = input.troopers ?? []
		const materialAssets = input.materialAssets ?? []
		const materialStocks = input.materialStocks ?? []

		if (
			troopers.length === 0 &&
			materialAssets.length === 0 &&
			materialStocks.length === 0
		) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'A transfer request must include at least one resource'
				)
			)
		}

		if (input.sourceUnitId === input.destinationUnitId) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Source and destination units must be different'
				)
			)
		}

		await this.assertUnitIsCompanyOrAbove(input.sourceUnitId, 'Source')
		await this.assertUnitIsCompanyOrAbove(
			input.destinationUnitId,
			'Destination'
		)

		// Requester must currently hold one of the 4 leadership roles on the
		// source unit itself, or on any of its ancestors (higher unit level
		// commander).
		const sourceChain = await unitRepo.findAncestorChain(input.sourceUnitId)
		const requesterEligibleIds = new Set(
			sourceChain.flatMap((u) => this.commanderIdsOf(u))
		)
		if (!requesterEligibleIds.has(requestedByUserId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to create a transfer request for this unit"
				)
			)
		}

		const eligibleApproverIds = await this.eligibleApproverIds(
			input.sourceUnitId,
			input.destinationUnitId
		)
		if (!eligibleApproverIds.has(input.approverUserId)) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'Selected approver is not a commander/deputy commander/political commander/deputy political commander of any unit superior to both source and destination units'
				)
			)
		}

		const sourceScopeUnitIds = await this.unitAndDescendantIds(
			input.sourceUnitId
		)

		for (const t of troopers) {
			const student = (await studentRepo.find({ ids: [t.studentId] }))[0]
			const studentUnitId = student && this.studentUnitId(student)
			if (
				student === undefined ||
				studentUnitId === undefined ||
				!sourceScopeUnitIds.includes(studentUnitId)
			) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Trooper ${t.studentId} does not currently belong to the source unit or one of its subordinate units`
					)
				)
			}
		}

		for (const m of materialAssets) {
			const asset = (
				await materialAssetRepo.findByIds([m.materialAssetId])
			)[0]
			if (
				asset === undefined ||
				!sourceScopeUnitIds.includes(asset.unitId)
			) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Material asset ${m.materialAssetId} does not currently belong to the source unit or one of its subordinate units`
					)
				)
			}
		}

		for (const m of materialStocks) {
			const available = await this.availableStockQuantity(
				sourceScopeUnitIds,
				m.materialTypeId,
				m.condition
			)
			if (available < m.quantity) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`Not enough stock for material type ${m.materialTypeId} (condition: ${m.condition}) at source unit: requested ${m.quantity}, available ${available}`
					)
				)
			}
		}

		const created = await this.repo.create(
			{
				sourceUnitId: input.sourceUnitId,
				destinationUnitId: input.destinationUnitId,
				destinationRoomId: input.destinationRoomId ?? null,
				requestedByUserId,
				approverUserId: input.approverUserId,
				status: 'pending'
			},
			{ troopers, materialAssets, materialStocks }
		)

		return this.getRequestOrThrow(created.id)
	}

	find(query: TransferRequestQuery): Promise<TransferRequest[]> {
		return this.repo.find(query)
	}

	findOne(id: number): Promise<TransferRequest> {
		return this.getRequestOrThrow(id)
	}

	private async availableStockQuantity(
		unitIds: number[],
		materialTypeId: number,
		condition: MaterialConditionName
	): Promise<number> {
		const rows = await materialStockRepo.find({ unitIds, materialTypeId })
		return rows
			.filter((r) => r.condition === condition)
			.reduce((sum, r) => sum + r.quantity, 0)
	}

	private async moveStock(
		sourceUnitIds: number[],
		destinationUnitId: number,
		destinationRoomId: number | null,
		materialTypeId: number,
		condition: MaterialConditionName,
		quantity: number
	): Promise<void> {
		const rows = (
			await materialStockRepo.find({
				unitIds: sourceUnitIds,
				materialTypeId
			})
		).filter((r) => r.condition === condition)

		let remaining = quantity
		const updateMap: UpdateMaterialStockMap = []
		const toDelete: { id: number }[] = []

		for (const row of rows) {
			if (remaining <= 0) break
			const take = Math.min(remaining, row.quantity)
			remaining -= take
			const newQuantity = row.quantity - take
			if (newQuantity === 0) {
				toDelete.push({ id: row.id })
			} else {
				updateMap.push({
					id: row.id,
					updatePayload: { quantity: newQuantity }
				})
			}
		}

		if (updateMap.length > 0) {
			await materialStockRepo.update(updateMap)
		}
		if (toDelete.length > 0) {
			await materialStockRepo.delete(toDelete as MaterialStockDB[])
		}

		await materialStockRepo.create([
			{
				materialTypeId,
				unitId: destinationUnitId,
				roomId: destinationRoomId,
				condition,
				quantity
			}
		])
	}

	private async assertActorIsApprover(
		request: TransferRequest,
		actorUserId: number
	): Promise<void> {
		const eligibleIds = await this.eligibleApproverIds(
			request.sourceUnit!.id,
			request.destinationUnit!.id
		)
		if (!eligibleIds.has(actorUserId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to approve/reject this transfer request"
				)
			)
		}
	}

	async approve(id: number, actorUserId: number): Promise<TransferRequest> {
		const request = await this.getRequestOrThrow(id)
		if (request.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Transfer request is not pending')
			)
		}
		await this.assertActorIsApprover(request, actorUserId)

		const sourceUnitId = request.sourceUnit!.id
		const destinationUnitId = request.destinationUnit!.id
		const destinationRoomId = request.destinationRoom?.id ?? null
		const sourceScopeUnitIds = await this.unitAndDescendantIds(sourceUnitId)

		for (const item of request.troopers ?? []) {
			const student = (
				await studentRepo.find({ ids: [item.student!.id] })
			)[0]
			const studentUnitId = student && this.studentUnitId(student)
			if (
				student === undefined ||
				studentUnitId === undefined ||
				!sourceScopeUnitIds.includes(studentUnitId)
			) {
				await this.repo.setTrooperItemStatus(
					item.id,
					'failed',
					'Trooper no longer belongs to the source unit or one of its subordinate units'
				)
				continue
			}

			await studentRepo.update([
				{
					id: student.id,
					updatePayload: {
						unitId: destinationUnitId
					}
				}
			])

			// Any material still assigned to this trooper stays behind at
			// the source unit (it isn't itself part of this transfer), so
			// the assignment no longer makes sense - sever it rather than
			// leaving a stale reference to a trooper who's now elsewhere.
			const assignedAssets = await materialAssetRepo.find({
				assignedTrooperId: student.id
			})
			for (const asset of assignedAssets) {
				await materialAssetRepo.update([
					{ id: asset.id, updatePayload: { assignedTrooperId: null } }
				])
				await materialAssetEventRepo.create([
					{
						assetId: asset.id,
						eventType: 'unassigned',
						previousValue: {
							assignedTrooperName: student.fullName
						},
						newValue: {},
						actorUserId
					}
				])
			}

			await this.repo.setTrooperItemStatus(item.id, 'approved')
		}

		for (const item of request.materialAssetItems ?? []) {
			const asset = (
				await materialAssetRepo.findByIds([item.materialAsset!.id])
			)[0]
			if (
				asset === undefined ||
				!sourceScopeUnitIds.includes(asset.unitId)
			) {
				await this.repo.setMaterialAssetItemStatus(
					item.id,
					'failed',
					'Material asset no longer belongs to the source unit or one of its subordinate units'
				)
				continue
			}

			// The trooper it was assigned to (if any) isn't part of this
			// transfer and stays at the source unit, so the assignment no
			// longer makes sense once the asset moves - sever it here too.
			const wasAssignedTo = asset.assignedTrooperId
			await materialAssetRepo.update([
				{
					id: asset.id,
					updatePayload: {
						unitId: destinationUnitId,
						roomId: destinationRoomId,
						assignedTrooperId: null
					}
				}
			])
			await materialAssetEventRepo.create([
				{
					assetId: asset.id,
					eventType: 'transferred',
					previousValue: { unitId: sourceUnitId },
					newValue: { unitId: destinationUnitId },
					actorUserId
				}
			])
			if (wasAssignedTo !== null && wasAssignedTo !== undefined) {
				const assignedTrooper = (
					await studentRepo.find({ ids: [wasAssignedTo] })
				)[0]
				await materialAssetEventRepo.create([
					{
						assetId: asset.id,
						eventType: 'unassigned',
						previousValue: {
							assignedTrooperName: assignedTrooper?.fullName
						},
						newValue: {},
						actorUserId
					}
				])
			}
			await this.repo.setMaterialAssetItemStatus(item.id, 'approved')
		}

		for (const item of request.materialStockItems ?? []) {
			const available = await this.availableStockQuantity(
				sourceScopeUnitIds,
				item.materialType!.id,
				item.condition
			)
			if (available < item.quantity) {
				await this.repo.setMaterialStockItemStatus(
					item.id,
					'failed',
					'Not enough stock remaining at the source unit or its subordinate units'
				)
				continue
			}

			await this.moveStock(
				sourceScopeUnitIds,
				destinationUnitId,
				destinationRoomId,
				item.materialType!.id,
				item.condition,
				item.quantity
			)
			await this.repo.setMaterialStockItemStatus(item.id, 'approved')
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

		return this.getRequestOrThrow(id)
	}

	async reject(
		id: number,
		actorUserId: number,
		rejectionReason: string
	): Promise<TransferRequest> {
		const request = await this.getRequestOrThrow(id)
		if (request.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Transfer request is not pending')
			)
		}
		await this.assertActorIsApprover(request, actorUserId)

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

		return this.getRequestOrThrow(id)
	}

	async cancel(id: number, actorUserId: number): Promise<TransferRequest> {
		const request = await this.getRequestOrThrow(id)
		if (request.status !== 'pending') {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Transfer request is not pending')
			)
		}
		if (request.requestedBy!.id !== actorUserId) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'Only the requester can cancel this transfer request'
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

const transferRequestController = new controller(transferRequestRepo)

export default transferRequestController

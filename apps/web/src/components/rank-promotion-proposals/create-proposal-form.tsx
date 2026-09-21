import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { isDirectPromotion } from '@/data/rank-order'
import { rankOptions } from '@/data/ranks'
import { useCreateRankPromotionProposal } from '@/hooks/useCreateRankPromotionProposal'
import useRankPromotionProposalEligibleApprovers from '@/hooks/useRankPromotionProposalEligibleApprovers'
import useRankPromotionProposals from '@/hooks/useRankPromotionProposals'
import type { rank_promotion_proposals } from '@/api/client'
import { toastApiError } from '@/lib/api-error'
import type { Student } from '@/types'
import ProposalDateField from '@/components/proposal-form/date-field'
import formatProposalDate from '@/components/proposal-form/format-date'
import {
	ApproverField,
	EffectiveDateField,
	NoteField,
	UnitField
} from '@/components/proposal-form/fields'
import ProposalSheet from '@/components/proposal-form/proposal-sheet'
import TrooperPickerList from '@/components/proposal-form/trooper-picker-list'
import useTrooperPicker from '@/components/proposal-form/use-trooper-picker'
import useUnitTroopers from '@/components/proposal-form/use-unit-troopers'

const [, ...rankOptionsWithoutPrivate] = rankOptions

type TrooperOverride = {
	targetRank?: string
	effectiveDate?: string
}

type Proposals = ReturnType<typeof useRankPromotionProposals>['data']

// Students already committed to another still-live proposal (pending, or
// approved but not yet applied) - mirrors the backend's
// findLockedStudentIds() so the picker never offers a trooper the create
// call would just reject. This is a UX nicety only; create() is the
// actual enforcement point.
function lockedStudentIds(proposals: Proposals): Set<number> {
	const locked = new Set<number>()
	for (const p of proposals ?? []) {
		for (const item of p.troopers ?? []) {
			const studentId = item.student?.id
			if (studentId === undefined) continue
			if (
				p.status === 'pending' ||
				(p.status === 'approved' &&
					item.itemStatus === 'approved' &&
					!item.appliedAt)
			) {
				locked.add(studentId)
			}
		}
	}
	return locked
}

// Only troopers exactly one rank junior to `targetRank`, and not already
// locked into another live proposal - a promotion proposal moves troopers up
// to the next rank, not several at once. Until a target rank is chosen,
// every non-locked unit trooper qualifies.
function promotable(
	students: Student[],
	locked: ReadonlySet<number>,
	targetRank: string
): Student[] {
	return students.filter(
		(s) =>
			!locked.has(s.id) &&
			(!targetRank || isDirectPromotion(s.rank, targetRank))
	)
}

function RankSelect({
	value,
	onValueChange,
	placeholder,
	triggerId
}: {
	value: string
	onValueChange: (value: string) => void
	placeholder: string
	triggerId?: string
}) {
	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger id={triggerId} className='w-full'>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{rankOptionsWithoutPrivate.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export default function CreateRankPromotionProposalForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const { t } = useTranslation('proposals')
	const [open, setOpen] = useState(false)
	const [unitId, setUnitId] = useState('')
	const [approverUserId, setApproverUserId] = useState('')
	const [targetRank, setTargetRank] = useState('')
	const [note, setNote] = useState('')
	const [effectiveDate, setEffectiveDate] = useState<string | undefined>()
	// How many picks the last target-rank change dropped (0 = nothing to say).
	const [droppedCount, setDroppedCount] = useState(0)

	const { unitOptions, unitStudents } = useUnitTroopers({ unitId, open })
	const { data: eligibleApprovers } =
		useRankPromotionProposalEligibleApprovers(
			unitId ? { unitId: Number(unitId) } : null,
			{ enabled: open }
		)
	const { data: existingProposals } = useRankPromotionProposals(undefined, {
		enabled: open
	})
	const createMutation = useCreateRankPromotionProposal()

	const lockedIds = useMemo(
		() => lockedStudentIds(existingProposals),
		[existingProposals]
	)
	const eligibleStudents = useMemo(
		() => promotable(unitStudents, lockedIds, targetRank),
		[unitStudents, lockedIds, targetRank]
	)
	// Troopers' own rank/date (only sent when set - a missing entry falls back
	// to the header-level targetRank/effectiveDate) live in the picker as
	// overrides.
	const picker = useTrooperPicker<TrooperOverride>(eligibleStudents)

	const resetForm = () => {
		setUnitId('')
		setApproverUserId('')
		setTargetRank('')
		setNote('')
		setEffectiveDate(undefined)
		setDroppedCount(0)
		picker.reset()
	}

	const handleTargetRankChange = (rank: string) => {
		setTargetRank(rank)
		// Troopers no longer exactly one rank junior to the new target rank must
		// be dropped from the selection - otherwise a greyed-out (ineligible)
		// trooper could stay checked and get submitted anyway.
		const allowed = new Set(
			promotable(unitStudents, lockedIds, rank).map((s) => s.id)
		)
		setDroppedCount(
			[...picker.selectedIds].filter((id) => !allowed.has(id)).length
		)
		picker.retainOnly(allowed)
	}

	const ineligibleReason = (student: Student) => {
		if (lockedIds.has(student.id)) return t('rank.reasonLocked')
		return student.rank === targetRank
			? t('rank.reasonAlready', { rank: targetRank })
			: t('rank.reasonNotAdjacent', { rank: targetRank })
	}

	// The next thing still to fill in, in the order the form is read.
	const missing = !unitId
		? t('common.missing.unit')
		: !targetRank
			? t('rank.missingRank')
			: !approverUserId
				? t('common.missing.approver')
				: !effectiveDate
					? t('common.missing.effectiveDate')
					: picker.selectedIds.size === 0
						? t('common.missing.troopers')
						: null
	const summary = t('rank.summary', {
		rank: targetRank,
		count: picker.selectedIds.size,
		date: effectiveDate ? formatProposalDate(effectiveDate) : ''
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (missing !== null) return

		const body: rank_promotion_proposals.CreateRankPromotionProposalBody = {
			unitId: Number(unitId),
			approverUserId: Number(approverUserId),
			targetRank,
			note: note.trim() || null,
			effectiveDate: effectiveDate ?? null,
			troopers: [...picker.selectedIds].map((studentId) => {
				const override = picker.overrides.get(studentId)
				return {
					studentId,
					targetRank: override?.targetRank ?? null,
					effectiveDate: override?.effectiveDate ?? null
				}
			})
		}

		try {
			await createMutation.mutateAsync(body)
			toast.success(t('rank.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toastApiError(t('rank.createFailed'), err)
		}
	}

	return (
		<ProposalSheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
			triggerLabel={t('rank.createButton')}
			title={t('rank.formTitle')}
			formId='create-rank-promotion-proposal-form'
			onSubmit={handleSubmit}
			submitLabel={t('rank.submit')}
			isPending={createMutation.isPending}
			summary={summary}
			missing={missing}
			fields={
				<>
					<UnitField
						options={unitOptions}
						value={unitId}
						onValueChange={(v) => {
							setUnitId(v)
							setApproverUserId('')
							setDroppedCount(0)
							picker.reset()
						}}
					/>

					<div className='space-y-2'>
						<Label htmlFor='targetRank'>
							{t('rank.targetRank')}
						</Label>
						<RankSelect
							value={targetRank}
							onValueChange={handleTargetRankChange}
							placeholder={t('rank.pickRank')}
							triggerId='targetRank'
						/>
					</div>

					<ApproverField
						value={approverUserId}
						onValueChange={setApproverUserId}
						hasUnit={!!unitId}
						approvers={eligibleApprovers}
					/>

					<EffectiveDateField
						value={effectiveDate}
						onChange={setEffectiveDate}
					/>

					<NoteField value={note} onChange={setNote} />
				</>
			}
			troopers={
				<TrooperPickerList
					hasUnit={!!unitId}
					unitTroopers={unitStudents}
					candidates={eligibleStudents}
					picker={picker}
					ineligibleReason={ineligibleReason}
					noCandidatesMessage={t('rank.noEligibleTroopers')}
					notice={
						droppedCount > 0
							? {
									message: t('common.droppedNotice', {
										count: droppedCount
									}),
									onDismiss: () => setDroppedCount(0)
								}
							: undefined
					}
					formatLabel={(s) =>
						`${s.fullName}${s.rank ? ` (${s.rank})` : ''}`
					}
					customizeLabel={t('rank.customize')}
					useSharedLabel={t('rank.useShared')}
					summarizeOverride={(o) =>
						[
							o.targetRank,
							o.effectiveDate &&
								formatProposalDate(o.effectiveDate)
						]
							.filter(Boolean)
							.join(' · ') || undefined
					}
					renderOverride={(student, override) => (
						<div className='space-y-2'>
							<RankSelect
								value={override?.targetRank ?? ''}
								onValueChange={(v) =>
									picker.setOverride(student.id, {
										targetRank: v
									})
								}
								placeholder={t('rank.rankOwn')}
							/>
							<ProposalDateField
								value={override?.effectiveDate}
								onChange={(v) =>
									picker.setOverride(student.id, {
										effectiveDate: v
									})
								}
								placeholder={t('common.effectiveDateOwn')}
							/>
						</div>
					)}
				/>
			}
		/>
	)
}

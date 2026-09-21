import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import DateRangePicker from '@/components/date-range-picker'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	activityStatusLabel,
	targetActivityStatusOptions
} from '@/data/activity-statuses'
import { useCreateActivityStatusProposal } from '@/hooks/useCreateActivityStatusProposal'
import useActivityStatusProposalEligibleApprovers from '@/hooks/useActivityStatusProposalEligibleApprovers'
import type { activity_status_proposals } from '@/api/client'
import { toastApiError } from '@/lib/api-error'
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
import { fromDateRange, isRangedTarget, toDateRange } from './date-range'

type TrooperDates = {
	effectiveDate?: string
	startDate?: string
	endDate?: string
}

export default function CreateActivityStatusProposalForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const { t } = useTranslation('proposals')
	const [open, setOpen] = useState(false)
	const [unitId, setUnitId] = useState('')
	const [approverUserId, setApproverUserId] = useState('')
	const [targetActivityStatus, setTargetActivityStatus] = useState('')
	const [note, setNote] = useState('')
	const [effectiveDate, setEffectiveDate] = useState<string | undefined>()
	const [startDate, setStartDate] = useState<string | undefined>()
	const [endDate, setEndDate] = useState<string | undefined>()

	const { unitOptions, unitStudents } = useUnitTroopers({ unitId, open })
	const { data: eligibleApprovers } =
		useActivityStatusProposalEligibleApprovers(
			unitId ? { unitId: Number(unitId) } : null,
			{ enabled: open }
		)
	const createMutation = useCreateActivityStatusProposal()

	// Any trooper of the unit may take any status. A trooper's own dates (only
	// sent when set - a missing entry falls back to the header-level date(s))
	// live in the picker as overrides.
	const picker = useTrooperPicker<TrooperDates>(unitStudents)

	const ranged = isRangedTarget(targetActivityStatus)

	const resetForm = () => {
		setUnitId('')
		setApproverUserId('')
		setTargetActivityStatus('')
		setNote('')
		setEffectiveDate(undefined)
		setStartDate(undefined)
		setEndDate(undefined)
		picker.reset()
	}

	// The next thing still to fill in, in the order the form is read.
	const missing = !unitId
		? t('common.missing.unit')
		: !targetActivityStatus
			? t('activity.missingStatus')
			: !approverUserId
				? t('common.missing.approver')
				: ranged && (!startDate || !endDate)
					? t('activity.missingDates')
					: !ranged && !effectiveDate
						? t('common.missing.effectiveDate')
						: picker.selectedIds.size === 0
							? t('common.missing.troopers')
							: null
	const summaryValues = {
		status: activityStatusLabel(targetActivityStatus),
		count: picker.selectedIds.size
	}
	const summary = ranged
		? t('activity.summaryRange', {
				...summaryValues,
				start: startDate ? formatProposalDate(startDate) : '',
				end: endDate ? formatProposalDate(endDate) : ''
			})
		: t('activity.summaryDate', {
				...summaryValues,
				date: effectiveDate ? formatProposalDate(effectiveDate) : ''
			})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (missing !== null) return

		const body: activity_status_proposals.CreateActivityStatusProposalBody =
			{
				unitId: Number(unitId),
				approverUserId: Number(approverUserId),
				targetActivityStatus:
					targetActivityStatus as activity_status_proposals.CreateActivityStatusProposalBody['targetActivityStatus'],
				note: note.trim() || null,
				effectiveDate: ranged ? null : (effectiveDate ?? null),
				startDate: ranged ? (startDate ?? null) : null,
				endDate: ranged ? (endDate ?? null) : null,
				troopers: [...picker.selectedIds].map((studentId) => {
					const override = picker.overrides.get(studentId)
					return {
						studentId,
						effectiveDate:
							!ranged && override?.effectiveDate
								? override.effectiveDate
								: null,
						startDate:
							ranged && override?.startDate
								? override.startDate
								: null,
						endDate:
							ranged && override?.endDate
								? override.endDate
								: null
					}
				})
			}

		try {
			await createMutation.mutateAsync(body)
			toast.success(t('activity.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toastApiError(t('activity.createFailed'), err)
		}
	}

	return (
		<ProposalSheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
			triggerLabel={t('activity.createButton')}
			title={t('activity.formTitle')}
			formId='create-activity-status-proposal-form'
			onSubmit={handleSubmit}
			submitLabel={t('activity.submit')}
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
							picker.reset()
						}}
					/>

					<div className='space-y-2'>
						<Label>{t('activity.targetStatus')}</Label>
						<Select
							value={targetActivityStatus}
							onValueChange={(v) => {
								setTargetActivityStatus(v)
								setEffectiveDate(undefined)
								setStartDate(undefined)
								setEndDate(undefined)
								// The shared dates changed shape, so per-trooper ones
								// no longer apply.
								picker.clearOverrides()
							}}
						>
							<SelectTrigger className='w-full'>
								<SelectValue
									placeholder={t('activity.pickStatus')}
								/>
							</SelectTrigger>
							<SelectContent>
								{targetActivityStatusOptions.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{t(`activityStatus.${o.value}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<ApproverField
						value={approverUserId}
						onValueChange={setApproverUserId}
						hasUnit={!!unitId}
						approvers={eligibleApprovers}
					/>

					{targetActivityStatus &&
						(ranged ? (
							<div className='space-y-2'>
								<Label>{t('activity.dateRange')}</Label>
								<DateRangePicker
									value={toDateRange(startDate, endDate)}
									onChange={(range) => {
										const dates = fromDateRange(range)
										setStartDate(dates.startDate)
										setEndDate(dates.endDate)
									}}
									placeholder={t('activity.pickDateRange')}
									className='w-full'
								/>
							</div>
						) : (
							<EffectiveDateField
								value={effectiveDate}
								onChange={setEffectiveDate}
							/>
						))}

					<NoteField value={note} onChange={setNote} />
				</>
			}
			troopers={
				<TrooperPickerList
					hasUnit={!!unitId}
					unitTroopers={unitStudents}
					candidates={unitStudents}
					picker={picker}
					canCustomize={!!targetActivityStatus}
					customizeLabel={t('activity.customDates')}
					useSharedLabel={t('activity.useSharedDates')}
					summarizeOverride={(o) => {
						if (!ranged) {
							return o.effectiveDate
								? formatProposalDate(o.effectiveDate)
								: undefined
						}
						if (!o.startDate && !o.endDate) return undefined
						const fmt = (d: string | undefined) =>
							d ? formatProposalDate(d) : '…'
						return `${fmt(o.startDate)} → ${fmt(o.endDate)}`
					}}
					renderOverride={(student, override) =>
						ranged ? (
							<DateRangePicker
								value={toDateRange(
									override?.startDate,
									override?.endDate
								)}
								onChange={(range) =>
									picker.setOverride(
										student.id,
										fromDateRange(range)
									)
								}
								placeholder={t('activity.dateRangeOwn')}
								className='w-full'
							/>
						) : (
							<ProposalDateField
								value={override?.effectiveDate}
								onChange={(v) =>
									picker.setOverride(student.id, {
										effectiveDate: v
									})
								}
								placeholder={t('common.effectiveDateOwn')}
							/>
						)
					}
				/>
			}
		/>
	)
}

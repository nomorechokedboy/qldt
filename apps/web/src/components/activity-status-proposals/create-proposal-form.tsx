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
import { targetActivityStatusOptions } from '@/data/activity-statuses'
import { useCreateActivityStatusProposal } from '@/hooks/useCreateActivityStatusProposal'
import useActivityStatusProposalEligibleApprovers from '@/hooks/useActivityStatusProposalEligibleApprovers'
import type { activity_status_proposals } from '@/api/client'
import { toastApiError } from '@/lib/api-error'
import ProposalDateField from '@/components/proposal-form/date-field'
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (picker.selectedIds.size === 0) {
			toast.error(t('common.selectAtLeastOneTrooper'))
			return
		}

		if (ranged && (!startDate || !endDate)) {
			toast.error(t('activity.pickRangeDates'))
			return
		}
		if (!ranged && !effectiveDate) {
			toast.error(t('common.effectiveDateRequired'))
			return
		}

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
			submitDisabled={
				!unitId ||
				!approverUserId ||
				!targetActivityStatus ||
				(ranged ? !startDate || !endDate : !effectiveDate)
			}
		>
			<UnitField
				options={unitOptions}
				value={unitId}
				onValueChange={(v) => {
					setUnitId(v)
					setApproverUserId('')
					picker.reset()
				}}
			/>

			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label>{t('activity.targetStatus')}</Label>
					<Select
						value={targetActivityStatus}
						onValueChange={(v) => {
							setTargetActivityStatus(v)
							setEffectiveDate(undefined)
							setStartDate(undefined)
							setEndDate(undefined)
							// The shared dates changed shape, so per-trooper ones no
							// longer apply.
							picker.clearOverrides()
						}}
					>
						<SelectTrigger>
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
			</div>

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

			<TrooperPickerList
				hasUnit={!!unitId}
				unitTroopers={unitStudents}
				candidates={unitStudents}
				picker={picker}
				canCustomize={!!targetActivityStatus}
				customizeLabel={t('activity.customDates')}
				useSharedLabel={t('activity.useSharedDates')}
				renderOverride={(student, override) => (
					<div className='mt-2 pl-6'>
						{ranged ? (
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
						)}
					</div>
				)}
			/>
		</ProposalSheet>
	)
}

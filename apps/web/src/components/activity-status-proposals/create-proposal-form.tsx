import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Plus, Search, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { targetActivityStatusOptions } from '@/data/activity-statuses'
import { useCreateActivityStatusProposal } from '@/hooks/useCreateActivityStatusProposal'
import useActivityStatusProposalEligibleApprovers from '@/hooks/useActivityStatusProposalEligibleApprovers'
import useStudentData from '@/hooks/useStudents'
import UnitSelect from '@/components/unit/select'
import useUnitOptions from '@/hooks/useUnitOptions'
import { getErrorMessage } from '@/lib/utils'
import type { activity_status_proposals } from '@/api/client'
import DateRangePicker from '@/components/date-range-picker'
import ActivityStatusDateField from './date-field'

// The picker speaks Date/DateRange; proposal dates are stored and sent as
// "YYYY-MM-DD" strings, so every read/write goes through these two helpers.
function toDateRange(
	start: string | undefined,
	end: string | undefined
): DateRange | undefined {
	const from = start ? dayjs(start, 'YYYY-MM-DD') : undefined
	const to = end ? dayjs(end, 'YYYY-MM-DD') : undefined
	if (!from?.isValid() && !to?.isValid()) return undefined
	return {
		from: from?.isValid() ? from.toDate() : undefined,
		to: to?.isValid() ? to.toDate() : undefined
	}
}

function fromDateRange(range: DateRange | undefined): {
	startDate: string | undefined
	endDate: string | undefined
} {
	return {
		startDate: range?.from
			? dayjs(range.from).format('YYYY-MM-DD')
			: undefined,
		endDate: range?.to ? dayjs(range.to).format('YYYY-MM-DD') : undefined
	}
}

// 'discharged' is a one-off transition (single effectiveDate); the other 3
// target statuses are ranged (startDate -> endDate). Mirrors
// isRangedTargetActivityStatus on the backend.
const isRangedTarget = (target: string) =>
	target !== '' && target !== 'discharged'

type TrooperDates = {
	effectiveDate?: string
	startDate?: string
	endDate?: string
}

// Diacritic- and case-insensitive match so searching "nguyen" finds "Nguyễn"
// - typing tone marks on every search is a real friction point for
// Vietnamese names, and the trooper list is exactly where a long roster
// makes that friction worst.
function normalizeForSearch(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/g, 'd')
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
	const [trooperIds, setTrooperIds] = useState<Set<number>>(new Set())
	const [effectiveDate, setEffectiveDate] = useState<string | undefined>()
	const [startDate, setStartDate] = useState<string | undefined>()
	const [endDate, setEndDate] = useState<string | undefined>()
	const [trooperSearch, setTrooperSearch] = useState('')
	// Troopers whose "tuỳ chỉnh ngày riêng" row is expanded, and their
	// override values (only sent to the backend when set - a missing entry
	// falls back to the header-level date(s) above).
	const [trooperDateOverrides, setTrooperDateOverrides] = useState<
		Map<number, TrooperDates>
	>(new Map())

	// Proposals require a Battalion level unit or larger (matches the backend
	// constraint), scoped to the units the current user can access.
	const { units, options: unitOptions } = useUnitOptions({
		enabled: open,
		minLevel: 'battalion'
	})
	const { data: students } = useStudentData(undefined, {
		enabled: open && !!unitId
	})
	const { data: eligibleApprovers } =
		useActivityStatusProposalEligibleApprovers(
			unitId ? { unitId: Number(unitId) } : null,
			{ enabled: open }
		)

	const createMutation = useCreateActivityStatusProposal()

	// A proposal may cover troopers belonging to the selected unit or any of
	// its subordinate (descendant) units, not only ones registered directly
	// on the unit itself (matches the backend's unitAndDescendantIds scope).
	const unitScopeIds = useMemo(() => {
		if (!unitId || !units) return new Set<number>()

		const childrenByParentId = new Map<number, number[]>()
		for (const u of units) {
			if (!u.parent) continue
			const list = childrenByParentId.get(u.parent.id) ?? []
			list.push(u.id)
			childrenByParentId.set(u.parent.id, list)
		}

		const rootId = Number(unitId)
		const scope = new Set<number>([rootId])
		const queue = [rootId]
		while (queue.length > 0) {
			const current = queue.shift()!
			for (const childId of childrenByParentId.get(current) ?? []) {
				if (!scope.has(childId)) {
					scope.add(childId)
					queue.push(childId)
				}
			}
		}
		return scope
	}, [units, unitId])

	// A student is either attached directly to a unit (unitId) or is a squad
	// member reached only through their class (class.unit.id).
	const unitStudents = useMemo(
		() =>
			(students ?? []).filter((s) => {
				const id = s.unitId ?? s.class?.unit?.id
				return id !== undefined && unitScopeIds.has(id)
			}),
		[students, unitScopeIds]
	)

	// The name search narrows what's rendered, not what's selectable - a
	// trooper picked before a search (or under a different query) stays
	// selected even while filtered out of view.
	const visibleStudents = useMemo(() => {
		const query = normalizeForSearch(trooperSearch.trim())
		if (!query) return unitStudents
		return unitStudents.filter((s) =>
			normalizeForSearch(s.fullName ?? '').includes(query)
		)
	}, [unitStudents, trooperSearch])

	const resetForm = () => {
		setUnitId('')
		setApproverUserId('')
		setTargetActivityStatus('')
		setNote('')
		setTrooperIds(new Set())
		setEffectiveDate(undefined)
		setStartDate(undefined)
		setEndDate(undefined)
		setTrooperDateOverrides(new Map())
		setTrooperSearch('')
	}

	const setTrooperDateOverride = (id: number, patch: TrooperDates) => {
		setTrooperDateOverrides((prev) => {
			const next = new Map(prev)
			next.set(id, { ...next.get(id), ...patch })
			return next
		})
	}

	const toggleTrooperDateOverride = (id: number, value: boolean) => {
		setTrooperDateOverrides((prev) => {
			const next = new Map(prev)
			if (value) next.set(id, next.get(id) ?? {})
			else next.delete(id)
			return next
		})
	}

	// Functional updates (not the render-scope `trooperIds`) so rapid
	// successive toggles in the same batch each see the previous toggle's
	// result instead of racing against a stale closure. The copy itself is
	// required, not redundant: React state must never be mutated in place,
	// only replaced with a new reference so it re-renders and no other
	// closure holding the old Set observes the mutation.
	const toggleTrooper = (id: number) => {
		setTrooperIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
				setTrooperDateOverrides((overrides) => {
					if (!overrides.has(id)) return overrides
					const nextOverrides = new Map(overrides)
					nextOverrides.delete(id)
					return nextOverrides
				})
			} else next.add(id)
			return next
		})
	}
	// Scoped to visibleStudents (not the full roster) so "select all" under an
	// active search only affects the troopers actually shown - matching
	// filtered multi-select elsewhere (e.g. Gmail), and avoiding a search
	// wiping out selections made under a different query.
	const toggleAllTroopers = (value: boolean) => {
		setTrooperIds((prev) => {
			const next = new Set(prev)
			for (const s of visibleStudents) {
				if (value) next.add(s.id)
				else next.delete(s.id)
			}
			return next
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (trooperIds.size === 0) {
			toast.error(t('common.selectAtLeastOneTrooper'))
			return
		}

		const ranged = isRangedTarget(targetActivityStatus)
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
				troopers: [...trooperIds].map((studentId) => {
					const override = trooperDateOverrides.get(studentId)
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
			toast.error(getErrorMessage(err, t('activity.createFailed')))
		}
	}

	// A count comparison alone would misreport "all selected" if trooperIds
	// ever diverges from the current roster (e.g. the roster changes while
	// the sheet is open) but still happens to match its size — checking
	// actual membership avoids that. Scoped to visibleStudents to match
	// toggleAllTroopers above.
	const isAllTroopersSelected =
		visibleStudents.length > 0 &&
		visibleStudents.every((trooper) => trooperIds.has(trooper.id))
	const isSomeVisibleTrooperSelected = visibleStudents.some((trooper) =>
		trooperIds.has(trooper.id)
	)

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
		>
			<SheetTrigger asChild>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					{t('activity.createButton')}
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full overflow-hidden sm:max-w-xl'>
				<SheetHeader>
					<SheetTitle>{t('activity.formTitle')}</SheetTitle>
				</SheetHeader>
				<form
					id='create-activity-status-proposal-form'
					className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-4 pb-4'
					onSubmit={handleSubmit}
				>
					<div className='space-y-2'>
						<Label>{t('common.unit')}</Label>
						<UnitSelect
							options={unitOptions}
							value={unitId}
							onValueChange={(v) => {
								setUnitId(v)
								setTrooperIds(new Set())
								setApproverUserId('')
								setTrooperSearch('')
							}}
						/>
					</div>

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
									setTrooperDateOverrides(new Map())
								}}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t('activity.pickStatus')}
									/>
								</SelectTrigger>
								<SelectContent>
									{targetActivityStatusOptions.map((o) => (
										<SelectItem
											key={o.value}
											value={o.value}
										>
											{t(`activityStatus.${o.value}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label>{t('common.approver')}</Label>
							<Select
								value={approverUserId}
								onValueChange={setApproverUserId}
								disabled={!unitId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t('common.pickApprover')}
									/>
								</SelectTrigger>
								<SelectContent>
									{(eligibleApprovers ?? []).map((u) => (
										<SelectItem
											key={u.id}
											value={String(u.id)}
										>
											{u.displayName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className='text-xs text-muted-foreground'>
								{!unitId
									? t('common.approverNeedsUnit')
									: (eligibleApprovers ?? []).length === 0
										? t('common.approverNone')
										: t('common.approverHint')}
							</p>
						</div>
					</div>

					{targetActivityStatus &&
						(isRangedTarget(targetActivityStatus) ? (
							<div className='space-y-2'>
								<Label>{t('activity.dateRange')}</Label>
								<DateRangePicker
									value={toDateRange(startDate, endDate)}
									onChange={(range) => {
										const { startDate: s, endDate: e } =
											fromDateRange(range)
										setStartDate(s)
										setEndDate(e)
									}}
									placeholder={t('activity.pickDateRange')}
									className='w-full'
								/>
							</div>
						) : (
							<div className='space-y-2'>
								<Label>{t('common.effectiveDate')}</Label>
								<ActivityStatusDateField
									value={effectiveDate}
									onChange={setEffectiveDate}
									placeholder={t('common.pickEffectiveDate')}
								/>
							</div>
						))}

					<div className='space-y-2'>
						<Label>{t('common.noteOptional')}</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</div>

					<div className='flex min-h-0 flex-1 flex-col space-y-2'>
						<div className='flex items-center justify-between gap-2'>
							<Label>{t('common.troopers')}</Label>
							{unitStudents.length > 0 && (
								<span className='text-xs text-muted-foreground'>
									{t('common.selectedCount', {
										selected: trooperIds.size,
										total: unitStudents.length
									})}
								</span>
							)}
						</div>
						{!unitId ? (
							<p className='py-6 text-center text-sm text-muted-foreground'>
								{t('common.pickUnitForTroopers')}
							</p>
						) : (
							<>
								{unitStudents.length > 0 && (
									<div className='relative'>
										<Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
										<Input
											value={trooperSearch}
											onChange={(e) =>
												setTrooperSearch(e.target.value)
											}
											placeholder={t(
												'common.searchTrooper'
											)}
											className='pl-8 pr-8'
										/>
										{trooperSearch && (
											<button
												type='button'
												onClick={() =>
													setTrooperSearch('')
												}
												className='absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground'
											>
												<X className='size-4' />
												<span className='sr-only'>
													{t('common.clearSearch')}
												</span>
											</button>
										)}
									</div>
								)}
								<ScrollArea className='min-h-32 flex-1 rounded-md border p-2'>
									{unitStudents.length === 0 && (
										<p className='p-2 text-sm text-muted-foreground'>
											{t('common.noTroopersInUnit')}
										</p>
									)}
									{unitStudents.length !== 0 &&
										visibleStudents.length === 0 && (
											<div className='flex flex-col items-center gap-2 p-4 text-center'>
												<p className='text-sm text-muted-foreground'>
													{t('common.noSearchMatch', {
														query: trooperSearch
													})}
												</p>
												<Button
													type='button'
													variant='link'
													size='sm'
													className='h-auto p-0 text-xs'
													onClick={() =>
														setTrooperSearch('')
													}
												>
													{t('common.clearSearch')}
												</Button>
											</div>
										)}

									{visibleStudents.length !== 0 && (
										<Label
											htmlFor='proposalTrooperCheckAll'
											className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
										>
											<Checkbox
												checked={
													isAllTroopersSelected ||
													(isSomeVisibleTrooperSelected &&
														'indeterminate')
												}
												onCheckedChange={(value) => {
													toggleAllTroopers(!!value)
												}}
												id='proposalTrooperCheckAll'
											/>
											{t('common.selectAll')}
											{visibleStudents.length !==
												unitStudents.length &&
												` ${t('common.shownCount', { count: visibleStudents.length })}`}
										</Label>
									)}
									{visibleStudents.length !== 0 &&
										visibleStudents.map((s) => {
											const isSelected = trooperIds.has(
												s.id
											)
											const hasOverride =
												trooperDateOverrides.has(s.id)
											const override =
												trooperDateOverrides.get(s.id)
											const ranged =
												isRangedTarget(
													targetActivityStatus
												)
											return (
												<div
													key={s.id}
													className='rounded-md p-2 hover:bg-muted'
												>
													<Label
														className='flex items-center gap-2'
														htmlFor={`trooperID-${s.id}`}
													>
														<Checkbox
															id={`trooperID-${s.id}`}
															checked={isSelected}
															onCheckedChange={() =>
																toggleTrooper(
																	s.id
																)
															}
														/>
														<span className='flex-1 text-sm'>
															{s.fullName}
														</span>
														{isSelected &&
															targetActivityStatus && (
																<Button
																	type='button'
																	variant='link'
																	size='sm'
																	className='h-auto p-0 text-xs'
																	onClick={() =>
																		toggleTrooperDateOverride(
																			s.id,
																			!hasOverride
																		)
																	}
																>
																	{hasOverride
																		? t(
																				'activity.useSharedDates'
																			)
																		: t(
																				'activity.customDates'
																			)}
																</Button>
															)}
													</Label>
													{isSelected &&
														hasOverride &&
														(ranged ? (
															<div className='mt-2 pl-6'>
																<DateRangePicker
																	value={toDateRange(
																		override?.startDate,
																		override?.endDate
																	)}
																	onChange={(
																		range
																	) => {
																		const {
																			startDate:
																				s2,
																			endDate:
																				e2
																		} =
																			fromDateRange(
																				range
																			)
																		setTrooperDateOverride(
																			s.id,
																			{
																				startDate:
																					s2,
																				endDate:
																					e2
																			}
																		)
																	}}
																	placeholder={t(
																		'activity.dateRangeOwn'
																	)}
																	className='w-full'
																/>
															</div>
														) : (
															<div className='mt-2 pl-6'>
																<ActivityStatusDateField
																	value={
																		override?.effectiveDate
																	}
																	onChange={(
																		v
																	) =>
																		setTrooperDateOverride(
																			s.id,
																			{
																				effectiveDate:
																					v
																			}
																		)
																	}
																	placeholder={t(
																		'common.effectiveDateOwn'
																	)}
																/>
															</div>
														))}
												</div>
											)
										})}
								</ScrollArea>
							</>
						)}
					</div>
				</form>
				<SheetFooter>
					<Button
						type='submit'
						form='create-activity-status-proposal-form'
						disabled={
							createMutation.isPending ||
							!unitId ||
							!approverUserId ||
							!targetActivityStatus ||
							(isRangedTarget(targetActivityStatus)
								? !startDate || !endDate
								: !effectiveDate)
						}
					>
						{createMutation.isPending
							? t('common.creating')
							: t('activity.submit')}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

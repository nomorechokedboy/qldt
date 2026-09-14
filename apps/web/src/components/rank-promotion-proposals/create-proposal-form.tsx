import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { isDirectPromotion } from '@/data/rank-order'
import { rankOptions } from '@/data/ranks'
import { isBattalionOrAboveLevel } from '@/data/unit-levels'
import { useCreateRankPromotionProposal } from '@/hooks/useCreateRankPromotionProposal'
import useRankPromotionProposalEligibleApprovers from '@/hooks/useRankPromotionProposalEligibleApprovers'
import useRankPromotionProposals from '@/hooks/useRankPromotionProposals'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import { getErrorMessage } from '@/lib/utils'
import type { rank_promotion_proposals } from '@/api/client'
import RankPromotionDateField from './date-field'

const [, ...rankOptionsWithoutPrivate] = rankOptions

type TrooperOverride = {
	targetRank?: string
	effectiveDate?: string
}

export default function CreateRankPromotionProposalForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [unitId, setUnitId] = useState('')
	const [approverUserId, setApproverUserId] = useState('')
	const [targetRank, setTargetRank] = useState('')
	const [note, setNote] = useState('')
	const [trooperIds, setTrooperIds] = useState<Set<number>>(new Set())
	const [effectiveDate, setEffectiveDate] = useState<string | undefined>()
	// Troopers whose "tuỳ chỉnh riêng" row is expanded, and their override
	// values (only sent to the backend when set - a missing entry falls back
	// to the header-level targetRank/effectiveDate above).
	const [trooperOverrides, setTrooperOverrides] = useState<
		Map<number, TrooperOverride>
	>(new Map())

	const { data: units } = useUnitsData(undefined, { enabled: open })
	const { data: students } = useStudentData(undefined, {
		enabled: open && !!unitId
	})
	const { data: eligibleApprovers } =
		useRankPromotionProposalEligibleApprovers(
			unitId ? { unitId: Number(unitId) } : null,
			{ enabled: open }
		)
	const { data: existingProposals } = useRankPromotionProposals(undefined, {
		enabled: open
	})

	const createMutation = useCreateRankPromotionProposal()

	// Students already committed to another still-live proposal (pending, or
	// approved but not yet applied) - mirrors the backend's
	// findLockedStudentIds() so the picker never offers a trooper the create
	// call would just reject. This is a UX nicety only; create() is the
	// actual enforcement point.
	const lockedStudentIds = useMemo(() => {
		const locked = new Set<number>()
		for (const p of existingProposals ?? []) {
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
	}, [existingProposals])

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

	// Only troopers exactly one rank junior to the header's targetRank, and
	// not already locked into another live proposal, are shown — a
	// promotion proposal moves troopers up to the next rank, not several at
	// once. Until a target rank is chosen, every non-locked unit trooper is
	// shown.
	const eligibleStudents = useMemo(() => {
		const notLocked = unitStudents.filter(
			(s) => !lockedStudentIds.has(s.id)
		)
		return targetRank
			? notLocked.filter((s) => isDirectPromotion(s.rank, targetRank))
			: notLocked
	}, [unitStudents, targetRank, lockedStudentIds])

	// Rank promotion proposals require the unit to be Battalion level or
	// larger (matches the backend constraint). Scoped to units the current
	// user can access.
	const eligibleUnits = useMemo(
		() => (units ?? []).filter((u) => isBattalionOrAboveLevel(u.level)),
		[units]
	)

	const resetForm = () => {
		setUnitId('')
		setApproverUserId('')
		setTargetRank('')
		setNote('')
		setTrooperIds(new Set())
		setEffectiveDate(undefined)
		setTrooperOverrides(new Map())
	}

	const setTrooperOverride = (id: number, patch: TrooperOverride) => {
		setTrooperOverrides((prev) => {
			const next = new Map(prev)
			next.set(id, { ...next.get(id), ...patch })
			return next
		})
	}

	const toggleTrooperOverride = (id: number, value: boolean) => {
		setTrooperOverrides((prev) => {
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
				setTrooperOverrides((overrides) => {
					if (!overrides.has(id)) return overrides
					const nextOverrides = new Map(overrides)
					nextOverrides.delete(id)
					return nextOverrides
				})
			} else next.add(id)
			return next
		})
	}
	const toggleAllTroopers = (value: boolean) => {
		if (!value) {
			setTrooperIds(new Set())
			return
		}
		setTrooperIds(new Set(eligibleStudents.map((trooper) => trooper.id)))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (trooperIds.size === 0) {
			toast.error('Vui lòng chọn ít nhất một quân nhân')
			return
		}

		if (!effectiveDate) {
			toast.error('Vui lòng chọn ngày hiệu lực')
			return
		}

		const body: rank_promotion_proposals.CreateRankPromotionProposalBody = {
			unitId: Number(unitId),
			approverUserId: Number(approverUserId),
			targetRank,
			note: note.trim() || null,
			effectiveDate: effectiveDate ?? null,
			troopers: [...trooperIds].map((studentId) => {
				const override = trooperOverrides.get(studentId)
				return {
					studentId,
					targetRank: override?.targetRank ?? null,
					effectiveDate: override?.effectiveDate ?? null
				}
			})
		}

		try {
			await createMutation.mutateAsync(body)
			toast.success('Tạo đề xuất thăng quân hàm thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toast.error(getErrorMessage(err, 'Tạo đề xuất thất bại!'))
		}
	}

	// A count comparison alone would misreport "all selected" if trooperIds
	// ever diverges from the current roster (e.g. the roster changes while
	// the sheet is open) but still happens to match its size — checking
	// actual membership avoids that.
	const isAllTroopersSelected =
		eligibleStudents.length > 0 &&
		eligibleStudents.every((trooper) => trooperIds.has(trooper.id))
	const isSomeTrooperSelected = trooperIds.size > 0

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
					Tạo đề xuất thăng quân hàm
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full overflow-hidden sm:max-w-xl'>
				<SheetHeader>
					<SheetTitle>Đề xuất thăng quân hàm</SheetTitle>
				</SheetHeader>
				<form
					id='create-rank-promotion-proposal-form'
					className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-4 pb-4'
					onSubmit={handleSubmit}
				>
					<div className='space-y-2'>
						<Label>Đơn vị</Label>
						<Select
							value={unitId}
							onValueChange={(v) => {
								setUnitId(v)
								setTrooperIds(new Set())
								setApproverUserId('')
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder='Chọn đơn vị' />
							</SelectTrigger>
							<SelectContent>
								{eligibleUnits.map((u) => (
									<SelectItem key={u.id} value={String(u.id)}>
										{u.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='targetRank'>Quân hàm đề xuất</Label>
							<Select
								value={targetRank}
								onValueChange={(v) => {
									setTargetRank(v)
									// Troopers no longer exactly one rank
									// junior to the new target rank must be
									// dropped from the selection - otherwise a
									// hidden (filtered-out) trooper could stay
									// checked and get submitted anyway.
									const eligibleIds = new Set(
										unitStudents
											.filter(
												(s) =>
													!lockedStudentIds.has(
														s.id
													) &&
													isDirectPromotion(s.rank, v)
											)
											.map((s) => s.id)
									)
									setTrooperIds(
										(prev) =>
											new Set(
												[...prev].filter((id) =>
													eligibleIds.has(id)
												)
											)
									)
									setTrooperOverrides((prev) => {
										const next = new Map(prev)
										for (const id of next.keys()) {
											if (!eligibleIds.has(id)) {
												next.delete(id)
											}
										}
										return next
									})
								}}
							>
								<SelectTrigger id='targetRank'>
									<SelectValue placeholder='Chọn quân hàm' />
								</SelectTrigger>
								<SelectContent>
									{rankOptionsWithoutPrivate.map((o) => (
										<SelectItem
											key={o.value}
											value={o.value}
										>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label>Người phê duyệt</Label>
							<Select
								value={approverUserId}
								onValueChange={setApproverUserId}
								disabled={!unitId}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn người phê duyệt' />
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
									? 'Chọn đơn vị để xem người có thể phê duyệt'
									: (eligibleApprovers ?? []).length === 0
										? 'Không có người phê duyệt hợp lệ cho đơn vị này'
										: 'Chỉ huy/chính trị viên (hoặc cấp phó) của đơn vị này hoặc cấp trên'}
							</p>
						</div>
					</div>

					<div className='space-y-2'>
						<Label>Ngày hiệu lực</Label>
						<RankPromotionDateField
							value={effectiveDate}
							onChange={setEffectiveDate}
							placeholder='Chọn ngày hiệu lực'
						/>
					</div>

					<div className='space-y-2'>
						<Label>Ghi chú (tuỳ chọn)</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
					</div>

					<div className='flex min-h-0 flex-1 flex-col space-y-2'>
						<Label>Quân nhân</Label>
						{!unitId ? (
							<p className='py-6 text-center text-sm text-muted-foreground'>
								Chọn đơn vị để xem danh sách quân nhân
							</p>
						) : (
							<ScrollArea className='min-h-32 flex-1 rounded-md border p-2'>
								{unitStudents.length === 0 && (
									<p className='p-2 text-sm text-muted-foreground'>
										Không có quân nhân nào thuộc đơn vị này
									</p>
								)}
								{unitStudents.length !== 0 &&
									eligibleStudents.length === 0 && (
										<p className='p-2 text-sm text-muted-foreground'>
											Không có quân nhân nào đủ điều kiện
											thăng lên quân hàm này
										</p>
									)}

								{eligibleStudents.length !== 0 && (
									<Label
										htmlFor='proposalTrooperCheckAll'
										className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
									>
										<Checkbox
											checked={
												isAllTroopersSelected ||
												(isSomeTrooperSelected &&
													'indeterminate')
											}
											onCheckedChange={(value) => {
												toggleAllTroopers(!!value)
											}}
											id='proposalTrooperCheckAll'
										/>
										Chọn tất cả
									</Label>
								)}
								{eligibleStudents.length !== 0 &&
									eligibleStudents.map((s) => {
										const isSelected = trooperIds.has(s.id)
										const hasOverride =
											trooperOverrides.has(s.id)
										const override = trooperOverrides.get(
											s.id
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
															toggleTrooper(s.id)
														}
													/>
													<span className='flex-1 text-sm'>
														{s.fullName}
														{s.rank
															? ` (${s.rank})`
															: ''}
													</span>
													{isSelected && (
														<Button
															type='button'
															variant='link'
															size='sm'
															className='h-auto p-0 text-xs'
															onClick={() =>
																toggleTrooperOverride(
																	s.id,
																	!hasOverride
																)
															}
														>
															{hasOverride
																? 'Dùng chung'
																: 'Tuỳ chỉnh riêng'}
														</Button>
													)}
												</Label>
												{isSelected && hasOverride && (
													<div className='mt-2 space-y-2 pl-6'>
														<Select
															value={
																override?.targetRank ??
																''
															}
															onValueChange={(
																v
															) =>
																setTrooperOverride(
																	s.id,
																	{
																		targetRank:
																			v
																	}
																)
															}
														>
															<SelectTrigger>
																<SelectValue placeholder='Quân hàm (riêng)' />
															</SelectTrigger>
															<SelectContent>
																{rankOptionsWithoutPrivate.map(
																	(o) => (
																		<SelectItem
																			key={
																				o.value
																			}
																			value={
																				o.value
																			}
																		>
																			{
																				o.label
																			}
																		</SelectItem>
																	)
																)}
															</SelectContent>
														</Select>
														<RankPromotionDateField
															value={
																override?.effectiveDate
															}
															onChange={(v) =>
																setTrooperOverride(
																	s.id,
																	{
																		effectiveDate:
																			v
																	}
																)
															}
															placeholder='Ngày hiệu lực (riêng)'
														/>
													</div>
												)}
											</div>
										)
									})}
							</ScrollArea>
						)}
					</div>
				</form>
				<SheetFooter>
					<Button
						type='submit'
						form='create-rank-promotion-proposal-form'
						disabled={
							createMutation.isPending ||
							!unitId ||
							!approverUserId ||
							!targetRank ||
							!effectiveDate
						}
					>
						{createMutation.isPending
							? 'Đang tạo...'
							: 'Tạo đề xuất'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

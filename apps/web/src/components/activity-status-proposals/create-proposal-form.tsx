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
import { targetActivityStatusOptions } from '@/data/activity-statuses'
import { isBattalionOrAboveLevel } from '@/data/unit-levels'
import { useCreateActivityStatusProposal } from '@/hooks/useCreateActivityStatusProposal'
import useActivityStatusProposalEligibleApprovers from '@/hooks/useActivityStatusProposalEligibleApprovers'
import useStudentData from '@/hooks/useStudents'
import useUnitsData from '@/hooks/useUnitsData'
import { getErrorMessage } from '@/lib/utils'
import type { activity_status_proposals } from '@/api/client'

export default function CreateActivityStatusProposalForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [unitId, setUnitId] = useState('')
	const [approverUserId, setApproverUserId] = useState('')
	const [targetActivityStatus, setTargetActivityStatus] = useState('')
	const [note, setNote] = useState('')
	const [trooperIds, setTrooperIds] = useState<Set<number>>(new Set())

	const { data: units } = useUnitsData(undefined, { enabled: open })
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

	// Activity status proposals require the unit to be Battalion level or
	// larger (matches the backend constraint). Scoped to units the current
	// user can access.
	const eligibleUnits = useMemo(
		() => (units ?? []).filter((u) => isBattalionOrAboveLevel(u.level)),
		[units]
	)

	const resetForm = () => {
		setUnitId('')
		setApproverUserId('')
		setTargetActivityStatus('')
		setNote('')
		setTrooperIds(new Set())
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
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}
	const toggleAllTroopers = (value: boolean) => {
		if (!value) {
			setTrooperIds(new Set())
			return
		}
		setTrooperIds(new Set(unitStudents.map((trooper) => trooper.id)))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (trooperIds.size === 0) {
			toast.error('Vui lòng chọn ít nhất một quân nhân')
			return
		}

		const body: activity_status_proposals.CreateActivityStatusProposalBody =
			{
				unitId: Number(unitId),
				approverUserId: Number(approverUserId),
				targetActivityStatus:
					targetActivityStatus as activity_status_proposals.CreateActivityStatusProposalBody['targetActivityStatus'],
				note: note.trim() || null,
				troopers: [...trooperIds].map((studentId) => ({ studentId }))
			}

		try {
			await createMutation.mutateAsync(body)
			toast.success('Tạo đề xuất chế độ thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toast.error(getErrorMessage(err, 'Tạo đề xuất chế độ thất bại!'))
		}
	}

	// A count comparison alone would misreport "all selected" if trooperIds
	// ever diverges from the current roster (e.g. the roster changes while
	// the sheet is open) but still happens to match its size — checking
	// actual membership avoids that.
	const isAllTroopersSelected =
		unitStudents.length > 0 &&
		unitStudents.every((trooper) => trooperIds.has(trooper.id))
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
					Tạo đề xuất chế độ
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full overflow-hidden sm:max-w-xl'>
				<SheetHeader>
					<SheetTitle>Đề xuất thay đổi chế độ</SheetTitle>
				</SheetHeader>
				<form
					id='create-activity-status-proposal-form'
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
							<Label>Chế độ đề xuất</Label>
							<Select
								value={targetActivityStatus}
								onValueChange={setTargetActivityStatus}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn chế độ' />
								</SelectTrigger>
								<SelectContent>
									{targetActivityStatusOptions.map((o) => (
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

								{unitStudents.length !== 0 && (
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
								{unitStudents.length !== 0 &&
									unitStudents.map((s) => (
										<Label
											key={s.id}
											className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
											htmlFor={`trooperID-${s.id}`}
										>
											<Checkbox
												id={`trooperID-${s.id}`}
												checked={trooperIds.has(s.id)}
												onCheckedChange={() =>
													toggleTrooper(s.id)
												}
											/>
											<span className='text-sm'>
												{s.fullName}
											</span>
										</Label>
									))}
							</ScrollArea>
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
							!targetActivityStatus
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

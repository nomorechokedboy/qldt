import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateTransferRequest } from '@/hooks/useCreateTransferRequest'
import useMaterialAssetsData from '@/hooks/useMaterialAssetsData'
import useMaterialStocksData from '@/hooks/useMaterialStocksData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useStudentData from '@/hooks/useStudents'
import useTransferDestinationUnits from '@/hooks/useTransferDestinationUnits'
import useTransferEligibleApprovers from '@/hooks/useTransferEligibleApprovers'
import useUnitsData from '@/hooks/useUnitsData'
import { isCompanyOrAboveLevel } from '@/data/unit-levels'
import type { transfer_requests } from '@/api/client'

const NONE = 'none'

export default function CreateTransferRequestForm({
	onSuccess
}: {
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [sourceUnitId, setSourceUnitId] = useState('')
	const [destinationUnitId, setDestinationUnitId] = useState('')
	const [destinationRoomId, setDestinationRoomId] = useState(NONE)
	const [approverUserId, setApproverUserId] = useState('')
	const [trooperIds, setTrooperIds] = useState<Set<number>>(new Set())
	const [assetIds, setAssetIds] = useState<Set<number>>(new Set())
	const [stockQuantities, setStockQuantities] = useState<Map<number, number>>(
		new Map()
	)

	const { data: units } = useUnitsData(undefined, { enabled: open })
	const { data: rooms } = useRoomsData(undefined, { enabled: open })
	const { data: materialTypes } = useMaterialTypesData({ enabled: open })
	const { data: students } = useStudentData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: materialAssets } = useMaterialAssetsData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: materialStocks } = useMaterialStocksData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: destinationUnits } = useTransferDestinationUnits({
		enabled: open
	})
	const { data: eligibleApprovers } = useTransferEligibleApprovers(
		sourceUnitId && destinationUnitId
			? {
					sourceUnitId: Number(sourceUnitId),
					destinationUnitId: Number(destinationUnitId)
				}
			: null,
		{ enabled: open }
	)

	const createMutation = useCreateTransferRequest()

	// A transfer request may move troopers/materials belonging to the
	// selected source unit or any of its subordinate (descendant) units, not
	// only items registered directly on the unit itself (matches the
	// backend's unitAndDescendantIds scope).
	const sourceScopeUnitIds = useMemo(() => {
		if (!sourceUnitId || !units) return new Set<number>()

		const childrenByParentId = new Map<number, number[]>()
		for (const u of units) {
			if (!u.parent) continue
			const list = childrenByParentId.get(u.parent.id) ?? []
			list.push(u.id)
			childrenByParentId.set(u.parent.id, list)
		}

		const rootId = Number(sourceUnitId)
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
	}, [units, sourceUnitId])

	// A student is either attached directly to a unit (unitId, e.g. a
	// company commander) or is a squad member reached only through their
	// class (class.unit.id). Most troopers are the latter, so eligibility
	// must fall back to the class's unit, matching the backend.
	const sourceUnitStudents = useMemo(
		() =>
			(students ?? []).filter((s) => {
				const unitId = s.unitId ?? s.class?.unit?.id
				return unitId !== undefined && sourceScopeUnitIds.has(unitId)
			}),
		[students, sourceScopeUnitIds]
	)

	const sourceUnitAssets = useMemo(
		() =>
			(materialAssets ?? []).filter((a) =>
				sourceScopeUnitIds.has(a.unitId)
			),
		[materialAssets, sourceScopeUnitIds]
	)

	const sourceUnitStocks = useMemo(
		() =>
			(materialStocks ?? []).filter((s) =>
				sourceScopeUnitIds.has(s.unitId)
			),
		[materialStocks, sourceScopeUnitIds]
	)

	const destinationRooms = useMemo(
		() =>
			destinationUnitId
				? (rooms ?? []).filter(
						(r) => r.unitId === Number(destinationUnitId)
					)
				: [],
		[rooms, destinationUnitId]
	)

	// Transfer requests require the source unit to be Company level or
	// larger (matches the backend constraint). Scoped to units the current
	// user can access.
	const eligibleUnits = useMemo(
		() => (units ?? []).filter((u) => isCompanyOrAboveLevel(u.level)),
		[units]
	)

	// Destination unit is not restricted to the requester's own command
	// chain, so it's sourced from the dedicated org-wide endpoint rather
	// than the scoped `units` list above.
	const eligibleDestinationUnits = destinationUnits ?? []

	const materialTypeName = (id: number) =>
		materialTypes?.find((t) => t.id === id)?.name ?? `#${id}`

	const resetForm = () => {
		setSourceUnitId('')
		setDestinationUnitId('')
		setDestinationRoomId(NONE)
		setApproverUserId('')
		setTrooperIds(new Set())
		setAssetIds(new Set())
		setStockQuantities(new Map())
	}

	const toggleSet = (
		set: Set<number>,
		setter: (s: Set<number>) => void,
		id: number
	) => {
		const next = new Set(set)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setter(next)
	}

	const toggleStock = (id: number, maxQuantity: number, checked: boolean) => {
		const next = new Map(stockQuantities)
		if (checked) next.set(id, maxQuantity)
		else next.delete(id)
		setStockQuantities(next)
	}

	const totalSelected = trooperIds.size + assetIds.size + stockQuantities.size

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (totalSelected === 0) {
			toast.error('Vui lòng chọn ít nhất một nguồn lực để chuyển giao')
			return
		}

		const body: transfer_requests.CreateTransferRequestBody = {
			sourceUnitId: Number(sourceUnitId),
			destinationUnitId: Number(destinationUnitId),
			destinationRoomId:
				destinationRoomId === NONE ? null : Number(destinationRoomId),
			approverUserId: Number(approverUserId),
			troopers: [...trooperIds].map((studentId) => ({ studentId })),
			materialAssets: [...assetIds].map((materialAssetId) => ({
				materialAssetId
			})),
			materialStocks: [...stockQuantities].map(([stockId, quantity]) => {
				const stock = sourceUnitStocks.find((s) => s.id === stockId)!
				return {
					materialTypeId: stock.materialTypeId,
					condition: stock.condition ?? 'good',
					quantity
				}
			})
		}

		try {
			await createMutation.mutateAsync(body)
			toast.success('Tạo yêu cầu chuyển giao thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Tạo yêu cầu chuyển giao thất bại!'
			)
		}
	}

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
					Tạo yêu cầu chuyển giao
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
				<SheetHeader>
					<SheetTitle>Yêu cầu chuyển giao nguồn lực</SheetTitle>
				</SheetHeader>
				<form
					id='create-transfer-request-form'
					className='space-y-4 px-4 pb-4'
					onSubmit={handleSubmit}
				>
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label>Đơn vị nguồn</Label>
							<Select
								value={sourceUnitId}
								onValueChange={(v) => {
									setSourceUnitId(v)
									setTrooperIds(new Set())
									setAssetIds(new Set())
									setStockQuantities(new Map())
									setApproverUserId('')
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn đơn vị nguồn' />
								</SelectTrigger>
								<SelectContent>
									{eligibleUnits.map((u) => (
										<SelectItem
											key={u.id}
											value={String(u.id)}
										>
											{u.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label>Đơn vị đích</Label>
							<Select
								value={destinationUnitId}
								onValueChange={(v) => {
									setDestinationUnitId(v)
									setDestinationRoomId(NONE)
									setApproverUserId('')
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn đơn vị đích' />
								</SelectTrigger>
								<SelectContent>
									{eligibleDestinationUnits
										.filter(
											(u) => String(u.id) !== sourceUnitId
										)
										.map((u) => (
											<SelectItem
												key={u.id}
												value={String(u.id)}
											>
												{u.name}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label>Phòng đích (tuỳ chọn)</Label>
							<Select
								value={destinationRoomId}
								onValueChange={setDestinationRoomId}
							>
								<SelectTrigger>
									<SelectValue placeholder='Chọn phòng' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NONE}>
										Không chỉ định
									</SelectItem>
									{destinationRooms.map((r) => (
										<SelectItem
											key={r.id}
											value={String(r.id)}
										>
											{r.name}
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
								disabled={!sourceUnitId || !destinationUnitId}
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
								{!sourceUnitId || !destinationUnitId
									? 'Chọn đơn vị nguồn và đích để xem người có thể phê duyệt'
									: (eligibleApprovers ?? []).length === 0
										? 'Không có người phê duyệt hợp lệ cho hai đơn vị này'
										: 'Chỉ huy/chính trị viên (hoặc cấp phó) của đơn vị cấp trên chung của đơn vị nguồn và đích'}
							</p>
						</div>
					</div>

					{!sourceUnitId ? (
						<p className='py-6 text-center text-sm text-muted-foreground'>
							Chọn đơn vị nguồn để xem nguồn lực có thể chuyển
							giao
						</p>
					) : (
						<Tabs defaultValue='troopers'>
							<TabsList>
								<TabsTrigger value='troopers'>
									Quân nhân{' '}
									{trooperIds.size > 0 && (
										<Badge
											variant='secondary'
											className='ml-1'
										>
											{trooperIds.size}
										</Badge>
									)}
								</TabsTrigger>
								<TabsTrigger value='assets'>
									Khí tài{' '}
									{assetIds.size > 0 && (
										<Badge
											variant='secondary'
											className='ml-1'
										>
											{assetIds.size}
										</Badge>
									)}
								</TabsTrigger>
								<TabsTrigger value='stocks'>
									Vật tư{' '}
									{stockQuantities.size > 0 && (
										<Badge
											variant='secondary'
											className='ml-1'
										>
											{stockQuantities.size}
										</Badge>
									)}
								</TabsTrigger>
							</TabsList>

							<TabsContent value='troopers'>
								<ScrollArea className='h-64 rounded-md border p-2'>
									{sourceUnitStudents.length === 0 && (
										<p className='p-2 text-sm text-muted-foreground'>
											Không có quân nhân nào thuộc đơn vị
											này
										</p>
									)}
									{sourceUnitStudents.map((s) => (
										<label
											key={s.id}
											className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
										>
											<Checkbox
												checked={trooperIds.has(s.id)}
												onCheckedChange={() =>
													toggleSet(
														trooperIds,
														setTrooperIds,
														s.id
													)
												}
											/>
											<span className='text-sm'>
												{s.fullName}
											</span>
										</label>
									))}
								</ScrollArea>
							</TabsContent>

							<TabsContent value='assets'>
								<ScrollArea className='h-64 rounded-md border p-2'>
									{sourceUnitAssets.length === 0 && (
										<p className='p-2 text-sm text-muted-foreground'>
											Không có khí tài nào thuộc đơn vị
											này
										</p>
									)}
									{sourceUnitAssets.map((a) => (
										<label
											key={a.id}
											className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
										>
											<Checkbox
												checked={assetIds.has(a.id)}
												onCheckedChange={() =>
													toggleSet(
														assetIds,
														setAssetIds,
														a.id
													)
												}
											/>
											<span className='text-sm'>
												{materialTypeName(
													a.materialTypeId
												)}{' '}
												— {a.serialNumber}
											</span>
										</label>
									))}
								</ScrollArea>
							</TabsContent>

							<TabsContent value='stocks'>
								<ScrollArea className='h-64 rounded-md border p-2'>
									{sourceUnitStocks.length === 0 && (
										<p className='p-2 text-sm text-muted-foreground'>
											Không có tồn kho vật tư nào thuộc
											đơn vị này
										</p>
									)}
									{sourceUnitStocks.map((s) => (
										<div
											key={s.id}
											className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
										>
											<Checkbox
												checked={stockQuantities.has(
													s.id
												)}
												onCheckedChange={(checked) =>
													toggleStock(
														s.id,
														s.quantity,
														checked === true
													)
												}
											/>
											<span className='flex-1 text-sm'>
												{materialTypeName(
													s.materialTypeId
												)}{' '}
												({s.condition}) — còn{' '}
												{s.quantity}
											</span>
											{stockQuantities.has(s.id) && (
												<Input
													type='number'
													min={1}
													max={s.quantity}
													value={
														stockQuantities.get(
															s.id
														) ?? 1
													}
													onChange={(e) => {
														const next = new Map(
															stockQuantities
														)
														const val = Math.min(
															Math.max(
																1,
																Number(
																	e.target
																		.value
																)
															),
															s.quantity
														)
														next.set(s.id, val)
														setStockQuantities(next)
													}}
													className='h-8 w-20'
												/>
											)}
										</div>
									))}
								</ScrollArea>
							</TabsContent>
						</Tabs>
					)}
				</form>
				<SheetFooter>
					<Button
						type='submit'
						form='create-transfer-request-form'
						disabled={
							createMutation.isPending ||
							!sourceUnitId ||
							!destinationUnitId ||
							!approverUserId
						}
					>
						{createMutation.isPending
							? 'Đang tạo...'
							: 'Tạo yêu cầu'}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

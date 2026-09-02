import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogHeader,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useAddMaterialStock } from '@/hooks/useAddMaterialStock'
import { materialConditionOptions } from '@/data/material-categories'
import type { MaterialType, Room, Unit } from '@/types'
import { getErrorMessage } from '@/lib/utils'

const NONE = 'none'

export interface MaterialStockFormProps {
	unitOptions: Unit[]
	defaultUnitId?: number
	roomOptions: Room[]
	materialTypeOptions: MaterialType[]
	onSuccess?: () => void
}

export default function MaterialStockForm({
	unitOptions,
	defaultUnitId,
	roomOptions,
	materialTypeOptions,
	onSuccess
}: MaterialStockFormProps) {
	const [open, setOpen] = useState(false)
	const [materialTypeId, setMaterialTypeId] = useState('')
	const [unitId, setUnitId] = useState<string>(
		defaultUnitId !== undefined ? String(defaultUnitId) : ''
	)
	const [roomId, setRoomId] = useState<string>(NONE)
	const [quantity, setQuantity] = useState('1')
	const [condition, setCondition] = useState('good')

	const createMutation = useAddMaterialStock()

	const resetForm = () => {
		setMaterialTypeId('')
		setUnitId(defaultUnitId !== undefined ? String(defaultUnitId) : '')
		setRoomId(NONE)
		setQuantity('1')
		setCondition('good')
	}

	const roomsForUnit = roomOptions.filter((r) => String(r.unitId) === unitId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				materialTypeId: Number(materialTypeId),
				unitId: Number(unitId),
				roomId: roomId === NONE ? undefined : Number(roomId),
				quantity: Number(quantity),
				condition
			})
			toast.success('Thêm vật tư thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error adding material stock:', err)
			toast.error(getErrorMessage(err, 'Thêm vật tư thất bại!'))
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus className='w-4 h-4 mr-2' />
					Thêm vật tư
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm vật tư</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='stock-material-type'>Loại vật tư</Label>
						<Select
							value={materialTypeId}
							onValueChange={setMaterialTypeId}
						>
							<SelectTrigger id='stock-material-type'>
								<SelectValue placeholder='Chọn loại vật tư' />
							</SelectTrigger>
							<SelectContent>
								{materialTypeOptions.map((t) => (
									<SelectItem key={t.id} value={String(t.id)}>
										{t.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-unit'>Thuộc đơn vị</Label>
						<Select
							value={unitId}
							onValueChange={(value) => {
								setUnitId(value)
								setRoomId(NONE)
							}}
						>
							<SelectTrigger id='stock-unit'>
								<SelectValue placeholder='Chọn đơn vị' />
							</SelectTrigger>
							<SelectContent>
								{unitOptions.map((u) => (
									<SelectItem key={u.id} value={String(u.id)}>
										{u.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-room'>Phòng</Label>
						<Select value={roomId} onValueChange={setRoomId}>
							<SelectTrigger id='stock-room'>
								<SelectValue placeholder='Chọn phòng (tuỳ chọn)' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE}>
									Không thuộc phòng cụ thể
								</SelectItem>
								{roomsForUnit.map((r) => (
									<SelectItem key={r.id} value={String(r.id)}>
										{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-quantity'>Số lượng</Label>
						<Input
							id='stock-quantity'
							type='number'
							min={1}
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-condition'>Tình trạng</Label>
						<Select value={condition} onValueChange={setCondition}>
							<SelectTrigger id='stock-condition'>
								<SelectValue placeholder='Chọn tình trạng' />
							</SelectTrigger>
							<SelectContent>
								{materialConditionOptions.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={
								createMutation.isPending ||
								!materialTypeId ||
								!unitId
							}
						>
							{createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
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
import { useUpdateMaterialStock } from '@/hooks/useUpdateMaterialStock'
import { materialConditionOptions } from '@/data/material-categories'
import type { MaterialStock, Room } from '@/types'

const NONE = 'none'

interface MaterialStockEditFormProps {
	data: MaterialStock
	roomOptions: Room[]
	onUpdate: () => void
	onClose: () => void
}

export default function MaterialStockEditForm({
	data,
	roomOptions,
	onUpdate,
	onClose
}: MaterialStockEditFormProps) {
	const [quantity, setQuantity] = useState(String(data.quantity))
	const [condition, setCondition] = useState(data.condition ?? 'good')
	const [roomId, setRoomId] = useState<string>(
		data.roomId !== undefined && data.roomId !== null
			? String(data.roomId)
			: NONE
	)

	const updateMutation = useUpdateMaterialStock()

	const roomsForUnit = roomOptions.filter((r) => r.unitId === data.unitId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync([
				{
					id: data.id,
					quantity: Number(quantity),
					condition,
					roomId: roomId === NONE ? null : Number(roomId)
				}
			])
			toast.success('Cập nhật vật tư thành công')
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating material stock:', err)
			toast.error('Cập nhật vật tư thất bại!')
		}
	}

	return (
		<div className='rounded-2xl shadow-xl w-full max-w-md p-6 relative'>
			<Button
				type='button'
				onClick={onClose}
				variant='ghost'
				size='icon'
				className='absolute top-3 right-3'
			>
				<X className='h-4 w-4' />
			</Button>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div className='space-y-1'>
					<Label>Loại vật tư</Label>
					<p className='text-sm text-muted-foreground'>
						{data.materialType?.name}
					</p>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-stock-quantity'>Số lượng</Label>
					<Input
						id='edit-stock-quantity'
						type='number'
						min={0}
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-stock-room'>Phòng</Label>
					<Select value={roomId} onValueChange={setRoomId}>
						<SelectTrigger id='edit-stock-room'>
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
					<Label htmlFor='edit-stock-condition'>Tình trạng</Label>
					<Select value={condition} onValueChange={setCondition}>
						<SelectTrigger id='edit-stock-condition'>
							<SelectValue placeholder='Chọn tình trạng' />
						</SelectTrigger>
						<SelectContent>
							{materialConditionOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='flex justify-end gap-2'>
					<Button type='button' variant='outline' onClick={onClose}>
						Hủy
					</Button>
					<Button type='submit' disabled={updateMutation.isPending}>
						{updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
					</Button>
				</div>
			</form>
		</div>
	)
}

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useUpdateMaterialAsset } from '@/hooks/useUpdateMaterialAsset'
import {
	materialAssetStatusOptions,
	materialConditionOptions
} from '@/data/material-categories'
import type { MaterialAsset, MaterialAssetStatus, Student } from '@/types'

const NONE = 'none'

interface MaterialAssetEditFormProps {
	data: MaterialAsset
	studentOptions: Student[]
	onUpdate: () => void
	onClose: () => void
}

export default function MaterialAssetEditForm({
	data,
	studentOptions,
	onUpdate,
	onClose
}: MaterialAssetEditFormProps) {
	const [status, setStatus] = useState<MaterialAssetStatus>(
		data.status ?? 'in_service'
	)
	const [condition, setCondition] = useState(data.condition ?? '')
	const [assignedTrooperId, setAssignedTrooperId] = useState<string>(
		data.assignedTrooperId !== undefined && data.assignedTrooperId !== null
			? String(data.assignedTrooperId)
			: NONE
	)
	const [note, setNote] = useState('')

	const updateMutation = useUpdateMaterialAsset()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync([
				{
					id: data.id,
					status,
					condition: condition || undefined,
					assignedTrooperId:
						assignedTrooperId === NONE
							? null
							: Number(assignedTrooperId),
					note: note || undefined
				}
			])
			toast.success('Cập nhật khí tài thành công')
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating material asset:', err)
			toast.error('Cập nhật khí tài thất bại!')
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
					<Label>Số sê-ri</Label>
					<p className='text-sm text-muted-foreground'>
						{data.serialNumber}
					</p>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-status'>Trạng thái</Label>
					<Select
						value={status}
						onValueChange={(value) =>
							setStatus(value as MaterialAssetStatus)
						}
					>
						<SelectTrigger id='edit-asset-status'>
							<SelectValue placeholder='Chọn trạng thái' />
						</SelectTrigger>
						<SelectContent>
							{materialAssetStatusOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-condition'>Tình trạng</Label>
					<Select value={condition} onValueChange={setCondition}>
						<SelectTrigger id='edit-asset-condition'>
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

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-trooper'>
						Cấp phát cho quân nhân
					</Label>
					<Select
						value={assignedTrooperId}
						onValueChange={setAssignedTrooperId}
					>
						<SelectTrigger id='edit-asset-trooper'>
							<SelectValue placeholder='Chọn quân nhân' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NONE}>Chưa cấp phát</SelectItem>
							{studentOptions.map((s) => (
								<SelectItem key={s.id} value={String(s.id)}>
									{s.fullName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-note'>Ghi chú thay đổi</Label>
					<Textarea
						id='edit-asset-note'
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder='Lý do thay đổi (tuỳ chọn)'
					/>
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

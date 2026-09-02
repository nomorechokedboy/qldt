import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateRoom } from '@/hooks/useUpdateRoom'
import type { Room } from '@/types'
import { getErrorMessage } from '@/lib/utils'

interface RoomEditFormProps {
	data: Room
	onUpdate: () => void
	onClose: () => void
}

export default function RoomEditForm({
	data,
	onUpdate,
	onClose
}: RoomEditFormProps) {
	const [name, setName] = useState(data.name)
	const [type, setType] = useState(data.type ?? '')
	const [description, setDescription] = useState(data.description ?? '')

	const updateMutation = useUpdateRoom()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync({
				data: [
					{
						id: data.id,
						name,
						type: type || undefined,
						description: description || undefined
					}
				]
			})
			toast.success('Cập nhật phòng thành công')
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating room:', err)
			toast.error(getErrorMessage(err, 'Cập nhật phòng thất bại!'))
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
				<div className='space-y-2'>
					<Label htmlFor='edit-room-name'>Tên phòng</Label>
					<Input
						id='edit-room-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-room-type'>Loại phòng</Label>
					<Input
						id='edit-room-type'
						value={type}
						onChange={(e) => setType(e.target.value)}
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-room-description'>Mô tả</Label>
					<Input
						id='edit-room-description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
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

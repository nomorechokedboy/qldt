import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdatePosition } from '@/hooks/useUpdatePosition'
import type { Position } from '@/types'
import { getErrorMessage } from '@/lib/utils'

interface PositionEditFormProps {
	data: Position
	onUpdate: () => void
	onClose: () => void
}

export default function PositionEditForm({
	data,
	onUpdate,
	onClose
}: PositionEditFormProps) {
	const [code, setCode] = useState(data.code)
	const [name, setName] = useState(data.name)
	const [priority, setPriority] = useState(String(data.priority))

	const updateMutation = useUpdatePosition()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync({
				data: [
					{
						id: data.id,
						code,
						name,
						priority: Number(priority)
					}
				]
			})
			toast.success('Cập nhật chức vụ thành công')
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating position:', err)
			toast.error(getErrorMessage(err, 'Cập nhật chức vụ thất bại!'))
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
					<Label htmlFor='edit-position-code'>Mã chức vụ</Label>
					<Input
						id='edit-position-code'
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-position-name'>Tên chức vụ</Label>
					<Input
						id='edit-position-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-position-priority'>
						Thứ tự ưu tiên (số càng nhỏ càng ưu tiên trước)
					</Label>
					<Input
						id='edit-position-priority'
						type='number'
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
						required
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

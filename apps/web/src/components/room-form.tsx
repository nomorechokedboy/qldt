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
import { useCreateRoom } from '@/hooks/useCreateRoom'

export interface RoomFormProps {
	unitId: number
	buildingId: number
	onSuccess?: () => void
}

export default function RoomForm({
	unitId,
	buildingId,
	onSuccess
}: RoomFormProps) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [type, setType] = useState('')
	const [description, setDescription] = useState('')

	const createMutation = useCreateRoom()

	const resetForm = () => {
		setName('')
		setType('')
		setDescription('')
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				unitId,
				buildingId,
				name,
				type: type || undefined,
				description: description || undefined
			})
			toast.success('Thêm mới phòng thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating room:', err)
			toast.error('Thêm mới phòng thất bại!')
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
				<Button size='sm' variant='outline'>
					<Plus className='w-4 h-4 mr-2' />
					Thêm phòng
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm phòng</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='room-name'>Tên phòng</Label>
						<Input
							id='room-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='vd: Phòng trung đội trưởng'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='room-type'>Loại phòng</Label>
						<Input
							id='room-type'
							value={type}
							onChange={(e) => setType(e.target.value)}
							placeholder='vd: phòng ở, kho, phòng chỉ huy'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='room-description'>Mô tả</Label>
						<Input
							id='room-description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

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
import { useCreatePosition } from '@/hooks/useCreatePosition'
import { getErrorMessage } from '@/lib/utils'

export interface PositionFormProps {
	level: string
	onSuccess?: () => void
}

export default function PositionForm({ level, onSuccess }: PositionFormProps) {
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')
	const [name, setName] = useState('')
	const [priority, setPriority] = useState('')

	const createMutation = useCreatePosition()

	const resetForm = () => {
		setCode('')
		setName('')
		setPriority('')
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				level,
				code,
				name,
				priority: Number(priority)
			})
			toast.success('Thêm mới chức vụ thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating position:', err)
			toast.error(getErrorMessage(err, 'Thêm mới chức vụ thất bại!'))
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
					Thêm chức vụ
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm chức vụ</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='position-code'>Mã chức vụ</Label>
						<Input
							id='position-code'
							value={code}
							onChange={(e) => setCode(e.target.value)}
							placeholder='vd: tlts, nvqk, y tá'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='position-name'>Tên chức vụ</Label>
						<Input
							id='position-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='vd: Trợ lý tác chiến'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='position-priority'>
							Thứ tự ưu tiên (số càng nhỏ càng ưu tiên trước)
						</Label>
						<Input
							id='position-priority'
							type='number'
							value={priority}
							onChange={(e) => setPriority(e.target.value)}
							required
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

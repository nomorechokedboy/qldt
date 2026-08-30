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
import { useCreateUnit } from '@/hooks/useCreateUnit'

export interface PlatoonFormProps {
	companyId: number
	onSuccess?: () => void
}

export default function PlatoonForm({
	companyId,
	onSuccess
}: PlatoonFormProps) {
	const [open, setOpen] = useState(false)
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')

	const createUnitMutation = useCreateUnit()

	const resetForm = () => {
		setAlias('')
		setName('')
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createUnitMutation.mutateAsync({
				alias,
				name,
				level: 'platoon',
				parentId: companyId
			})
			toast.success('Thêm mới trung đội thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating platoon:', err)
			toast.error('Thêm mới trung đội thất bại!')
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
					Thêm trung đội
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm trung đội</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='platoon-name'>Tên trung đội</Label>
						<Input
							id='platoon-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='platoon-alias'>
							Mã định danh (alias)
						</Label>
						<Input
							id='platoon-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder='vd: b1, b2'
							required
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createUnitMutation.isPending}
						>
							{createUnitMutation.isPending
								? 'Đang thêm...'
								: 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

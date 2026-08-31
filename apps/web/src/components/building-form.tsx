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
import { useCreateBuilding } from '@/hooks/useCreateBuilding'
import type { Unit } from '@/types'

export interface BuildingFormProps {
	unitOptions: Unit[]
	defaultUnitId?: number
	onSuccess?: () => void
}

export default function BuildingForm({
	unitOptions,
	defaultUnitId,
	onSuccess
}: BuildingFormProps) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [unitId, setUnitId] = useState<string>(
		defaultUnitId !== undefined ? String(defaultUnitId) : ''
	)

	const createMutation = useCreateBuilding()

	const resetForm = () => {
		setName('')
		setDescription('')
		setUnitId(defaultUnitId !== undefined ? String(defaultUnitId) : '')
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				unitId: Number(unitId),
				name,
				description: description || undefined
			})
			toast.success('Thêm mới nhà/khu nhà thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating building:', err)
			toast.error('Thêm mới nhà/khu nhà thất bại!')
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
					Thêm nhà/khu nhà
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm nhà/khu nhà</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='building-name'>Tên nhà/khu nhà</Label>
						<Input
							id='building-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='vd: Nhà đại đội 1'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='building-unit'>Thuộc đơn vị</Label>
						<Select value={unitId} onValueChange={setUnitId}>
							<SelectTrigger id='building-unit'>
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
						<Label htmlFor='building-description'>Mô tả</Label>
						<Input
							id='building-description'
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
							disabled={createMutation.isPending || !unitId}
						>
							{createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

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
import { Checkbox } from '@/components/ui/checkbox'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useCreateMaterialType } from '@/hooks/useCreateMaterialType'
import { materialCategoryOptions } from '@/data/material-categories'
import type { materials } from '@/api/client'
import { getErrorMessage } from '@/lib/utils'

export interface MaterialTypeFormProps {
	onSuccess?: () => void
}

export default function MaterialTypeForm({ onSuccess }: MaterialTypeFormProps) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [category, setCategory] =
		useState<materials.MaterialTypeBody['category']>('furniture')
	const [unitOfMeasure, setUnitOfMeasure] = useState('')
	const [isSerialized, setIsSerialized] = useState(false)

	const createMutation = useCreateMaterialType()

	const resetForm = () => {
		setName('')
		setCategory('furniture')
		setUnitOfMeasure('')
		setIsSerialized(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				name,
				category,
				unitOfMeasure: unitOfMeasure || undefined,
				isSerialized
			})
			toast.success('Thêm mới danh mục vật tư thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating material type:', err)
			toast.error(
				getErrorMessage(err, 'Thêm mới danh mục vật tư thất bại!')
			)
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
					Thêm danh mục
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm danh mục vật tư</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='material-type-name'>Tên vật tư</Label>
						<Input
							id='material-type-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='vd: Súng AK, Ghế, Giường'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='material-type-category'>
							Phân loại
						</Label>
						<Select
							value={category}
							onValueChange={(value) =>
								setCategory(
									value as materials.MaterialTypeBody['category']
								)
							}
						>
							<SelectTrigger id='material-type-category'>
								<SelectValue placeholder='Chọn phân loại' />
							</SelectTrigger>
							<SelectContent>
								{materialCategoryOptions.map((opt) => (
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

					<div className='space-y-2'>
						<Label htmlFor='material-type-uom'>Đơn vị tính</Label>
						<Input
							id='material-type-uom'
							value={unitOfMeasure}
							onChange={(e) => setUnitOfMeasure(e.target.value)}
							placeholder='vd: cái, chiếc, bộ'
						/>
					</div>

					<div className='flex items-center gap-2'>
						<Checkbox
							id='material-type-serialized'
							checked={isSerialized}
							onCheckedChange={(value) =>
								setIsSerialized(!!value)
							}
						/>
						<Label htmlFor='material-type-serialized'>
							Quản lý theo số sê-ri riêng lẻ (vũ khí, xe, ...)
						</Label>
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

import { MaterialImagesUpload } from '@/components/material-images-upload'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { materialCategoryOptions } from '@/data/material-categories'
import { useUpdateMaterialType } from '@/hooks/useUpdateMaterialType'
import { MAX_MATERIAL_TYPE_NAME_LENGTH } from '@/lib/material-limits'
import { getErrorMessage } from '@/lib/utils'
import type { MaterialType } from '@/types'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface MaterialTypeEditFormProps {
	data: MaterialType
	onUpdate: () => void
	onClose: () => void
}

export default function MaterialTypeEditForm({
	data,
	onUpdate,
	onClose
}: MaterialTypeEditFormProps) {
	const [name, setName] = useState(data.name)
	const [category, setCategory] = useState(data.category)
	const [unitOfMeasure, setUnitOfMeasure] = useState(data.unitOfMeasure ?? '')
	const [isSerialized, setIsSerialized] = useState(data.isSerialized)
	const [images, setImages] = useState<string[]>(data.images ?? [])

	const updateMutation = useUpdateMaterialType()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync({
				data: [
					{
						id: data.id,
						name,
						category,
						unitOfMeasure: unitOfMeasure || undefined,
						isSerialized,
						images
					}
				]
			})
			toast.success('Cập nhật danh mục vật tư thành công')
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating material type:', err)
			toast.error(
				getErrorMessage(err, 'Cập nhật danh mục vật tư thất bại!')
			)
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
					<Label htmlFor='edit-material-type-name'>Tên vật tư</Label>
					<Input
						id='edit-material-type-name'
						maxLength={MAX_MATERIAL_TYPE_NAME_LENGTH}
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-material-type-category'>
						Phân loại
					</Label>
					<Select
						value={category}
						onValueChange={(value) =>
							setCategory(value as MaterialType['category'])
						}
					>
						<SelectTrigger id='edit-material-type-category'>
							<SelectValue placeholder='Chọn phân loại' />
						</SelectTrigger>
						<SelectContent>
							{materialCategoryOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-material-type-uom'>Đơn vị tính</Label>
					<Input
						id='edit-material-type-uom'
						value={unitOfMeasure}
						onChange={(e) => setUnitOfMeasure(e.target.value)}
					/>
				</div>

				<div className='flex items-center gap-2'>
					<Checkbox
						id='edit-material-type-serialized'
						checked={isSerialized}
						onCheckedChange={(value) => setIsSerialized(!!value)}
					/>
					<Label htmlFor='edit-material-type-serialized'>
						Quản lý theo số sê-ri riêng lẻ
					</Label>
				</div>

				<div className='space-y-2'>
					<Label>Hình ảnh</Label>
					<MaterialImagesUpload value={images} onChange={setImages} />
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

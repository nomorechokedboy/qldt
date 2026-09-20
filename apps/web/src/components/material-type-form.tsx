import type { materials } from '@/api/client'
import { MaterialImagesUpload } from '@/components/material-images-upload'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MAX_MATERIAL_TYPE_NAME_LENGTH } from '@/lib/material-limits'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { materialCategoryOptions } from '@/data/material-categories'
import { useCreateMaterialType } from '@/hooks/useCreateMaterialType'
import { getErrorMessage } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export interface MaterialTypeFormProps {
	onSuccess?: () => void
}

export default function MaterialTypeForm({ onSuccess }: MaterialTypeFormProps) {
	const { t } = useTranslation('materials')
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [category, setCategory] =
		useState<materials.MaterialTypeBody['category']>('furniture')
	const [unitOfMeasure, setUnitOfMeasure] = useState('')
	const [isSerialized, setIsSerialized] = useState(false)
	const [images, setImages] = useState<string[]>([])

	const createMutation = useCreateMaterialType()

	const resetForm = () => {
		setName('')
		setCategory('furniture')
		setUnitOfMeasure('')
		setIsSerialized(false)
		setImages([])
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				name,
				category,
				unitOfMeasure: unitOfMeasure || undefined,
				isSerialized,
				images
			})
			toast.success(t('typeForm.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating material type:', err)
			toast.error(getErrorMessage(err, t('typeForm.createFailed')))
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
					{t('typeForm.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('typeForm.title')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='material-type-name'>
							{t('columns.name')}
						</Label>
						<Input
							id='material-type-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={MAX_MATERIAL_TYPE_NAME_LENGTH}
							placeholder={t('typeForm.namePlaceholder')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='material-type-category'>
							{t('columns.category')}
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
								<SelectValue
									placeholder={t('typeForm.pickCategory')}
								/>
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
						<Label htmlFor='material-type-uom'>
							{t('columns.unitOfMeasure')}
						</Label>
						<Input
							id='material-type-uom'
							value={unitOfMeasure}
							onChange={(e) => setUnitOfMeasure(e.target.value)}
							placeholder={t('typeForm.uomPlaceholder')}
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
							{t('typeForm.serialized')}
						</Label>
					</div>

					<div className='space-y-2'>
						<Label>{t('columns.images')}</Label>
						<MaterialImagesUpload
							value={images}
							onChange={setImages}
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('form.cancel')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createMutation.isPending}
						>
							{createMutation.isPending
								? t('form.adding')
								: t('form.add')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

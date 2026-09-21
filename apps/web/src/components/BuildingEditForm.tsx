import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateBuilding } from '@/hooks/useUpdateBuilding'
import type { Building } from '@/types'
import { toastApiError } from '@/lib/api-error'

interface BuildingEditFormProps {
	data: Building
	onUpdate: () => void
	onClose: () => void
}

export default function BuildingEditForm({
	data,
	onUpdate,
	onClose
}: BuildingEditFormProps) {
	const { t } = useTranslation('units')
	const [name, setName] = useState(data.name)
	const [description, setDescription] = useState(data.description ?? '')

	const updateMutation = useUpdateBuilding()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync({
				data: [
					{ id: data.id, name, description: description || undefined }
				]
			})
			toast.success(t('facilities.building.updated'))
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating building:', err)
			toastApiError(t('facilities.building.updateFailed'), err)
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
					<Label htmlFor='edit-building-name'>
						{t('facilities.building.name')}
					</Label>
					<Input
						id='edit-building-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-building-description'>
						{t('facilities.common.description')}
					</Label>
					<Input
						id='edit-building-description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>

				<div className='flex justify-end gap-2'>
					<Button type='button' variant='outline' onClick={onClose}>
						{t('facilities.common.cancel')}
					</Button>
					<Button type='submit' disabled={updateMutation.isPending}>
						{updateMutation.isPending
							? t('facilities.common.saving')
							: t('facilities.common.save')}
					</Button>
				</div>
			</form>
		</div>
	)
}

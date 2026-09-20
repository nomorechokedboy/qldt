import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUpdatePosition } from '@/hooks/useUpdatePosition'
import type { Position } from '@/types'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('admin')
	const [code, setCode] = useState(data.code)
	const [name, setName] = useState(data.name)
	const [priority, setPriority] = useState(String(data.priority))
	const [isHsq, setIsHsq] = useState(data.group === 'HSQ')

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
						priority: Number(priority),
						group: isHsq ? 'HSQ' : null
					}
				]
			})
			toast.success(t('positions.update.success'))
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating position:', err)
			toast.error(getErrorMessage(err, t('positions.update.failed')))
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
					<Label htmlFor='edit-position-code'>
						{t('positions.fields.code')}
					</Label>
					<Input
						id='edit-position-code'
						value={code}
						onChange={(e) => setCode(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-position-name'>
						{t('positions.fields.name')}
					</Label>
					<Input
						id='edit-position-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-position-priority'>
						{t('positions.fields.priority')}
					</Label>
					<Input
						id='edit-position-priority'
						type='number'
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
						required
					/>
				</div>

				<div className='flex items-center gap-2'>
					<Checkbox
						id='edit-position-hsq'
						checked={isHsq}
						onCheckedChange={(value) => setIsHsq(!!value)}
					/>
					<Label htmlFor='edit-position-hsq'>
						{t('positions.fields.hsq')}
					</Label>
				</div>

				<div className='flex justify-end gap-2'>
					<Button type='button' variant='outline' onClick={onClose}>
						{t('common.cancel')}
					</Button>
					<Button type='submit' disabled={updateMutation.isPending}>
						{updateMutation.isPending
							? t('common.saving')
							: t('common.saveShort')}
					</Button>
				</div>
			</form>
		</div>
	)
}

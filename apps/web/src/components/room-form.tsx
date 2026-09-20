import { useTranslation } from 'react-i18next'
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
import { getErrorMessage } from '@/lib/utils'

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
	const { t } = useTranslation('units')
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
			toast.success(t('facilities.room.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating room:', err)
			toast.error(getErrorMessage(err, t('facilities.room.createFailed')))
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
					{t('facilities.room.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('facilities.room.formTitle')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='room-name'>
							{t('facilities.room.name')}
						</Label>
						<Input
							id='room-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('facilities.room.namePlaceholder')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='room-type'>
							{t('facilities.room.type')}
						</Label>
						<Input
							id='room-type'
							value={type}
							onChange={(e) => setType(e.target.value)}
							placeholder={t('facilities.room.typePlaceholder')}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='room-description'>
							{t('facilities.common.description')}
						</Label>
						<Input
							id='room-description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('facilities.common.cancel')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createMutation.isPending}
						>
							{createMutation.isPending
								? t('facilities.common.adding')
								: t('facilities.common.add')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

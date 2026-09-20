import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { getErrorMessage } from '@/lib/utils'

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
	const { t } = useTranslation('units')
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
			toast.success(t('facilities.building.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating building:', err)
			toast.error(
				getErrorMessage(err, t('facilities.building.createFailed'))
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
					{t('facilities.building.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>
						{t('facilities.building.formTitle')}
					</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='building-name'>
							{t('facilities.building.name')}
						</Label>
						<Input
							id='building-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t(
								'facilities.building.namePlaceholder'
							)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='building-unit'>
							{t('facilities.building.unit')}
						</Label>
						<Select value={unitId} onValueChange={setUnitId}>
							<SelectTrigger id='building-unit'>
								<SelectValue
									placeholder={t(
										'facilities.building.pickUnit'
									)}
								/>
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
						<Label htmlFor='building-description'>
							{t('facilities.common.description')}
						</Label>
						<Input
							id='building-description'
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
							disabled={createMutation.isPending || !unitId}
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

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
import { useAddMaterialStock } from '@/hooks/useAddMaterialStock'
import { materialConditionOptions } from '@/data/material-categories'
import type { MaterialType, Room, Unit } from '@/types'
import { useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

const NONE = 'none'

export interface MaterialStockFormProps {
	unitOptions: Unit[]
	defaultUnitId?: number
	roomOptions: Room[]
	materialTypeOptions: MaterialType[]
	onSuccess?: () => void
}

export default function MaterialStockForm({
	unitOptions,
	defaultUnitId,
	roomOptions,
	materialTypeOptions,
	onSuccess
}: MaterialStockFormProps) {
	const { t } = useTranslation('materials')
	const [open, setOpen] = useState(false)
	const [materialTypeId, setMaterialTypeId] = useState('')
	const [unitId, setUnitId] = useState<string>(
		defaultUnitId !== undefined ? String(defaultUnitId) : ''
	)
	const [roomId, setRoomId] = useState<string>(NONE)
	const [quantity, setQuantity] = useState('1')
	const [condition, setCondition] = useState('good')

	const createMutation = useAddMaterialStock()

	const resetForm = () => {
		setMaterialTypeId('')
		setUnitId(defaultUnitId !== undefined ? String(defaultUnitId) : '')
		setRoomId(NONE)
		setQuantity('1')
		setCondition('good')
	}

	const roomsForUnit = roomOptions.filter((r) => String(r.unitId) === unitId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				materialTypeId: Number(materialTypeId),
				unitId: Number(unitId),
				roomId: roomId === NONE ? undefined : Number(roomId),
				quantity: Number(quantity),
				condition
			})
			toast.success(t('stockForm.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error adding material stock:', err)
			toastApiError(t('stockForm.createFailed'), err)
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
					{t('stockForm.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('stockForm.title')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='stock-material-type'>
							{t('columns.stockType')}
						</Label>
						<Select
							value={materialTypeId}
							onValueChange={setMaterialTypeId}
						>
							<SelectTrigger id='stock-material-type'>
								<SelectValue
									placeholder={t('stockForm.pickType')}
								/>
							</SelectTrigger>
							<SelectContent>
								{materialTypeOptions.map((t) => (
									<SelectItem key={t.id} value={String(t.id)}>
										{t.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-unit'>{t('form.unit')}</Label>
						<Select
							value={unitId}
							onValueChange={(value) => {
								setUnitId(value)
								setRoomId(NONE)
							}}
						>
							<SelectTrigger id='stock-unit'>
								<SelectValue placeholder={t('form.pickUnit')} />
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
						<Label htmlFor='stock-room'>{t('columns.room')}</Label>
						<Select value={roomId} onValueChange={setRoomId}>
							<SelectTrigger id='stock-room'>
								<SelectValue
									placeholder={t('form.pickRoomOptional')}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE}>
									{t('shared.noSpecificRoom')}
								</SelectItem>
								{roomsForUnit.map((r) => (
									<SelectItem key={r.id} value={String(r.id)}>
										{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-quantity'>
							{t('columns.quantity')}
						</Label>
						<Input
							id='stock-quantity'
							type='number'
							min={1}
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='stock-condition'>
							{t('columns.condition')}
						</Label>
						<Select value={condition} onValueChange={setCondition}>
							<SelectTrigger id='stock-condition'>
								<SelectValue
									placeholder={t('form.pickCondition')}
								/>
							</SelectTrigger>
							<SelectContent>
								{materialConditionOptions.map((opt) => (
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

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('form.cancel')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={
								createMutation.isPending ||
								!materialTypeId ||
								!unitId
							}
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

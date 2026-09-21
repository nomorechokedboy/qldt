import { MaterialImagesUpload } from '@/components/material-images-upload'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useCreateMaterialAsset } from '@/hooks/useCreateMaterialAsset'
import { MAX_MATERIAL_ASSET_SERIAL_LENGTH } from '@/lib/material-limits'
import type { MaterialType, Room, Student, Unit } from '@/types'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

const NONE = 'none'

export interface MaterialAssetFormProps {
	unitOptions: Unit[]
	defaultUnitId?: number
	roomOptions: Room[]
	materialTypeOptions: MaterialType[]
	studentOptions: Student[]
	onSuccess?: () => void
}

export default function MaterialAssetForm({
	unitOptions,
	defaultUnitId,
	roomOptions,
	materialTypeOptions,
	studentOptions,
	onSuccess
}: MaterialAssetFormProps) {
	const { t } = useTranslation('materials')
	const [open, setOpen] = useState(false)
	const [materialTypeId, setMaterialTypeId] = useState('')
	const [unitId, setUnitId] = useState<string>(
		defaultUnitId !== undefined ? String(defaultUnitId) : ''
	)
	const [roomId, setRoomId] = useState<string>(NONE)
	const [serialNumber, setSerialNumber] = useState('')
	const [assignedTrooperId, setAssignedTrooperId] = useState<string>(NONE)
	const [images, setImages] = useState<string[]>([])

	const createMutation = useCreateMaterialAsset()

	const resetForm = () => {
		setMaterialTypeId('')
		setUnitId(defaultUnitId !== undefined ? String(defaultUnitId) : '')
		setRoomId(NONE)
		setSerialNumber('')
		setAssignedTrooperId(NONE)
		setImages([])
	}

	const roomsForUnit = roomOptions.filter((r) => String(r.unitId) === unitId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				materialTypeId: Number(materialTypeId),
				unitId: Number(unitId),
				roomId: roomId === NONE ? undefined : Number(roomId),
				serialNumber,
				assignedTrooperId:
					assignedTrooperId === NONE
						? undefined
						: Number(assignedTrooperId),
				images
			})
			toast.success(t('assetForm.created'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating material asset:', err)
			toastApiError(t('assetForm.createFailed'), err)
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
					{t('assetForm.trigger')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('assetForm.title')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='asset-material-type'>
							{t('columns.assetType')}
						</Label>
						<Select
							value={materialTypeId}
							onValueChange={setMaterialTypeId}
						>
							<SelectTrigger id='asset-material-type'>
								<SelectValue
									placeholder={t('assetForm.pickType')}
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
						<Label htmlFor='asset-serial'>
							{t('columns.serialNumber')}
						</Label>
						<Input
							id='asset-serial'
							maxLength={MAX_MATERIAL_ASSET_SERIAL_LENGTH}
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='asset-unit'>{t('form.unit')}</Label>
						<Select
							value={unitId}
							onValueChange={(value) => {
								setUnitId(value)
								setRoomId(NONE)
							}}
						>
							<SelectTrigger id='asset-unit'>
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
						<Label htmlFor='asset-room'>{t('columns.room')}</Label>
						<Select value={roomId} onValueChange={setRoomId}>
							<SelectTrigger id='asset-room'>
								<SelectValue
									placeholder={t('assetForm.pickRoom')}
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
						<Label htmlFor='asset-trooper'>
							{t('assetForm.assignTrooper')}
						</Label>
						<Select
							value={assignedTrooperId}
							onValueChange={setAssignedTrooperId}
						>
							<SelectTrigger id='asset-trooper'>
								<SelectValue
									placeholder={t(
										'assetForm.pickTrooperOptional'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE}>
									{t('shared.notAssigned')}
								</SelectItem>
								{studentOptions.map((s) => (
									<SelectItem key={s.id} value={String(s.id)}>
										{s.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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

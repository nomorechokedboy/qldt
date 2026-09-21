import { MaterialImagesUpload } from '@/components/material-images-upload'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
	materialAssetStatusOptions,
	materialConditionOptions
} from '@/data/material-categories'
import { useUpdateMaterialAsset } from '@/hooks/useUpdateMaterialAsset'
import type { MaterialAsset, MaterialAssetStatus, Room, Student } from '@/types'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

const NONE = 'none'

interface MaterialAssetEditFormProps {
	data: MaterialAsset
	roomOptions: Room[]
	studentOptions: Student[]
	onUpdate: () => void
	onClose: () => void
}

export default function MaterialAssetEditForm({
	data,
	roomOptions,
	studentOptions,
	onUpdate,
	onClose
}: MaterialAssetEditFormProps) {
	const { t } = useTranslation('materials')
	const [status, setStatus] = useState<MaterialAssetStatus>(
		data.status ?? 'in_service'
	)
	const [condition, setCondition] = useState(data.condition ?? '')
	const [roomId, setRoomId] = useState<string>(
		data.roomId !== undefined && data.roomId !== null
			? String(data.roomId)
			: NONE
	)
	const [assignedTrooperId, setAssignedTrooperId] = useState<string>(
		data.assignedTrooperId !== undefined && data.assignedTrooperId !== null
			? String(data.assignedTrooperId)
			: NONE
	)
	const [note, setNote] = useState('')
	const [images, setImages] = useState<string[]>(data.images ?? [])

	const updateMutation = useUpdateMaterialAsset()

	const roomsForUnit = roomOptions.filter((r) => r.unitId === data.unitId)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await updateMutation.mutateAsync([
				{
					id: data.id,
					status,
					condition: condition || undefined,
					roomId: roomId === NONE ? null : Number(roomId),
					assignedTrooperId:
						assignedTrooperId === NONE
							? null
							: Number(assignedTrooperId),
					note: note || undefined,
					images
				}
			])
			toast.success(t('assetEdit.updated'))
			onUpdate()
			onClose()
		} catch (err) {
			console.error('Error updating material asset:', err)
			toastApiError(t('assetEdit.updateFailed'), err)
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
				<div className='space-y-1'>
					<Label>{t('columns.serialNumber')}</Label>
					<p className='text-sm text-muted-foreground'>
						{data.serialNumber}
					</p>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-status'>
						{t('columns.status')}
					</Label>
					<Select
						value={status}
						onValueChange={(value) =>
							setStatus(value as MaterialAssetStatus)
						}
					>
						<SelectTrigger id='edit-asset-status'>
							<SelectValue
								placeholder={t('assetEdit.pickStatus')}
							/>
						</SelectTrigger>
						<SelectContent>
							{materialAssetStatusOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-condition'>
						{t('columns.condition')}
					</Label>
					<Select value={condition} onValueChange={setCondition}>
						<SelectTrigger id='edit-asset-condition'>
							<SelectValue
								placeholder={t('form.pickCondition')}
							/>
						</SelectTrigger>
						<SelectContent>
							{materialConditionOptions.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-asset-room'>{t('columns.room')}</Label>
					<Select value={roomId} onValueChange={setRoomId}>
						<SelectTrigger id='edit-asset-room'>
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
					<Label htmlFor='edit-asset-trooper'>
						{t('assetForm.assignTrooper')}
					</Label>
					<Select
						value={assignedTrooperId}
						onValueChange={setAssignedTrooperId}
					>
						<SelectTrigger id='edit-asset-trooper'>
							<SelectValue
								placeholder={t('assetEdit.pickTrooper')}
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
					<Label htmlFor='edit-asset-note'>
						{t('assetEdit.note')}
					</Label>
					<Textarea
						id='edit-asset-note'
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder={t('assetEdit.notePlaceholder')}
					/>
				</div>

				<div className='space-y-2'>
					<Label>{t('columns.images')}</Label>
					<MaterialImagesUpload value={images} onChange={setImages} />
				</div>

				<div className='flex justify-end gap-2'>
					<Button type='button' variant='outline' onClick={onClose}>
						{t('form.cancel')}
					</Button>
					<Button type='submit' disabled={updateMutation.isPending}>
						{updateMutation.isPending
							? t('form.saving')
							: t('form.save')}
					</Button>
				</div>
			</form>
		</div>
	)
}

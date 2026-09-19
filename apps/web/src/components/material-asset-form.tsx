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
import { getErrorMessage } from '@/lib/utils'
import { MAX_MATERIAL_ASSET_SERIAL_LENGTH } from '@/lib/material-limits'
import type { MaterialType, Room, Student, Unit } from '@/types'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
			toast.success('Thêm mới khí tài thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating material asset:', err)
			toast.error(getErrorMessage(err, 'Thêm mới khí tài thất bại!'))
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
					Thêm khí tài
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm khí tài/vũ khí</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='asset-material-type'>
							Loại khí tài
						</Label>
						<Select
							value={materialTypeId}
							onValueChange={setMaterialTypeId}
						>
							<SelectTrigger id='asset-material-type'>
								<SelectValue placeholder='Chọn loại khí tài' />
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
						<Label htmlFor='asset-serial'>Số sê-ri</Label>
						<Input
							id='asset-serial'
							maxLength={MAX_MATERIAL_ASSET_SERIAL_LENGTH}
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='asset-unit'>Thuộc đơn vị</Label>
						<Select
							value={unitId}
							onValueChange={(value) => {
								setUnitId(value)
								setRoomId(NONE)
							}}
						>
							<SelectTrigger id='asset-unit'>
								<SelectValue placeholder='Chọn đơn vị' />
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
						<Label htmlFor='asset-room'>Vị trí</Label>
						<Select value={roomId} onValueChange={setRoomId}>
							<SelectTrigger id='asset-room'>
								<SelectValue placeholder='Chọn phòng (tuỳ chọn)' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE}>
									Chưa có vị trí cụ thể
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
							Cấp phát cho quân nhân
						</Label>
						<Select
							value={assignedTrooperId}
							onValueChange={setAssignedTrooperId}
						>
							<SelectTrigger id='asset-trooper'>
								<SelectValue placeholder='Chọn quân nhân (tuỳ chọn)' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE}>
									Chưa cấp phát
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
						<Label>Hình ảnh</Label>
						<MaterialImagesUpload
							value={images}
							onChange={setImages}
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={
								createMutation.isPending ||
								!materialTypeId ||
								!unitId
							}
						>
							{createMutation.isPending ? 'Đang thêm...' : 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

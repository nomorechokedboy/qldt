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
import { useCreateMaterialAsset } from '@/hooks/useCreateMaterialAsset'
import type { MaterialType, Student, Unit } from '@/types'

const NONE = 'none'

export interface MaterialAssetFormProps {
	unitOptions: Unit[]
	defaultUnitId?: number
	materialTypeOptions: MaterialType[]
	studentOptions: Student[]
	onSuccess?: () => void
}

export default function MaterialAssetForm({
	unitOptions,
	defaultUnitId,
	materialTypeOptions,
	studentOptions,
	onSuccess
}: MaterialAssetFormProps) {
	const [open, setOpen] = useState(false)
	const [materialTypeId, setMaterialTypeId] = useState('')
	const [unitId, setUnitId] = useState<string>(
		defaultUnitId !== undefined ? String(defaultUnitId) : ''
	)
	const [serialNumber, setSerialNumber] = useState('')
	const [assignedTrooperId, setAssignedTrooperId] = useState<string>(NONE)

	const createMutation = useCreateMaterialAsset()

	const resetForm = () => {
		setMaterialTypeId('')
		setUnitId(defaultUnitId !== undefined ? String(defaultUnitId) : '')
		setSerialNumber('')
		setAssignedTrooperId(NONE)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createMutation.mutateAsync({
				materialTypeId: Number(materialTypeId),
				unitId: Number(unitId),
				serialNumber,
				assignedTrooperId:
					assignedTrooperId === NONE
						? undefined
						: Number(assignedTrooperId)
			})
			toast.success('Thêm mới khí tài thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating material asset:', err)
			toast.error('Thêm mới khí tài thất bại!')
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
			<DialogContent className='sm:max-w-md'>
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
							value={serialNumber}
							onChange={(e) => setSerialNumber(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='asset-unit'>Thuộc đơn vị</Label>
						<Select value={unitId} onValueChange={setUnitId}>
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

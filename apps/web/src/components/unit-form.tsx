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
import { useCreateUnit } from '@/hooks/useCreateUnit'
import useUnitsData from '@/hooks/useUnitsData'
import { isLargerUnitLevel, unitLevelOptions } from '@/data/unit-levels'
import type { UnitLevel } from '@/types'

const NO_PARENT = 'none'

export interface UnitFormProps {
	onSuccess?: () => void
}

export default function UnitForm({ onSuccess }: UnitFormProps) {
	const [open, setOpen] = useState(false)
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')
	const [level, setLevel] = useState<UnitLevel>('battalion')
	const [parentId, setParentId] = useState<string>(NO_PARENT)

	const { data: allUnits } = useUnitsData()
	const createUnitMutation = useCreateUnit()

	const parentOptions =
		allUnits?.filter((u) => isLargerUnitLevel(u.level, level)) ?? []

	const resetForm = () => {
		setAlias('')
		setName('')
		setLevel('battalion')
		setParentId(NO_PARENT)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createUnitMutation.mutateAsync({
				alias,
				name,
				level,
				parentId: parentId === NO_PARENT ? null : Number(parentId)
			})
			toast.success('Thêm mới đơn vị thành công')
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating unit:', err)
			toast.error('Thêm mới đơn vị thất bại!')
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
					Thêm đơn vị
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Biểu mẫu thêm đơn vị</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='unit-name'>Tên đơn vị</Label>
						<Input
							id='unit-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='unit-alias'>Mã định danh (alias)</Label>
						<Input
							id='unit-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder='vd: d1, c1'
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='unit-level'>Cấp đơn vị</Label>
						<Select
							value={level}
							onValueChange={(value) => {
								setLevel(value as UnitLevel)
								setParentId(NO_PARENT)
							}}
						>
							<SelectTrigger id='unit-level'>
								<SelectValue placeholder='Chọn cấp đơn vị' />
							</SelectTrigger>
							<SelectContent>
								{unitLevelOptions.map((opt) => (
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
						<Label htmlFor='unit-parent'>Thuộc đơn vị</Label>
						<Select value={parentId} onValueChange={setParentId}>
							<SelectTrigger id='unit-parent'>
								<SelectValue placeholder='Chọn đơn vị cấp trên' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_PARENT}>
									Không có (đơn vị gốc)
								</SelectItem>
								{parentOptions.map((u) => (
									<SelectItem key={u.id} value={String(u.id)}>
										{u.name}
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
							disabled={createUnitMutation.isPending}
						>
							{createUnitMutation.isPending
								? 'Đang thêm...'
								: 'Thêm'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

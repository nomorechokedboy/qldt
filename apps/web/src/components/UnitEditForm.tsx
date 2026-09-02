import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
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
import { useUpdateUnits } from '@/hooks/useUpdateUnits'
import useUnitsData from '@/hooks/useUnitsData'
import useAuth from '@/hooks/useAuth'
import {
	isLargerUnitLevel,
	unitLevelLabels,
	unitLevelOptions
} from '@/data/unit-levels'
import type { Unit, UnitLevel } from '@/types'
import UnitCommanderFields, {
	commanderValuesFromUnit,
	commanderValuesToPayload,
	type CommanderFieldKey,
	type UnitCommanderValues
} from '@/components/unit-commander-fields'

const NO_PARENT = 'none'

interface UnitEditFormProps {
	unitData: Unit
	onUpdate: (updated: {
		alias: string
		name: string
		level: UnitLevel
		parentId: number | null
	}) => void
	onClose: () => void
}

export default function UnitEditForm({
	unitData,
	onUpdate,
	onClose
}: UnitEditFormProps) {
	const [alias, setAlias] = useState(unitData.alias)
	const [name, setName] = useState(unitData.name)
	const [level, setLevel] = useState<UnitLevel>(unitData.level)
	const [parentId, setParentId] = useState<string>(
		unitData.parent?.id !== undefined && unitData.parent !== null
			? String(unitData.parent.id)
			: NO_PARENT
	)
	const [commanders, setCommanders] = useState<UnitCommanderValues>(
		commanderValuesFromUnit(unitData)
	)

	const { data: allUnits } = useUnitsData()
	const updateUnitMutation = useUpdateUnits()
	const { user } = useAuth()

	// A unit's level and parent are fixed once created - only a super
	// admin can restructure the hierarchy afterwards (mirrors the backend
	// check in units/controller.ts#update). Non-super-admins still see the
	// current values, just as read-only text rather than editable pickers.
	const isSuperAdmin = !!user?.isSuperAdmin

	const parentOptions =
		allUnits?.filter(
			(u) => u.id !== unitData.id && isLargerUnitLevel(u.level, level)
		) ?? []

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const nextParentId = parentId === NO_PARENT ? null : Number(parentId)

		try {
			await updateUnitMutation.mutateAsync([
				{
					id: unitData.id,
					alias,
					name,
					level,
					parentId: nextParentId,
					...commanderValuesToPayload(commanders)
				}
			])
			toast.success('Cập nhật thông tin đơn vị thành công')
			onUpdate({ alias, name, level, parentId: nextParentId })
			onClose()
		} catch (err) {
			console.error('Error updating unit:', err)
			toast.error('Cập nhật thông tin đơn vị thất bại!')
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
					<Label htmlFor='edit-unit-name'>Tên đơn vị</Label>
					<Input
						id='edit-unit-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-alias'>
						Mã định danh (alias)
					</Label>
					<Input
						id='edit-unit-alias'
						value={alias}
						onChange={(e) => setAlias(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-level'>Cấp đơn vị</Label>
					{isSuperAdmin ? (
						<Select
							value={level}
							onValueChange={(value) => {
								setLevel(value as UnitLevel)
								setParentId(NO_PARENT)
							}}
						>
							<SelectTrigger id='edit-unit-level'>
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
					) : (
						<>
							<Input
								id='edit-unit-level'
								value={unitLevelLabels[unitData.level]}
								disabled
								readOnly
							/>
							<p className='text-xs text-muted-foreground'>
								Chỉ quản trị viên hệ thống mới có thể thay đổi
								cấp đơn vị
							</p>
						</>
					)}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-parent'>Thuộc đơn vị</Label>
					{isSuperAdmin ? (
						<Select value={parentId} onValueChange={setParentId}>
							<SelectTrigger id='edit-unit-parent'>
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
					) : (
						<>
							<Input
								id='edit-unit-parent'
								value={
									unitData.parent?.name ??
									'Không có (đơn vị gốc)'
								}
								disabled
								readOnly
							/>
							<p className='text-xs text-muted-foreground'>
								Chỉ quản trị viên hệ thống mới có thể thay đổi
								đơn vị cấp trên
							</p>
						</>
					)}
				</div>

				<UnitCommanderFields
					idPrefix='edit-unit'
					values={commanders}
					onChange={(field: CommanderFieldKey, value: string) =>
						setCommanders((prev) => ({ ...prev, [field]: value }))
					}
				/>

				<div className='flex justify-end gap-2 pt-2'>
					<Button type='button' onClick={onClose} variant='outline'>
						Huỷ
					</Button>
					<Button
						type='submit'
						disabled={updateUnitMutation.isPending}
					>
						{updateUnitMutation.isPending
							? 'Đang cập nhật...'
							: 'Cập nhật'}
					</Button>
				</div>
			</form>
		</div>
	)
}

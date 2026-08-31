import { useState } from 'react'
import { Pencil, Trash, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
	Card,
	CardHeader,
	CardTitle,
	CardFooter,
	CardDescription
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import UnitEditForm from '@/components/UnitEditForm'
import { useDeleteUnits } from '@/hooks/useDeleteUnits'
import { unitLevelLabels } from '@/data/unit-levels'
import type { Unit } from '@/types'

function unitDetailLink(data: Unit) {
	switch (data.level) {
		case 'company':
			return {
				to: '/dai-doi/$companyAlias',
				params: { companyAlias: data.alias }
			} as const
		case 'platoon':
			return {
				to: '/trung-doi/$platoonAlias',
				params: { platoonAlias: data.alias }
			} as const
		default:
			return {
				to: '/tieu-doan/$alias',
				params: { alias: data.alias },
				search: { level: data.level, name: '' }
			} as const
	}
}

interface UnitCardProps {
	data: Unit
	onEdit?: () => void
	onDelete?: () => void
}

export default function UnitCard({ data, onEdit, onDelete }: UnitCardProps) {
	const [openEdit, setOpenEdit] = useState(false)
	const [openDelete, setOpenDelete] = useState(false)
	const deleteUnitMutation = useDeleteUnits()

	const handleDelete = async () => {
		try {
			await deleteUnitMutation.mutateAsync([data.id])
			toast.success(`Đã xoá đơn vị "${data.name}" thành công!`)
			onDelete?.()
		} catch (error) {
			toast.error('Có lỗi xảy ra khi xoá đơn vị')
		} finally {
			setOpenDelete(false)
		}
	}

	const levelLabel = unitLevelLabels[data.level]
	const isRoot = !data.parent

	return (
		<>
			<Card className='@container/card relative group'>
				<CardHeader className='flex items-center justify-between'>
					<div>
						<CardTitle className='text-xl font-semibold flex items-center gap-2'>
							{data.name}
							<Badge variant='secondary' className='text-xs'>
								{levelLabel}
							</Badge>
							{isRoot && (
								<Badge variant='outline' className='text-xs'>
									Đơn vị gốc
								</Badge>
							)}
						</CardTitle>
						<CardDescription>
							Mã định danh: {data.alias}
							{data.parent && ` · Thuộc ${data.parent.name}`}
						</CardDescription>
					</div>
					<div className='hidden gap-2 transition-all group-hover:flex self-start'>
						<Button
							asChild
							type='button'
							aria-label='Manage'
							title='Quản lý đơn vị'
							variant='ghost'
							className='text-emerald-600'
							size='icon'
						>
							<Link {...unitDetailLink(data)}>
								<ExternalLink size={18} />
							</Link>
						</Button>
						<Button
							type='button'
							aria-label='Edit'
							title='Chỉnh sửa'
							variant='ghost'
							className='text-sky-600'
							size='icon'
							onClick={() => setOpenEdit(true)}
						>
							<Pencil size={18} />
						</Button>
						{!isRoot && (
							<Button
								type='button'
								variant='ghost'
								aria-label='Delete'
								title='Xoá'
								className='text-destructive'
								size='icon'
								onClick={() => setOpenDelete(true)}
							>
								<Trash size={18} />
							</Button>
						)}
					</div>
				</CardHeader>
				{data.children !== undefined && data.children.length > 0 && (
					<CardFooter className='flex-col items-start gap-1.5 text-sm'>
						<div className='text-muted-foreground'>
							Số đơn vị trực thuộc: {data.children.length}
						</div>
					</CardFooter>
				)}
			</Card>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						Chỉnh sửa đơn vị
					</DialogTitle>
					<UnitEditForm
						unitData={data}
						onUpdate={() => {
							onEdit?.()
							setOpenEdit(false)
						}}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={openDelete} onOpenChange={setOpenDelete}>
				<DialogContent className='max-w-md max-h-1/3'>
					<DialogTitle className='sr-only'>
						Xác nhận xoá đơn vị
					</DialogTitle>
					<div className='flex flex-col gap-4'>
						<div className='font-semibold text-lg text-center'>
							Xác nhận xoá đơn vị?
						</div>
						<div className='text-center text-muted-foreground'>
							Bạn có chắc muốn xoá đơn vị{' '}
							<b className='text-red-600'>{data.name}</b> không?
							<p>
								Hành động này <b>không thể hoàn tác.</b>
							</p>
						</div>
						<div className='flex justify-end gap-2 mt-4'>
							<button
								type='button'
								className='px-4 py-2 rounded-lg border'
								onClick={() => setOpenDelete(false)}
								disabled={deleteUnitMutation.isPending}
							>
								Huỷ
							</button>
							<button
								type='button'
								className='px-4 py-2 rounded-lg bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50'
								onClick={handleDelete}
								disabled={deleteUnitMutation.isPending}
							>
								{deleteUnitMutation.isPending
									? 'Đang xoá...'
									: 'Xoá'}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

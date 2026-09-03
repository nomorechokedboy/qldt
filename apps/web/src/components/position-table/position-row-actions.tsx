import { useState, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import PositionEditForm from '@/components/PositionEditForm'
import { useDeletePositions } from '@/hooks/useDeletePositions'
import type { Position } from '@/types'

interface PositionRowActionsProps {
	data: Position
	onChanged?: () => void
}

export function PositionRowActions({
	data,
	onChanged
}: PositionRowActionsProps) {
	const [openEdit, setOpenEdit] = useState(false)
	const deleteMutation = useDeletePositions()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (
				!confirm(
					`Bạn có chắc muốn xoá chức vụ "${data.name}"? Hành động này không thể hoàn tác.`
				)
			) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success('Xóa chức vụ thành công!')
			onChanged?.()
		} catch (err) {
			toast.error('Xóa chức vụ thất bại!')
			if (err instanceof AxiosError) {
				console.error('Http error: ', err.response?.data)
			}
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='ghost'
						className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
						disabled={deleteMutation.isPending}
					>
						<MoreHorizontal />
						<span className='sr-only'>Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px]'>
					<DropdownMenuItem onClick={() => setOpenEdit(true)}>
						Chỉnh sửa
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
					>
						Xóa
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						Chỉnh sửa chức vụ
					</DialogTitle>
					<PositionEditForm
						data={data}
						onUpdate={() => onChanged?.()}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}

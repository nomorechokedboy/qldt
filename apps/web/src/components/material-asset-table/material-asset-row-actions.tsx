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
import MaterialAssetEditForm from '@/components/MaterialAssetEditForm'
import MaterialAssetHistorySheet from './material-asset-history-sheet'
import { useDeleteMaterialAssets } from '@/hooks/useDeleteMaterialAssets'
import type { MaterialAsset, Student } from '@/types'

interface MaterialAssetRowActionsProps {
	data: MaterialAsset
	studentOptions: Student[]
	onChanged?: () => void
}

export function MaterialAssetRowActions({
	data,
	studentOptions,
	onChanged
}: MaterialAssetRowActionsProps) {
	const [openEdit, setOpenEdit] = useState(false)
	const [openHistory, setOpenHistory] = useState(false)
	const deleteMutation = useDeleteMaterialAssets()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (
				!confirm(
					`Bạn có chắc muốn xoá khí tài "${data.serialNumber}"? Hành động này không thể hoàn tác.`
				)
			) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success('Xóa khí tài thành công!')
			onChanged?.()
		} catch (err) {
			toast.error('Xóa khí tài thất bại!')
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
				<DropdownMenuContent align='end' className='w-[180px]'>
					<DropdownMenuItem onClick={() => setOpenEdit(true)}>
						Cấp phát / cập nhật
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setOpenHistory(true)}>
						Lịch sử
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
						Cập nhật khí tài
					</DialogTitle>
					<MaterialAssetEditForm
						data={data}
						studentOptions={studentOptions}
						onUpdate={() => onChanged?.()}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>

			<MaterialAssetHistorySheet
				assetId={data.id}
				open={openHistory}
				onOpenChange={setOpenHistory}
			/>
		</>
	)
}

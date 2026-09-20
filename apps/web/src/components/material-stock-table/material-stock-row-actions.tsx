import { useState, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
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
import MaterialStockEditForm from '@/components/MaterialStockEditForm'
import { useDeleteMaterialStocks } from '@/hooks/useDeleteMaterialStocks'
import type { MaterialStock, Room } from '@/types'

interface MaterialStockRowActionsProps {
	data: MaterialStock
	roomOptions: Room[]
	onChanged?: () => void
}

export function MaterialStockRowActions({
	data,
	roomOptions,
	onChanged
}: MaterialStockRowActionsProps) {
	const { t } = useTranslation('materials')
	const [openEdit, setOpenEdit] = useState(false)
	const deleteMutation = useDeleteMaterialStocks()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (
				!confirm(
					t('stockTable.confirmDelete', {
						name: data.materialType?.name
					})
				)
			) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success(t('stockTable.deleted'))
			onChanged?.()
		} catch (err) {
			toast.error(t('stockTable.deleteFailed'))
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
						{t('actions.update')}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
					>
						{t('actions.delete')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						{t('stockTable.editTitle')}
					</DialogTitle>
					<MaterialStockEditForm
						data={data}
						roomOptions={roomOptions}
						onUpdate={() => onChanged?.()}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}

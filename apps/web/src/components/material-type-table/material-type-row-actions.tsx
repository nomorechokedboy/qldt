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
import MaterialTypeEditForm from '@/components/MaterialTypeEditForm'
import { useDeleteMaterialTypes } from '@/hooks/useDeleteMaterialTypes'
import type { MaterialType } from '@/types'

interface MaterialTypeRowActionsProps {
	data: MaterialType
	onChanged?: () => void
}

export function MaterialTypeRowActions({
	data,
	onChanged
}: MaterialTypeRowActionsProps) {
	const { t } = useTranslation('materials')
	const [openEdit, setOpenEdit] = useState(false)
	const deleteMutation = useDeleteMaterialTypes()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (!confirm(t('typeTable.confirmDelete', { name: data.name }))) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success(t('typeTable.deleted'))
			onChanged?.()
		} catch (err) {
			toast.error(t('typeTable.deleteFailed'))
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
						{t('actions.edit')}
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
						{t('typeTable.editTitle')}
					</DialogTitle>
					<MaterialTypeEditForm
						data={data}
						onUpdate={() => onChanged?.()}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}

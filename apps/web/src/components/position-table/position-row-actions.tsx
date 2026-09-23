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
import { useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

interface PositionRowActionsProps {
	data: Position
	onChanged?: () => void
}

export function PositionRowActions({
	data,
	onChanged
}: PositionRowActionsProps) {
	const { t } = useTranslation('admin')
	const [openEdit, setOpenEdit] = useState(false)
	const deleteMutation = useDeletePositions()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (!confirm(t('positions.delete.confirm', { name: data.name }))) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success(t('positions.delete.success'))
			onChanged?.()
		} catch (err) {
			toastApiError(t('positions.delete.failed'), err)
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
					{/* Deferred: opening the Dialog synchronously while the
					DropdownMenu is still closing can leave Radix's shared
					body scroll-lock counter stuck (data-scroll-locked never
					reaches 0), freezing all clicks on the page. */}
					<DropdownMenuItem
						onSelect={() => {
							setTimeout(() => setOpenEdit(true), 0)
						}}
					>
						{t('common.edit')}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
					>
						{t('common.delete')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						{t('positions.update.title')}
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

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
import MaterialAssetEditForm from '@/components/MaterialAssetEditForm'
import AssetQrDialog from './asset-qr-dialog'
import MaterialAssetHistorySheet from './material-asset-history-sheet'
import { useDeleteMaterialAssets } from '@/hooks/useDeleteMaterialAssets'
import type { MaterialAsset, Room, Student } from '@/types'
import { toastApiError } from '@/lib/api-error'

interface MaterialAssetRowActionsProps {
	data: MaterialAsset
	roomOptions: Room[]
	studentOptions: Student[]
	onChanged?: () => void
}

export function MaterialAssetRowActions({
	data,
	roomOptions,
	studentOptions,
	onChanged
}: MaterialAssetRowActionsProps) {
	const { t } = useTranslation('materials')
	const [openEdit, setOpenEdit] = useState(false)
	const [openHistory, setOpenHistory] = useState(false)
	const [openQr, setOpenQr] = useState(false)
	const deleteMutation = useDeleteMaterialAssets()

	async function handleDelete(_: MouseEvent<HTMLDivElement>) {
		try {
			if (
				!confirm(
					t('assetTable.confirmDelete', { name: data.serialNumber })
				)
			) {
				return
			}
			await deleteMutation.mutateAsync([data.id])
			toast.success(t('assetTable.deleted'))
			onChanged?.()
		} catch (err) {
			toastApiError(t('assetTable.deleteFailed'), err)
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
					{/* Deferred: opening a Dialog/Sheet synchronously while the
					DropdownMenu is still closing can leave Radix's shared
					body scroll-lock counter stuck, freezing all clicks. Do
					NOT call event.preventDefault() in onSelect to "help" —
					Radix's MenuItem treats that as "don't close the menu"
					and skips its own onClose(), which strands the menu
					(and its lock) open forever instead. */}
					<DropdownMenuItem
						onSelect={() => {
							setTimeout(() => setOpenEdit(true), 0)
						}}
					>
						{t('assetTable.allocate')}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							setTimeout(() => setOpenHistory(true), 0)
						}}
					>
						{t('assetTable.history')}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							setTimeout(() => setOpenQr(true), 0)
						}}
					>
						{t('assetTable.downloadQr')}
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
						{t('assetTable.editTitle')}
					</DialogTitle>
					<MaterialAssetEditForm
						data={data}
						roomOptions={roomOptions}
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

			<AssetQrDialog data={data} open={openQr} onOpenChange={setOpenQr} />
		</>
	)
}

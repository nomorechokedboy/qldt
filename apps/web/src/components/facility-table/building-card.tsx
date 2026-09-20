import { useState } from 'react'
import { History, Pencil, Trash, DoorOpen } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import BuildingEditForm from '@/components/BuildingEditForm'
import InventorySessionDialog from '@/components/inventory-session/inventory-session-dialog'
import InventorySessionHistorySheet from '@/components/inventory-session/inventory-session-history-sheet'
import RoomEditForm from '@/components/RoomEditForm'
import RoomForm from '@/components/room-form'
import { useDeleteBuildings } from '@/hooks/useDeleteBuildings'
import { useDeleteRooms } from '@/hooks/useDeleteRooms'
import useRoomsData from '@/hooks/useRoomsData'
import type { Building } from '@/types'

interface BuildingCardProps {
	data: Building
	onChanged?: () => void
}

export default function BuildingCard({ data, onChanged }: BuildingCardProps) {
	const { t } = useTranslation('units')
	const [openEdit, setOpenEdit] = useState(false)
	const [openDelete, setOpenDelete] = useState(false)
	const [openRooms, setOpenRooms] = useState(false)
	const deleteBuildingMutation = useDeleteBuildings()

	const handleDelete = async () => {
		try {
			await deleteBuildingMutation.mutateAsync([data.id])
			toast.success(t('facilities.building.deleted', { name: data.name }))
			onChanged?.()
		} catch (error) {
			toast.error(t('facilities.building.deleteFailed'))
		} finally {
			setOpenDelete(false)
		}
	}

	return (
		<>
			<Card className='@container/card relative group'>
				<CardHeader className='flex items-center justify-between'>
					<div>
						<CardTitle className='text-xl font-semibold'>
							{data.name}
						</CardTitle>
						{data.description && (
							<CardDescription>
								{data.description}
							</CardDescription>
						)}
					</div>
					<div className='hidden gap-2 transition-all group-hover:flex self-start'>
						<Button
							type='button'
							aria-label='Edit'
							title={t('facilities.common.edit')}
							variant='ghost'
							className='text-sky-600'
							size='icon'
							onClick={() => setOpenEdit(true)}
						>
							<Pencil size={18} />
						</Button>
						<Button
							type='button'
							variant='ghost'
							aria-label='Delete'
							title={t('facilities.common.delete')}
							className='text-destructive'
							size='icon'
							onClick={() => setOpenDelete(true)}
						>
							<Trash size={18} />
						</Button>
					</div>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-2 text-sm'>
					<div className='text-muted-foreground'>
						{t('facilities.building.roomCount', {
							count: data.rooms?.length ?? 0
						})}
					</div>
					<Button
						size='sm'
						variant='secondary'
						onClick={() => setOpenRooms(true)}
					>
						<DoorOpen className='w-4 h-4 mr-2' />
						{t('facilities.building.manageRooms')}
					</Button>
				</CardFooter>
			</Card>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						{t('facilities.building.editTitle')}
					</DialogTitle>
					<BuildingEditForm
						data={data}
						onUpdate={() => onChanged?.()}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={openDelete} onOpenChange={setOpenDelete}>
				<DialogContent className='max-w-md max-h-1/3'>
					<DialogTitle className='sr-only'>
						{t('facilities.building.deleteDialogTitle')}
					</DialogTitle>
					<div className='flex flex-col gap-4'>
						<div className='font-semibold text-lg text-center'>
							{t('facilities.building.deleteHeading')}
						</div>
						<div className='text-center text-muted-foreground'>
							<Trans
								t={t}
								i18nKey='facilities.building.deleteConfirm'
								values={{ name: data.name }}
								components={{
									name: <b className='text-red-600' />
								}}
							/>
							<p>
								<Trans
									t={t}
									i18nKey='facilities.building.irreversible'
									components={{ b: <b /> }}
								/>
							</p>
						</div>
						<div className='flex justify-end gap-2 mt-4'>
							<button
								type='button'
								className='px-4 py-2 rounded-lg border'
								onClick={() => setOpenDelete(false)}
								disabled={deleteBuildingMutation.isPending}
							>
								{t('facilities.common.dismiss')}
							</button>
							<button
								type='button'
								className='px-4 py-2 rounded-lg bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50'
								onClick={handleDelete}
								disabled={deleteBuildingMutation.isPending}
							>
								{deleteBuildingMutation.isPending
									? t('facilities.common.deleting')
									: t('facilities.common.delete')}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Sheet open={openRooms} onOpenChange={setOpenRooms}>
				<SheetContent className='w-full sm:max-w-lg'>
					<SheetHeader>
						<SheetTitle>
							{t('facilities.building.roomsTitle', {
								name: data.name
							})}
						</SheetTitle>
					</SheetHeader>
					<RoomsPanel
						buildingId={data.id}
						unitId={data.unitId}
						enabled={openRooms}
						onChanged={onChanged}
					/>
				</SheetContent>
			</Sheet>
		</>
	)
}

function RoomsPanel({
	buildingId,
	unitId,
	enabled,
	onChanged
}: {
	buildingId: number
	unitId: number
	enabled: boolean
	onChanged?: () => void
}) {
	const { data: rooms, refetch } = useRoomsData({ buildingId }, { enabled })
	const { t } = useTranslation('units')
	const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
	const [historyRoomId, setHistoryRoomId] = useState<number | null>(null)
	const deleteRoomMutation = useDeleteRooms()

	const handleChanged = () => {
		refetch()
		onChanged?.()
	}

	const handleDeleteRoom = async (id: number, name: string) => {
		if (!confirm(t('facilities.room.deleteConfirm', { name }))) return
		try {
			await deleteRoomMutation.mutateAsync([id])
			toast.success(t('facilities.room.deleted'))
			handleChanged()
		} catch (err) {
			toast.error(t('facilities.room.deleteFailed'))
		}
	}

	const editingRoom = rooms?.find((r) => r.id === editingRoomId)

	return (
		<div className='px-4 pb-4 space-y-4'>
			<RoomForm
				unitId={unitId}
				buildingId={buildingId}
				onSuccess={handleChanged}
			/>

			<div className='space-y-2'>
				{rooms?.length === 0 && (
					<p className='text-muted-foreground text-sm'>
						{t('facilities.room.empty')}
					</p>
				)}
				{rooms?.map((room) => (
					<div
						key={room.id}
						className='flex items-center justify-between rounded-md border p-3'
					>
						<div>
							<div className='font-medium'>{room.name}</div>
							{room.type && (
								<Badge
									variant='outline'
									className='text-xs mt-1'
								>
									{room.type}
								</Badge>
							)}
						</div>
						<div className='flex gap-1'>
							<InventorySessionDialog
								roomId={room.id}
								roomName={room.name}
							/>
							<Button
								size='icon'
								variant='ghost'
								title={t('facilities.room.inventoryHistory')}
								onClick={() => setHistoryRoomId(room.id)}
							>
								<History size={16} />
							</Button>
							<Button
								size='icon'
								variant='ghost'
								onClick={() => setEditingRoomId(room.id)}
							>
								<Pencil size={16} />
							</Button>
							<Button
								size='icon'
								variant='ghost'
								className='text-destructive'
								onClick={() =>
									handleDeleteRoom(room.id, room.name)
								}
							>
								<Trash size={16} />
							</Button>
						</div>
					</div>
				))}
			</div>

			<Dialog
				open={editingRoom !== undefined}
				onOpenChange={(next) => !next && setEditingRoomId(null)}
			>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						{t('facilities.room.editTitle')}
					</DialogTitle>
					{editingRoom && (
						<RoomEditForm
							data={editingRoom}
							onUpdate={handleChanged}
							onClose={() => setEditingRoomId(null)}
						/>
					)}
				</DialogContent>
			</Dialog>

			<InventorySessionHistorySheet
				roomId={historyRoomId ?? undefined}
				roomName={
					rooms?.find((r) => r.id === historyRoomId)?.name ?? ''
				}
				open={historyRoomId !== null}
				onOpenChange={(next) => !next && setHistoryRoomId(null)}
			/>
		</div>
	)
}

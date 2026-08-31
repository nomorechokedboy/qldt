import { useState } from 'react'
import { Pencil, Trash, DoorOpen } from 'lucide-react'
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
	const [openEdit, setOpenEdit] = useState(false)
	const [openDelete, setOpenDelete] = useState(false)
	const [openRooms, setOpenRooms] = useState(false)
	const deleteBuildingMutation = useDeleteBuildings()

	const handleDelete = async () => {
		try {
			await deleteBuildingMutation.mutateAsync([data.id])
			toast.success(`Đã xoá nhà "${data.name}" thành công!`)
			onChanged?.()
		} catch (error) {
			toast.error('Có lỗi xảy ra khi xoá nhà')
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
							title='Chỉnh sửa'
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
							title='Xoá'
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
						Số phòng: {data.rooms?.length ?? 0}
					</div>
					<Button
						size='sm'
						variant='secondary'
						onClick={() => setOpenRooms(true)}
					>
						<DoorOpen className='w-4 h-4 mr-2' />
						Quản lý phòng
					</Button>
				</CardFooter>
			</Card>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>Chỉnh sửa nhà</DialogTitle>
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
						Xác nhận xoá nhà
					</DialogTitle>
					<div className='flex flex-col gap-4'>
						<div className='font-semibold text-lg text-center'>
							Xác nhận xoá nhà?
						</div>
						<div className='text-center text-muted-foreground'>
							Bạn có chắc muốn xoá nhà{' '}
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
								disabled={deleteBuildingMutation.isPending}
							>
								Huỷ
							</button>
							<button
								type='button'
								className='px-4 py-2 rounded-lg bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50'
								onClick={handleDelete}
								disabled={deleteBuildingMutation.isPending}
							>
								{deleteBuildingMutation.isPending
									? 'Đang xoá...'
									: 'Xoá'}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Sheet open={openRooms} onOpenChange={setOpenRooms}>
				<SheetContent className='w-full sm:max-w-lg'>
					<SheetHeader>
						<SheetTitle>Danh sách phòng - {data.name}</SheetTitle>
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
	const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
	const deleteRoomMutation = useDeleteRooms()

	const handleChanged = () => {
		refetch()
		onChanged?.()
	}

	const handleDeleteRoom = async (id: number, name: string) => {
		if (!confirm(`Bạn có chắc muốn xoá phòng "${name}"?`)) return
		try {
			await deleteRoomMutation.mutateAsync([id])
			toast.success('Xoá phòng thành công')
			handleChanged()
		} catch (err) {
			toast.error('Xoá phòng thất bại!')
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
						Nhà này chưa có phòng nào.
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
						Chỉnh sửa phòng
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
		</div>
	)
}

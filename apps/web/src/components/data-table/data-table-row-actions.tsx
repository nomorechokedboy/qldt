import { useTranslation } from 'react-i18next'
import type { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { OnDeleteRows, Student } from '@/types'
import {
	Dialog,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogContent
} from '@/components/ui/dialog'
import StudentInfo from '../student-info'
import { useState, type MouseEvent } from 'react'
import useDeleteStudents from '@/hooks/useDeleteStudents'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { isSuperAdmin } from '@/lib/utils'
import { toastApiError } from '@/lib/api-error'

interface DataTableRowActionsProps<TData> {
	row: Row<TData>
	onDeleteRows?: OnDeleteRows
	// Only the details can be opened: no delete, and the details cannot edit.
	readOnly?: boolean
}

export function DataTableRowActions<TData>({
	row,
	onDeleteRows,
	readOnly = false
}: DataTableRowActionsProps<TData>) {
	const student = row.original as unknown as Student
	const { t } = useTranslation('table')
	const [dialogOpen, setDialogOpen] = useState(false)
	const { mutateAsync: deleteStudentMutate, isPending: isDeletingStudent } =
		useDeleteStudents()

	const canDelete =
		!readOnly && (isSuperAdmin() || student.status !== 'confirmed')

	function handleOpenDialog() {
		setDialogOpen(true)
	}

	async function handleDeleteRow(_: MouseEvent<HTMLDivElement>) {
		try {
			if (!confirm(t('rowActions.deleteConfirm'))) {
				return
			}
			await deleteStudentMutate({ ids: [student.id] }).then(() =>
				onDeleteRows?.([student.id])
			)
			toast.success(t('rowActions.deleteSuccess'))
		} catch (err) {
			toastApiError(t('rowActions.deleteFailed'), err)
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
						disabled={isDeletingStudent}
					>
						<MoreHorizontal />
						<span className='sr-only'>
							{t('rowActions.openMenu')}
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-[160px]'>
					<DropdownMenuItem onClick={handleOpenDialog}>
						{t('rowActions.details')}
					</DropdownMenuItem>
					{canDelete && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								disabled={isDeletingStudent}
								onClick={handleDeleteRow}
							>
								{t('rowActions.delete')}
								<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className='grid-cols-1 grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 lg:h-[85vh] lg:max-w-5xl'>
					<DialogHeader className='sr-only'>
						<DialogTitle>{t('rowActions.dialogTitle')}</DialogTitle>
						<DialogDescription>
							{t('rowActions.dialogDescription', {
								name: student.fullName
							})}
						</DialogDescription>
					</DialogHeader>

					<StudentInfo student={student} readOnly={readOnly} />
				</DialogContent>
			</Dialog>
		</>
	)
}

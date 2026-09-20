import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import useAuth from '@/hooks/useAuth'
import useUpdateStudent from '@/hooks/useUpdateStudent'
import { isSuperAdmin } from '@/lib/utils'
import type { Student } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, FileDown, UserPen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ExportStudentDataDialog } from '../export-student-data-dialog'
import StudentEditForm from '../student-edit-form'

export default function StudentActions({
	student,
	readOnly = false
}: {
	student: Student
	readOnly?: boolean
}) {
	const { t } = useTranslation('student')
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const { mutateAsync: updateStudent, isPending: isUpdating } =
		useUpdateStudent()
	const { user } = useAuth()

	const canEdit =
		!readOnly && (isSuperAdmin() || student.status !== 'confirmed')

	const handleConfirmStudent = async () => {
		const confirmed = confirm(t('actions.confirmPrompt'))
		if (!confirmed) return

		try {
			await updateStudent({
				data: [
					{
						id: student.id,
						status: 'confirmed',
						unitId: student.unit?.id
					}
				]
			})
			toast.success(t('actions.confirmSuccess'))
			queryClient.invalidateQueries({
				queryKey: ['students'],
				type: 'all'
			})
			await queryClient.invalidateQueries({
				queryKey: ['unitTroopers'],
				type: 'all'
			})
		} catch (error) {
			toast.error(t('actions.confirmFailed'))
			console.error(error)
		}
	}

	return (
		<>
			<ExportStudentDataDialog
				data={[student as any]}
				defaultFilename={`trich-ngang-quan-nhan-${student.fullName?.replace(' ', '_')}`}
				defaultValues={{
					unitName: '',
					underUnitName: user?.unit?.name ?? ''.toUpperCase()
				}}
				templType='StudentEnrollmentFormTempl'
				id='ExportStudentEnrollmentFormDialog'
			>
				<Button variant='outline'>
					<FileDown className='mr-2 h-4 w-4' />
					{t('actions.downloadSummary')}
				</Button>
			</ExportStudentDataDialog>

			{!readOnly && student.status === 'pending' && (
				<Button
					onClick={handleConfirmStudent}
					disabled={isUpdating}
					className='hidden bg-green-600 hover:bg-green-700'
				>
					<CheckCircle className='mr-2 h-4 w-4' />{' '}
					{t('actions.confirm')}
				</Button>
			)}

			{canEdit && (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>
							<UserPen className='mr-2 h-4 w-4' />
							{t('actions.edit')}
						</Button>
					</DialogTrigger>
					<DialogContent className='grid-cols-1 grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 lg:h-[85vh] lg:max-w-5xl'>
						<DialogHeader className='sr-only'>
							<DialogTitle>{t('actions.editTitle')}</DialogTitle>
							<DialogDescription>
								{t('actions.editDescription', {
									name: student.fullName
								})}
							</DialogDescription>
						</DialogHeader>
						<StudentEditForm
							student={student}
							onClose={() => setOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			)}
		</>
	)
}

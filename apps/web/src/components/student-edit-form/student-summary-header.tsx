import { CardHeader, CardTitle } from '@/components/ui/card'
import { getMediaUri } from '@/lib/utils'
import type { Student } from '@/types'
import { useStudentForm } from './student-form-context'

// Read-only summary of the saved record next to the avatar picker.
export default function StudentSummaryHeader({
	student
}: {
	student: Student
}) {
	const form = useStudentForm()
	const avatarUri = student.avatar ? student.avatar : 'avt.jpg'

	return (
		<CardHeader className='flex flex-col sm:flex-row items-center sm:items-start gap-4'>
			<form.AppField name='avatarFile'>
				{(field: any) => (
					<field.AvatarField
						alt={student.fullName}
						className='rounded-md'
						src={getMediaUri(avatarUri)}
						size='xl'
					/>
				)}
			</form.AppField>
			<div className='text-center sm:text-left'>
				<CardTitle className='text-xl'>{student.fullName}</CardTitle>
				<p className='text-muted-foreground'>
					Chức vụ: {student.position}
				</p>
				<p className='text-muted-foreground'>Cấp bậc: {student.rank}</p>
				<p className='text-muted-foreground'>
					Đơn vị: {student.unit?.name || 'Chưa có đơn vị'}
				</p>
			</div>
		</CardHeader>
	)
}

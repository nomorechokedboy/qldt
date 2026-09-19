import * as Tabs from '@radix-ui/react-tabs'
import {
	Award,
	GraduationCap,
	Shield,
	User,
	Users,
	type LucideIcon
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Student } from '@/types'
import EducationTab from './education-tab'
import FamilyTab from './family-tab'
import HistoryTab from './history-tab'
import MilitaryTab from './military-tab'
import PersonalTab from './personal-tab'
import { StudentFormProvider } from './student-form-context'
import StudentSummaryHeader from './student-summary-header'
import useStudentEditForm from './use-student-edit-form'

const TABS: {
	value: string
	label: string
	icon: LucideIcon
	Panel: ComponentType
}[] = [
	{
		value: 'personal',
		label: 'Thông tin cá nhân',
		icon: User,
		Panel: PersonalTab
	},
	{
		value: 'military',
		label: 'Quân sự & Chính trị',
		icon: Shield,
		Panel: MilitaryTab
	},
	{
		value: 'education',
		label: 'Học vấn & Kỹ năng',
		icon: GraduationCap,
		Panel: EducationTab
	},
	{ value: 'family', label: 'Gia đình', icon: Users, Panel: FamilyTab },
	{
		value: 'history',
		label: 'Lịch sử & Khác',
		icon: Award,
		Panel: HistoryTab
	}
]

interface StudentEditFormProps {
	student: Student
	onClose?: () => void
}

export default function StudentEditForm({
	student,
	onClose
}: StudentEditFormProps) {
	const { form, isPending } = useStudentEditForm(student, onClose)

	return (
		<StudentFormProvider value={form}>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className='w-full'
			>
				<Card>
					<StudentSummaryHeader student={student} />

					<CardContent>
						<Tabs.Root defaultValue='personal' className='w-full'>
							<Tabs.List className='flex border-b mb-4 space-x-4 px-2 overflow-x-auto'>
								{TABS.map(({ value, label, icon: Icon }) => (
									<Tabs.Trigger
										key={value}
										value={value}
										className='pb-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap'
									>
										<Icon className='h-4 w-4 inline mr-1' />
										{label}
									</Tabs.Trigger>
								))}
							</Tabs.List>

							{TABS.map(({ value, Panel }) => (
								<Tabs.Content key={value} value={value}>
									<Panel />
								</Tabs.Content>
							))}
						</Tabs.Root>

						<div className='flex justify-end mt-6 gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={onClose}
							>
								Hủy
							</Button>
							<Button type='submit' disabled={isPending}>
								{isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
							</Button>
						</div>
					</CardContent>
				</Card>
			</form>
		</StudentFormProvider>
	)
}

import { Heart, Users } from 'lucide-react'
import { useStore } from '@tanstack/react-form'
import ChildrenInfo from '@/components/children-info'
import SiblingInfo from '@/components/sibling-info'
import { FieldGrid, FormSection } from './form-section'
import type { StudentFormValues } from './form-values'
import StudentField from './student-field'
import { useStudentForm } from './student-form-context'

function ParentSection({
	title,
	tone,
	prefix
}: {
	title: string
	tone: 'purple' | 'pink'
	prefix: 'father' | 'mother'
}) {
	return (
		<FormSection title={title} icon={Users} tone={tone}>
			<FieldGrid columns={1}>
				<StudentField name={`${prefix}Name`} label='Họ tên' />
				<StudentField
					name={`${prefix}Dob`}
					label='Ngày sinh'
					kind='date'
				/>
				<StudentField name={`${prefix}Job`} label='Nghề nghiệp' />
				<StudentField
					name={`${prefix}PhoneNumber`}
					label='Số điện thoại'
				/>
			</FieldGrid>
		</FormSection>
	)
}

export default function FamilyTab() {
	const form = useStudentForm()
	const isMarried = useStore(
		form.store,
		(s: { values: StudentFormValues }) => s.values.isMarried
	)
	const childCount = useStore(
		form.store,
		(s: { values: StudentFormValues }) =>
			s.values.childrenInfos?.length ?? 0
	)
	const siblingCount = useStore(
		form.store,
		(s: { values: StudentFormValues }) => s.values.siblings?.length ?? 0
	)

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<ParentSection title='Cha' tone='purple' prefix='father' />
				<ParentSection title='Mẹ' tone='pink' prefix='mother' />
			</div>

			<FormSection title='Hôn nhân' icon={Heart} tone='orange'>
				<FieldGrid>
					<StudentField
						name='isMarried'
						label='Đã kết hôn'
						kind='switch'
					/>
					{isMarried && (
						<>
							<StudentField
								name='spouseName'
								label='Họ tên Vợ/Chồng'
							/>
							<StudentField
								name='spouseDob'
								label='Ngày sinh'
								kind='date'
							/>
							<StudentField
								name='spouseJob'
								label='Nghề nghiệp'
							/>
							<StudentField
								name='spousePhoneNumber'
								label='SĐT Vợ/Chồng'
							/>
						</>
					)}
				</FieldGrid>
			</FormSection>

			<FormSection title={`Con (${childCount})`} icon={Users} tone='cyan'>
				<ChildrenInfo form={form} />
			</FormSection>

			<FormSection
				title={`Anh chị em ruột (${siblingCount})`}
				icon={Users}
				tone='teal'
			>
				<SiblingInfo form={form} />
			</FormSection>

			<FormSection title='Hoàn cảnh gia đình' icon={Users} tone='indigo'>
				<FieldGrid>
					<StudentField
						name='familyBackground'
						label='Hoàn cảnh gia đình'
					/>
					<StudentField
						name='familySize'
						label='Số lượng thành viên'
						kind='number'
					/>
					<StudentField name='familyBirthOrder' label='Con thứ mấy' />
				</FieldGrid>
			</FormSection>
		</div>
	)
}

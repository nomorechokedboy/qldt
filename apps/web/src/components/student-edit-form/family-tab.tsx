import { useStore } from '@tanstack/react-form'
import ChildrenInfo from '@/components/children-info'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import SiblingInfo from '@/components/sibling-info'
import type { StudentFormValues } from './form-values'
import StudentField from './student-field'
import { useStudentForm } from './student-form-context'

function ParentSection({
	title,
	prefix
}: {
	title: string
	prefix: 'father' | 'mother'
}) {
	return (
		<RecordSection title={title}>
			<RecordGrid columns={1}>
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
			</RecordGrid>
		</RecordSection>
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
		<StepBody>
			<RecordGrid>
				<ParentSection title='Cha' prefix='father' />
				<ParentSection title='Mẹ' prefix='mother' />
			</RecordGrid>

			<RecordSection title='Vợ/chồng'>
				<RecordGrid>
					<StudentField
						name='isMarried'
						label='Đã kết hôn'
						kind='switch'
					/>
					{isMarried && (
						<>
							<StudentField
								name='spouseName'
								label='Họ tên vợ/chồng'
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
								label='SĐT vợ/chồng'
							/>
						</>
					)}
				</RecordGrid>
			</RecordSection>

			<RecordSection title={`Con (${childCount})`}>
				<ChildrenInfo form={form} />
			</RecordSection>

			<RecordSection title={`Anh, chị, em ruột (${siblingCount})`}>
				<SiblingInfo form={form} />
			</RecordSection>

			<RecordSection title='Hoàn cảnh gia đình'>
				<RecordGrid columns={3}>
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
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

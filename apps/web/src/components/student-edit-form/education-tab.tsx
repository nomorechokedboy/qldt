import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import { eduLevelOptions } from '@/data/education-levels'
import StudentField from './student-field'

export default function EducationTab() {
	return (
		<StepBody>
			<RecordSection title='Học vấn'>
				<RecordGrid columns={3}>
					<StudentField name='schoolName' label='Trường' />
					<StudentField name='major' label='Chuyên ngành' />
					<StudentField
						name='educationLevel'
						label='Trình độ'
						kind='select'
						options={eduLevelOptions}
					/>
					<StudentField
						name='isGraduated'
						label='Đã tốt nghiệp'
						kind='switch'
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Kỹ năng và chính sách'>
				<RecordGrid columns={3}>
					<StudentField name='talent' label='Sở trường' />
					<StudentField name='shortcoming' label='Sở đoản' />
					<StudentField
						name='policyBeneficiaryGroup'
						label='Đối tượng chính sách'
					/>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

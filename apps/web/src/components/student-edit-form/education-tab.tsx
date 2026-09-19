import { Award, GraduationCap } from 'lucide-react'
import { eduLevelOptions } from '@/data/education-levels'
import { FieldGrid, FormSection } from './form-section'
import StudentField from './student-field'

export default function EducationTab() {
	return (
		<div className='space-y-6'>
			<FormSection title='Học vấn' icon={GraduationCap} tone='yellow'>
				<FieldGrid>
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
				</FieldGrid>
			</FormSection>

			<FormSection
				title='Kỹ năng & Chính sách'
				icon={Award}
				tone='emerald'
			>
				<FieldGrid>
					<StudentField name='talent' label='Sở trường' />
					<StudentField name='shortcoming' label='Sở đoản' />
					<StudentField
						name='policyBeneficiaryGroup'
						label='Đối tượng chính sách'
					/>
				</FieldGrid>
			</FormSection>
		</div>
	)
}

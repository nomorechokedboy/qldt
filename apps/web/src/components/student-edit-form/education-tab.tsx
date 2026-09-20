import { useTranslation } from 'react-i18next'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import { eduLevelOptions } from '@/data/education-levels'
import StudentField from './student-field'

export default function EducationTab() {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<RecordSection title={t('sections.education')}>
				<RecordGrid columns={3}>
					<StudentField
						name='schoolName'
						label={t('recordFields.schoolName')}
					/>
					<StudentField
						name='major'
						label={t('recordFields.major')}
					/>
					<StudentField
						name='educationLevel'
						label={t('recordFields.educationLevel')}
						kind='select'
						options={eduLevelOptions}
					/>
					<StudentField
						name='isGraduated'
						label={t('fields.graduated')}
						kind='switch'
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.skillsAndPolicy')}>
				<RecordGrid columns={3}>
					<StudentField name='talent' label={t('fields.talent')} />
					<StudentField
						name='shortcoming'
						label={t('fields.shortcoming')}
					/>
					<StudentField
						name='policyBeneficiaryGroup'
						label={t('fields.policyGroup')}
					/>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

import { useTranslation } from 'react-i18next'
import PlacePickerFields from '@/components/place-picker-fields'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import { EhtnicOptions } from '@/data/ethnicities'
import { religionOptions } from '@/data/religions'
import StudentField from './student-field'
import { useStudentForm } from './student-form-context'

export default function PersonalTab() {
	const form = useStudentForm()
	const { t } = useTranslation('student')

	return (
		<StepBody>
			<RecordSection title={t('sections.identity')}>
				<RecordGrid>
					<StudentField
						name='fullName'
						label={t('fields.fullName')}
					/>
					<StudentField
						name='studentId'
						label={t('recordFields.studentId')}
					/>
					<StudentField
						name='dob'
						label={t('fields.dob')}
						kind='date'
					/>
					<StudentField name='phone' label={t('fields.phone')} />
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.ethnicityReligion')}>
				<RecordGrid>
					<StudentField
						name='ethnic'
						label={t('fields.ethnic')}
						kind='select'
						options={EhtnicOptions}
					/>
					<StudentField
						name='religion'
						label={t('fields.religion')}
						kind='select'
						options={religionOptions}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.places')}>
				<RecordGrid>
					<div className='space-y-4'>
						<PlacePickerFields form={form} prefix='birthPlace' />
					</div>
					<div className='space-y-4'>
						<PlacePickerFields form={form} prefix='address' />
					</div>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

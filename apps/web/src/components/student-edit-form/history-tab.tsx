import { useTranslation } from 'react-i18next'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import StudentField from './student-field'

export default function HistoryTab() {
	const { t } = useTranslation('student')
	return (
		<StepBody>
			<RecordSection title={t('sections.history')}>
				<RecordGrid>
					<StudentField
						name='achievement'
						label={t('recordFields.achievement')}
					/>
					<StudentField
						name='disciplinaryHistory'
						label={t('fields.discipline')}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection
				title={t('sections.contact')}
				hint={t('sections.contactHint')}
			>
				<RecordGrid columns={3}>
					<StudentField
						name='contactPerson.name'
						label={t('fields.name')}
					/>
					<StudentField
						name='contactPerson.phoneNumber'
						label={t('fields.phone')}
					/>
					<StudentField
						name='contactPerson.address'
						label={t('fields.address')}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.documents')}>
				<RecordGrid columns={1}>
					<StudentField
						name='relatedDocumentations'
						label={t('fields.documents')}
					/>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

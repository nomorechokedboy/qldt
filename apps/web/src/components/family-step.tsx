import { useTranslation } from 'react-i18next'
import ChildrenInfo from './children-info'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export interface FamilyStepProps {
	form: any
}

export default function FamilyStep({ form }: FamilyStepProps) {
	const { t } = useTranslation('student')

	return (
		<StepBody>
			<RecordSection
				title={t('sections.spouse')}
				hint={t('sections.spouseHint')}
			>
				<RecordGrid>
					<form.AppField name='spouseName'>
						{(field: any) => (
							<field.TextField label={t('create.spouseName')} />
						)}
					</form.AppField>
					<form.AppField name='spouseDob'>
						{(field: any) => (
							<field.DatePicker label={t('create.spouseDob')} />
						)}
					</form.AppField>
					<form.AppField name='spousePhoneNumber'>
						{(field: any) => (
							<field.TextField label={t('create.spousePhone')} />
						)}
					</form.AppField>
					<form.AppField name='spouseJob'>
						{(field: any) => (
							<field.TextField label={t('create.spouseJob')} />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.children')}>
				<ChildrenInfo form={form} />
			</RecordSection>
		</StepBody>
	)
}

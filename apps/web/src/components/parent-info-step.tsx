import { useTranslation } from 'react-i18next'
import SiblingInfo from './sibling-info'
import { RecordGrid, RecordSection, StepBody } from './record-section'

function ParentColumn({
	form,
	prefix,
	labels
}: {
	form: any
	prefix: 'father' | 'mother'
	labels: { name: string; dob: string; job: string; phone: string }
}) {
	const { t } = useTranslation('student')

	return (
		<RecordSection title={t(`sections.${prefix}`)}>
			<RecordGrid columns={1}>
				<form.AppField name={`${prefix}Name`}>
					{(field: any) => <field.TextField label={labels.name} />}
				</form.AppField>
				<form.AppField name={`${prefix}Dob`}>
					{(field: any) => <field.DatePicker label={labels.dob} />}
				</form.AppField>
				<form.AppField name={`${prefix}Job`}>
					{(field: any) => <field.TextField label={labels.job} />}
				</form.AppField>
				<form.AppField name={`${prefix}PhoneNumber`}>
					{(field: any) => <field.TextField label={labels.phone} />}
				</form.AppField>
			</RecordGrid>
		</RecordSection>
	)
}

export default function ParentInfoStep({ form }: { form: any }) {
	const { t } = useTranslation('student')

	return (
		<StepBody>
			<RecordSection title={t('sections.household')}>
				<RecordGrid>
					<form.AppField name='familySize'>
						{(field: any) => (
							<field.TextField
								type='number'
								label={t('create.familySize')}
							/>
						)}
					</form.AppField>
					<form.AppField name='familyBirthOrder'>
						{(field: any) => (
							<field.TextField label={t('create.birthOrder')} />
						)}
					</form.AppField>
				</RecordGrid>
				<div className='mt-4'>
					<form.AppField name='familyBackground'>
						{(field: any) => (
							<field.TextArea
								label={t('create.familyBackground')}
							/>
						)}
					</form.AppField>
				</div>
			</RecordSection>

			<RecordGrid>
				<ParentColumn
					form={form}
					prefix='father'
					labels={{
						name: t('create.fatherName'),
						dob: t('create.fatherDob'),
						job: t('create.fatherJob'),
						phone: t('create.fatherPhone')
					}}
				/>
				<ParentColumn
					form={form}
					prefix='mother'
					labels={{
						name: t('create.motherName'),
						dob: t('create.motherDob'),
						job: t('create.motherJob'),
						phone: t('create.motherPhone')
					}}
				/>
			</RecordGrid>

			<RecordSection title={t('sections.siblings')}>
				<SiblingInfo form={form} />
			</RecordSection>
		</StepBody>
	)
}

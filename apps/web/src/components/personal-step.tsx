import { useTranslation } from 'react-i18next'
import { EhtnicOptions } from '@/data/ethnicities'
import { religionOptions } from '@/data/religions'
import { eduLevelOptions } from '@/data/education-levels'
import useUnitOptions from '@/hooks/useUnitOptions'
import PlacePickerFields from '@/components/place-picker-fields'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export default function PersonalStep({ form }: { form: any }) {
	const { t } = useTranslation('student')
	const { options: unitOptions } = useUnitOptions()

	return (
		<StepBody>
			<RecordSection title={t('sections.identity')}>
				<RecordGrid>
					<form.AppField name='fullName'>
						{(field: any) => (
							<field.TextField label={t('fields.fullName')} />
						)}
					</form.AppField>
					<form.AppField name='studentId'>
						{(field: any) => (
							<field.TextField label={t('create.studentId')} />
						)}
					</form.AppField>
					<form.AppField name='dob'>
						{(field: any) => (
							<field.DatePicker
								label={t('fields.dob')}
								placeholder={t('create.datePlaceholder')}
							/>
						)}
					</form.AppField>
					<form.AppField name='phone'>
						{(field: any) => (
							<field.TextField
								label={t('fields.phone')}
								placeholder='0912 345 678'
							/>
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.workUnit')}>
				<RecordGrid>
					<form.AppField name='unitId'>
						{(field: any) => (
							<field.Select
								values={unitOptions}
								label={t('fields.unit')}
								placeholder={t('create.chooseUnit')}
							/>
						)}
					</form.AppField>
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

			<RecordSection title={t('sections.ethnicityReligionEducation')}>
				<RecordGrid>
					<form.AppField name='ethnic'>
						{(field: any) => (
							<field.Combobox
								values={EhtnicOptions}
								label={t('fields.ethnic')}
								placeholder={t('create.chooseEthnic')}
								className=''
							/>
						)}
					</form.AppField>
					<form.AppField name='religion'>
						{(field: any) => (
							<field.Select
								values={religionOptions}
								label={t('fields.religion')}
								placeholder={t('create.chooseReligion')}
								defaultValue={religionOptions[0].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='educationLevel'>
						{(field: any) => (
							<field.Select
								label={t('create.educationLevel')}
								placeholder={t('create.chooseEducation')}
								values={eduLevelOptions}
								defaultValue={eduLevelOptions[5].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='schoolName'>
						{(field: any) => (
							<field.TextField label={t('create.schoolName')} />
						)}
					</form.AppField>
					<form.AppField name='major'>
						{(field: any) => (
							<field.TextField label={t('create.major')} />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

import { useTranslation } from 'react-i18next'
import { rankOptions } from '@/data/ranks'
import usePositionOptions from '@/hooks/usePositionOptions'
import { activityStatusOptions } from '@/data/activity-statuses'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export default function MilitaryStep({ form }: { form: any }) {
	const { t } = useTranslation('student')
	const { t: tStats } = useTranslation('stats')
	const positionOptions = usePositionOptions()

	return (
		<StepBody>
			<RecordSection title={t('sections.military')}>
				<RecordGrid>
					<form.AppField name='rank'>
						{(field: any) => (
							<field.Select
								values={rankOptions}
								label={t('fields.rank')}
								placeholder={t('create.chooseRank')}
								defaultValue={rankOptions[0].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='positionId'>
						{(field: any) => (
							<field.Select
								values={positionOptions}
								label={t('fields.position')}
								placeholder={t('create.choosePosition')}
							/>
						)}
					</form.AppField>
					<form.AppField name='enlistmentPeriod'>
						{(field: any) => (
							<field.TextField
								label={t('fields.enlistmentDate')}
							/>
						)}
					</form.AppField>
					<form.AppField name='activityStatus'>
						{(field: any) => (
							<field.Select
								values={activityStatusOptions}
								label={t('fields.activityStatus')}
								placeholder={t('create.chooseStatus')}
								defaultValue='serving'
							/>
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.politics')}>
				<RecordGrid>
					<form.AppField name='politicalOrg'>
						{(field: any) => (
							<field.Select
								label={t('create.politicalOrg')}
								values={[
									{
										label: tStats('politicalOrg.hcyu'),
										value: 'hcyu'
									},
									{
										label: tStats('politicalOrg.cpv'),
										value: 'cpv'
									}
								]}
							/>
						)}
					</form.AppField>
					<form.AppField name='politicalOrgOfficialDate'>
						{(field: any) => (
							<field.DatePicker
								label={t('fields.youthJoinDate')}
							/>
						)}
					</form.AppField>
					<form.AppField name='cpvId'>
						{(field: any) => (
							<field.TextField label={t('fields.cpvId')} />
						)}
					</form.AppField>
					<form.AppField name='cpvOfficialAt'>
						{(field: any) => (
							<field.DatePicker
								label={t('fields.partyJoinDate')}
							/>
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection
				title={t('sections.contact')}
				hint={t('sections.contactHint')}
			>
				<RecordGrid columns={3}>
					<form.AppField name='contactPerson.name'>
						{(field: any) => (
							<field.TextField label={t('create.contactName')} />
						)}
					</form.AppField>
					<form.AppField name='contactPerson.phoneNumber'>
						{(field: any) => (
							<field.TextField label={t('fields.phone')} />
						)}
					</form.AppField>
					<form.AppField name='contactPerson.address'>
						{(field: any) => (
							<field.TextField label={t('fields.address')} />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.remarks')}>
				<RecordGrid>
					<form.AppField name='talent'>
						{(field: any) => (
							<field.TextArea label={t('fields.talent')} />
						)}
					</form.AppField>
					<form.AppField name='shortcoming'>
						{(field: any) => (
							<field.TextArea label={t('fields.shortcoming')} />
						)}
					</form.AppField>
					<form.AppField name='achievement'>
						{(field: any) => (
							<field.TextArea label={t('create.achievement')} />
						)}
					</form.AppField>
					<form.AppField name='disciplinaryHistory'>
						{(field: any) => (
							<field.TextArea label={t('fields.discipline')} />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

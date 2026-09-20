import { useTranslation } from 'react-i18next'
import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import { activityStatusOptions } from '@/data/activity-statuses'
import { politicalOptions } from '@/data/political-status'
import { rankOptions } from '@/data/ranks'
import usePositionOptions from '@/hooks/usePositionOptions'
import useUnitOptions from '@/hooks/useUnitOptions'
import StudentField from './student-field'

export default function MilitaryTab() {
	const { t } = useTranslation('student')
	const positionOptions = usePositionOptions()
	const { options: unitOptions } = useUnitOptions()

	return (
		<StepBody>
			<RecordSection title={t('sections.military')}>
				<RecordGrid columns={3}>
					<StudentField
						name='rank'
						label={t('fields.rank')}
						kind='select'
						options={rankOptions}
					/>
					<StudentField
						name='positionId'
						label={t('fields.position')}
						kind='select'
						options={positionOptions}
					/>
					<StudentField
						name='unitId'
						label={t('fields.unit')}
						kind='select'
						options={unitOptions}
					/>
					<StudentField
						name='enlistmentPeriod'
						label={t('fields.enlistmentDate')}
					/>
					<StudentField
						name='previousUnit'
						label={t('fields.previousUnit')}
					/>
					<StudentField
						name='previousPosition'
						label={t('fields.previousPosition')}
					/>
					<StudentField
						name='activityStatus'
						label={t('fields.activityStatus')}
						kind='select'
						options={activityStatusOptions}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title={t('sections.politics')}>
				<RecordGrid columns={3}>
					<StudentField
						name='politicalOrg'
						label={t('recordFields.politicalOrg')}
						kind='select'
						options={politicalOptions}
					/>
					<StudentField
						name='politicalOrgOfficialDate'
						label={t('fields.youthJoinDate')}
						kind='date'
					/>
					<StudentField
						name='cpvOfficialAt'
						label={t('fields.partyJoinDate')}
						kind='date'
					/>
					<StudentField name='cpvId' label={t('fields.cpvId')} />
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

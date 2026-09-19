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
	const positionOptions = usePositionOptions()
	const { options: unitOptions } = useUnitOptions()

	return (
		<StepBody>
			<RecordSection title='Quân sự'>
				<RecordGrid columns={3}>
					<StudentField
						name='rank'
						label='Cấp bậc'
						kind='select'
						options={rankOptions}
					/>
					<StudentField
						name='positionId'
						label='Chức vụ'
						kind='select'
						options={positionOptions}
					/>
					<StudentField
						name='unitId'
						label='Đơn vị'
						kind='select'
						options={unitOptions}
					/>
					<StudentField
						name='enlistmentPeriod'
						label='Ngày nhập ngũ'
					/>
					<StudentField name='previousUnit' label='Đơn vị cũ' />
					<StudentField name='previousPosition' label='Chức vụ cũ' />
					<StudentField
						name='activityStatus'
						label='Tình trạng'
						kind='select'
						options={activityStatusOptions}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Chính trị'>
				<RecordGrid columns={3}>
					<StudentField
						name='politicalOrg'
						label='Tổ chức'
						kind='select'
						options={politicalOptions}
					/>
					<StudentField
						name='politicalOrgOfficialDate'
						label='Ngày vào Đoàn'
						kind='date'
					/>
					<StudentField
						name='cpvOfficialAt'
						label='Ngày vào Đảng'
						kind='date'
					/>
					<StudentField name='cpvId' label='Số thẻ Đảng' />
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

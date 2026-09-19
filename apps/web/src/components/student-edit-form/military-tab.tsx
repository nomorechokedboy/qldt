import { Shield, Star } from 'lucide-react'
import { activityStatusOptions } from '@/data/activity-statuses'
import { politicalOptions } from '@/data/political-status'
import { rankOptions } from '@/data/ranks'
import usePositionOptions from '@/hooks/usePositionOptions'
import useUnitOptions from '@/hooks/useUnitOptions'
import { FieldGrid, FormSection } from './form-section'
import StudentField from './student-field'

export default function MilitaryTab() {
	const positionOptions = usePositionOptions()
	const { options: unitOptions } = useUnitOptions()

	return (
		<div className='space-y-6'>
			<FormSection title='Quân sự' icon={Shield} tone='green'>
				<FieldGrid>
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
				</FieldGrid>
			</FormSection>

			<FormSection title='Chính trị' icon={Star} tone='yellow'>
				<FieldGrid>
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
				</FieldGrid>
			</FormSection>
		</div>
	)
}

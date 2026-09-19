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

	return (
		<StepBody>
			<RecordSection title='Họ tên và nhận dạng'>
				<RecordGrid>
					<StudentField name='fullName' label='Họ và tên' />
					<StudentField name='studentId' label='Mã quân nhân' />
					<StudentField name='dob' label='Ngày sinh' kind='date' />
					<StudentField name='phone' label='Số điện thoại' />
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Dân tộc và tôn giáo'>
				<RecordGrid>
					<StudentField
						name='ethnic'
						label='Dân tộc'
						kind='select'
						options={EhtnicOptions}
					/>
					<StudentField
						name='religion'
						label='Tôn giáo'
						kind='select'
						options={religionOptions}
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Quê quán và trú quán'>
				<RecordGrid>
					<div className='space-y-4'>
						<PlacePickerFields
							form={form}
							prefix='birthPlace'
							label='quê quán'
						/>
					</div>
					<div className='space-y-4'>
						<PlacePickerFields
							form={form}
							prefix='address'
							label='trú quán'
						/>
					</div>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

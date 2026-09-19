import { User } from 'lucide-react'
import PlacePickerFields from '@/components/place-picker-fields'
import { EhtnicOptions } from '@/data/ethnicities'
import { religionOptions } from '@/data/religions'
import { FieldGrid, FormSection } from './form-section'
import StudentField from './student-field'
import { useStudentForm } from './student-form-context'

export default function PersonalTab() {
	const form = useStudentForm()

	return (
		<FormSection title='Thông tin cá nhân' icon={User} tone='primary'>
			<FieldGrid columns={4}>
				<StudentField name='fullName' label='Họ và tên' />
				<StudentField name='studentId' label='Mã quân nhân' />
				<StudentField name='dob' label='Ngày sinh' kind='date' />
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
				<StudentField name='phone' label='Số điện thoại' />
			</FieldGrid>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4'>
				<div className='space-y-3'>
					<PlacePickerFields
						form={form}
						prefix='birthPlace'
						label='quê quán'
					/>
				</div>
				<div className='space-y-3'>
					<PlacePickerFields
						form={form}
						prefix='address'
						label='trú quán'
					/>
				</div>
			</div>
		</FormSection>
	)
}

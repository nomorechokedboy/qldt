import { Award, FileText, Phone } from 'lucide-react'
import { FieldGrid, FormSection } from './form-section'
import StudentField from './student-field'

export default function HistoryTab() {
	return (
		<div className='space-y-6'>
			<FormSection title='Lịch sử' icon={Award} tone='amber'>
				<FieldGrid columns={1}>
					<StudentField name='achievement' label='Khen thưởng' />
					<StudentField name='disciplinaryHistory' label='Kỷ luật' />
				</FieldGrid>
			</FormSection>

			<FormSection title='Người báo tin' icon={Phone} tone='rose'>
				<FieldGrid>
					<StudentField name='contactPerson.name' label='Họ tên' />
					<StudentField
						name='contactPerson.phoneNumber'
						label='Số điện thoại'
					/>
					<StudentField
						name='contactPerson.address'
						label='Địa chỉ'
					/>
				</FieldGrid>
			</FormSection>

			<FormSection title='Tài liệu' icon={FileText} tone='slate'>
				<FieldGrid columns={1}>
					<StudentField
						name='relatedDocumentations'
						label='Hồ sơ đi kèm'
					/>
				</FieldGrid>
			</FormSection>
		</div>
	)
}

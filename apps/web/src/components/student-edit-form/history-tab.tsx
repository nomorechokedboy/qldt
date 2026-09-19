import {
	RecordGrid,
	RecordSection,
	StepBody
} from '@/components/record-section'
import StudentField from './student-field'

export default function HistoryTab() {
	return (
		<StepBody>
			<RecordSection title='Lịch sử'>
				<RecordGrid>
					<StudentField name='achievement' label='Khen thưởng' />
					<StudentField name='disciplinaryHistory' label='Kỷ luật' />
				</RecordGrid>
			</RecordSection>

			<RecordSection
				title='Người báo tin'
				hint='Người cần liên lạc khi có việc của quân nhân.'
			>
				<RecordGrid columns={3}>
					<StudentField name='contactPerson.name' label='Họ tên' />
					<StudentField
						name='contactPerson.phoneNumber'
						label='Số điện thoại'
					/>
					<StudentField
						name='contactPerson.address'
						label='Địa chỉ'
					/>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Tài liệu'>
				<RecordGrid columns={1}>
					<StudentField
						name='relatedDocumentations'
						label='Hồ sơ đi kèm'
					/>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

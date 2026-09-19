import ChildrenInfo from './children-info'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export interface FamilyStepProps {
	form: any
}

export default function FamilyStep({ form }: FamilyStepProps) {
	return (
		<StepBody>
			<RecordSection
				title='Vợ/chồng'
				hint='Bỏ trống nếu quân nhân chưa kết hôn.'
			>
				<RecordGrid>
					<form.AppField name='spouseName'>
						{(field: any) => (
							<field.TextField label='Tên vợ/chồng' />
						)}
					</form.AppField>
					<form.AppField name='spouseDob'>
						{(field: any) => (
							<field.DatePicker label='Ngày sinh của vợ/chồng' />
						)}
					</form.AppField>
					<form.AppField name='spousePhoneNumber'>
						{(field: any) => (
							<field.TextField label='Số điện thoại vợ/chồng' />
						)}
					</form.AppField>
					<form.AppField name='spouseJob'>
						{(field: any) => (
							<field.TextField label='Nghề nghiệp vợ/chồng' />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Con'>
				<ChildrenInfo form={form} />
			</RecordSection>
		</StepBody>
	)
}

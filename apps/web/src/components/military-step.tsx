import { rankOptions } from '@/data/ranks'
import usePositionOptions from '@/hooks/usePositionOptions'
import { activityStatusOptions } from '@/data/activity-statuses'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export default function MilitaryStep({ form }: { form: any }) {
	const positionOptions = usePositionOptions()

	return (
		<StepBody>
			<RecordSection title='Quân sự'>
				<RecordGrid>
					<form.AppField name='rank'>
						{(field: any) => (
							<field.Select
								values={rankOptions}
								label='Cấp bậc'
								placeholder='Chọn cấp bậc'
								defaultValue={rankOptions[0].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='positionId'>
						{(field: any) => (
							<field.Select
								values={positionOptions}
								label='Chức vụ'
								placeholder='Chọn chức vụ'
							/>
						)}
					</form.AppField>
					<form.AppField name='enlistmentPeriod'>
						{(field: any) => (
							<field.TextField label='Ngày nhập ngũ' />
						)}
					</form.AppField>
					<form.AppField name='activityStatus'>
						{(field: any) => (
							<field.Select
								values={activityStatusOptions}
								label='Tình trạng'
								placeholder='Chọn tình trạng'
								defaultValue='serving'
							/>
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Chính trị'>
				<RecordGrid>
					<form.AppField name='politicalOrg'>
						{(field: any) => (
							<field.Select
								label='Đoàn/Đảng'
								values={[
									{ label: 'Đoàn', value: 'hcyu' },
									{ label: 'Đảng', value: 'cpv' }
								]}
							/>
						)}
					</form.AppField>
					<form.AppField name='politicalOrgOfficialDate'>
						{(field: any) => (
							<field.DatePicker label='Ngày vào Đoàn' />
						)}
					</form.AppField>
					<form.AppField name='cpvId'>
						{(field: any) => (
							<field.TextField label='Số thẻ Đảng' />
						)}
					</form.AppField>
					<form.AppField name='cpvOfficialAt'>
						{(field: any) => (
							<field.DatePicker label='Ngày vào Đảng' />
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection
				title='Người báo tin'
				hint='Người cần liên lạc khi có việc của quân nhân.'
			>
				<RecordGrid columns={3}>
					<form.AppField name='contactPerson.name'>
						{(field: any) => (
							<field.TextField label='Khi cần báo tin cho' />
						)}
					</form.AppField>
					<form.AppField name='contactPerson.phoneNumber'>
						{(field: any) => (
							<field.TextField label='Số điện thoại' />
						)}
					</form.AppField>
					<form.AppField name='contactPerson.address'>
						{(field: any) => <field.TextField label='Địa chỉ' />}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Nhận xét'>
				<RecordGrid>
					<form.AppField name='talent'>
						{(field: any) => <field.TextArea label='Sở trường' />}
					</form.AppField>
					<form.AppField name='shortcoming'>
						{(field: any) => <field.TextArea label='Sở đoản' />}
					</form.AppField>
					<form.AppField name='achievement'>
						{(field: any) => <field.TextArea label='Thành tích' />}
					</form.AppField>
					<form.AppField name='disciplinaryHistory'>
						{(field: any) => <field.TextArea label='Kỷ luật' />}
					</form.AppField>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

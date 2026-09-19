import SiblingInfo from './sibling-info'
import { RecordGrid, RecordSection, StepBody } from './record-section'

function ParentColumn({
	form,
	prefix,
	title,
	labels
}: {
	form: any
	prefix: 'father' | 'mother'
	title: string
	labels: { name: string; dob: string; job: string; phone: string }
}) {
	return (
		<RecordSection title={title}>
			<RecordGrid columns={1}>
				<form.AppField name={`${prefix}Name`}>
					{(field: any) => <field.TextField label={labels.name} />}
				</form.AppField>
				<form.AppField name={`${prefix}Dob`}>
					{(field: any) => <field.DatePicker label={labels.dob} />}
				</form.AppField>
				<form.AppField name={`${prefix}Job`}>
					{(field: any) => <field.TextField label={labels.job} />}
				</form.AppField>
				<form.AppField name={`${prefix}PhoneNumber`}>
					{(field: any) => <field.TextField label={labels.phone} />}
				</form.AppField>
			</RecordGrid>
		</RecordSection>
	)
}

export default function ParentInfoStep({ form }: { form: any }) {
	return (
		<StepBody>
			<RecordSection title='Gia cảnh'>
				<RecordGrid>
					<form.AppField name='familySize'>
						{(field: any) => (
							<field.TextField
								type='number'
								label='Số thành viên trong gia đình'
							/>
						)}
					</form.AppField>
					<form.AppField name='familyBirthOrder'>
						{(field: any) => (
							<field.TextField label='Con thứ bao nhiêu' />
						)}
					</form.AppField>
				</RecordGrid>
				<div className='mt-4'>
					<form.AppField name='familyBackground'>
						{(field: any) => (
							<field.TextArea label='Sơ lược hoàn cảnh gia đình' />
						)}
					</form.AppField>
				</div>
			</RecordSection>

			<RecordGrid>
				<ParentColumn
					form={form}
					prefix='father'
					title='Cha'
					labels={{
						name: 'Tên cha',
						dob: 'Ngày sinh của cha',
						job: 'Nghề nghiệp cha',
						phone: 'Số điện thoại cha'
					}}
				/>
				<ParentColumn
					form={form}
					prefix='mother'
					title='Mẹ'
					labels={{
						name: 'Tên mẹ',
						dob: 'Ngày sinh mẹ',
						job: 'Nghề nghiệp mẹ',
						phone: 'Số điện thoại mẹ'
					}}
				/>
			</RecordGrid>

			<RecordSection title='Anh, chị, em ruột'>
				<SiblingInfo form={form} />
			</RecordSection>
		</StepBody>
	)
}

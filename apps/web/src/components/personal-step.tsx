import { EhtnicOptions } from '@/data/ethnicities'
import { religionOptions } from '@/data/religions'
import { eduLevelOptions } from '@/data/education-levels'
import useUnitOptions from '@/hooks/useUnitOptions'
import PlacePickerFields from '@/components/place-picker-fields'
import { RecordGrid, RecordSection, StepBody } from './record-section'

export default function PersonalStep({ form }: { form: any }) {
	const { options: unitOptions } = useUnitOptions()

	return (
		<StepBody>
			<RecordSection title='Họ tên và nhận dạng'>
				<RecordGrid>
					<form.AppField name='fullName'>
						{(field: any) => <field.TextField label='Họ và tên' />}
					</form.AppField>
					<form.AppField name='studentId'>
						{(field: any) => (
							<field.TextField label='Mã số quân nhân' />
						)}
					</form.AppField>
					<form.AppField name='dob'>
						{(field: any) => (
							<field.DatePicker
								label='Ngày sinh'
								placeholder='Ngày/tháng/năm'
							/>
						)}
					</form.AppField>
					<form.AppField name='phone'>
						{(field: any) => (
							<field.TextField
								label='Số điện thoại'
								placeholder='0912 345 678'
							/>
						)}
					</form.AppField>
				</RecordGrid>
			</RecordSection>

			<RecordSection title='Đơn vị công tác'>
				<RecordGrid>
					<form.AppField name='unitId'>
						{(field: any) => (
							<field.Select
								values={unitOptions}
								label='Đơn vị'
								placeholder='Chọn đơn vị'
							/>
						)}
					</form.AppField>
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

			<RecordSection title='Dân tộc, tôn giáo và học vấn'>
				<RecordGrid>
					<form.AppField name='ethnic'>
						{(field: any) => (
							<field.Combobox
								values={EhtnicOptions}
								label='Dân tộc'
								placeholder='Chọn dân tộc'
								defaultValue={eduLevelOptions[0].value}
								className=''
							/>
						)}
					</form.AppField>
					<form.AppField name='religion'>
						{(field: any) => (
							<field.Select
								values={religionOptions}
								label='Tôn giáo'
								placeholder='Chọn tôn giáo'
								defaultValue={religionOptions[0].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='educationLevel'>
						{(field: any) => (
							<field.Select
								label='Trình độ học vấn'
								placeholder='Chọn trình độ học vấn'
								values={eduLevelOptions}
								defaultValue={eduLevelOptions[5].value}
							/>
						)}
					</form.AppField>
					<form.AppField name='schoolName'>
						{(field: any) => <field.TextField label='Tên trường' />}
					</form.AppField>
					<form.AppField name='major'>
						{(field: any) => <field.TextField label='Ngành' />}
					</form.AppField>
				</RecordGrid>
			</RecordSection>
		</StepBody>
	)
}

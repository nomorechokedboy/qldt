import { EhtnicOptions } from '@/data/ethnicities'
import { religionOptions } from '@/data/religions'
import { eduLevelOptions } from '@/data/education-levels'
import useClassData from '@/hooks/useClasses'
import useUnitsData from '@/hooks/useUnitsData'
import { unitLevelLabels } from '@/data/unit-levels'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useMemo, useState } from 'react'

export default function PersonalStep({ form }: { form: any }) {
	const { data: classes = [] } = useClassData()
	const { data: units = [] } = useUnitsData()
	const [membershipType, setMembershipType] = useState<'class' | 'unit'>(
		form.state.values.unitId ? 'unit' : 'class'
	)

	const classOptions = useMemo(
		() =>
			classes.map((c) => ({
				value: c.id.toString(),
				label: `${c.name} - ${c.unit.name}`
			})),
		[classes]
	)

	const unitOptions = useMemo(
		() =>
			units
				.filter((u) => u.level !== 'squad')
				.map((u) => ({
					value: u.id.toString(),
					label: `${u.name} (${unitLevelLabels[u.level]})`
				})),
		[units]
	)

	return (
		<div className='space-y-6 py-2'>
			{/* Full Name - Full Width */}
			<div className='grid grid-cols-2 gap-6'>
				<form.AppField name='fullName'>
					{(field: any) => <field.TextField label='Họ và tên' />}
				</form.AppField>

				<form.AppField name='avatar'>
					{(field: any) => (
						<field.UploadField
							label='Ảnh quân nhân'
							accept='image/*'
							maxSize={10 * 1024 * 1024}
							dragDropSize='small'
							showBrowseButton={false}
						/>
					)}
				</form.AppField>
			</div>

			<div className='grid grid-cols-2 gap-6'>
				<form.AppField name='studentId'>
					{(field: any) => (
						<field.TextField label='Mã số quân nhân' />
					)}
				</form.AppField>

				<div className='space-y-2'>
					<Label>Thuộc về</Label>
					<div className='flex gap-2'>
						<Button
							type='button'
							size='sm'
							variant={
								membershipType === 'class'
									? 'default'
									: 'outline'
							}
							onClick={() => {
								setMembershipType('class')
								form.setFieldValue('unitId', undefined)
							}}
						>
							Tiểu đội
						</Button>
						<Button
							type='button'
							size='sm'
							variant={
								membershipType === 'unit'
									? 'default'
									: 'outline'
							}
							onClick={() => {
								setMembershipType('unit')
								form.setFieldValue('classId', undefined)
							}}
						>
							Đơn vị (Trung đội trở lên)
						</Button>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-6'>
				{membershipType === 'class' ? (
					<form.AppField name='classId'>
						{(field: any) => (
							<field.Select
								values={classOptions}
								label='Tiểu đội'
								placeholder='Chọn tiểu đội'
							/>
						)}
					</form.AppField>
				) : (
					<form.AppField name='unitId'>
						{(field: any) => (
							<field.Select
								values={unitOptions}
								label='Đơn vị'
								placeholder='Chọn đơn vị'
							/>
						)}
					</form.AppField>
				)}
			</div>

			{/* Birth Place and Address - Two Columns  1*/}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<form.AppField name='birthPlace'>
					{(field: any) => <field.TextField label='Quê quán' />}
				</form.AppField>

				<form.AppField name='address'>
					{(field: any) => <field.TextField label='Trú quán' />}
				</form.AppField>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
			</div>

			{/* School Name and Major - Two Columns */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
			</div>

			{/* Phone - Full Width */}
			<div className='grid grid-cols-2 gap-6'>
				<form.AppField name='phone'>
					{(field: any) => (
						<field.TextField
							label='Số điện thoại'
							placeholder='123-456-7890'
						/>
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
			</div>
		</div>
	)
}

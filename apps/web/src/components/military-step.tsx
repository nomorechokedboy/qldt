import { rankOptions, soldierPositionOptions } from '@/data/ethnics'
import usePositionsData from '@/hooks/usePositionsData'

const LEVEL_LABELS: Record<string, string> = {
	battalion: 'Tiểu đoàn',
	company: 'Đại đội',
	platoon: 'Trung đội',
	squad: 'Tiểu đội',
	department: 'Phòng, ban'
}

export default function MilitaryStep({ form }: { form: any }) {
	const { data: positions } = usePositionsData(undefined, { enabled: true })

	const positionOptions = [...(positions ?? [])]
		.sort(
			(a, b) => a.level.localeCompare(b.level) || a.priority - b.priority
		)
		.map((p) => ({
			label: p.name,
			value: p.code,
			group: LEVEL_LABELS[p.level] ?? p.level
		}))

	const allPositionOptions = [...positionOptions, ...soldierPositionOptions]

	return (
		<div className='space-y-6 py-2'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
				<form.AppField name='position'>
					{(field: any) => (
						<field.Select
							values={allPositionOptions}
							label='Chức vụ'
							placeholder='Chọn chức vụ'
						/>
					)}
				</form.AppField>
				<form.AppField name='enlistmentPeriod'>
					{(field: any) => <field.TextField label='Ngày nhập ngũ' />}
				</form.AppField>
			</div>
			<div className='grid grid-cols-2 gap-6'>
				<form.AppField name='politicalOrg'>
					{(field: any) => (
						<field.Select
							label='Đoàn/Đảng'
							values={[
								{
									label: 'Đoàn',
									value: 'hcyu'
								},
								{
									label: 'Đảng',
									value: 'cpv'
								}
							]}
						></field.Select>
					)}
				</form.AppField>
				<form.AppField name='politicalOrgOfficialDate'>
					{(field: any) => <field.TextField label='Ngày vào Đoàn' />}
				</form.AppField>
			</div>

			<div className='grid grid-cols-2 gap-6'>
				<form.AppField name='cpvId'>
					{(field: any) => <field.TextField label='Số thẻ Đảng' />}
				</form.AppField>

				<form.AppField name='cpvOfficialAt'>
					{(field: any) => <field.TextField label='Ngày vào Đảng' />}
				</form.AppField>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<form.AppField name='contactPerson.name'>
					{(field: any) => (
						<field.TextField label='Khi cần báo tin cho' />
					)}
				</form.AppField>

				<form.AppField name='contactPerson.phoneNumber'>
					{(field: any) => <field.TextField label='Số điện thoại' />}
				</form.AppField>

				<form.AppField name='contactPerson.address'>
					{(field: any) => <field.TextField label='Địa chỉ' />}
				</form.AppField>
			</div>

			<div className='grid grid-cols-1'></div>

			<div className='grid grid-cols-1 gap-6'>
				<form.AppField name='talent'>
					{(field: any) => <field.TextArea label='Sở trường' />}
				</form.AppField>
			</div>
			<div className='grid grid-cols-1 gap-6'>
				<form.AppField name='shortcoming'>
					{(field: any) => <field.TextArea label='Sở đoản' />}
				</form.AppField>
			</div>
			<div className='grid grid-cols-1 gap-6'>
				<form.AppField name='achievement'>
					{(field: any) => <field.TextArea label='Thành tích' />}
				</form.AppField>
			</div>
			<div className='grid grid-cols-1 gap-6'>
				<form.AppField name='disciplinaryHistory'>
					{(field: any) => <field.TextArea label='Kỷ luật' />}
				</form.AppField>
			</div>
		</div>
	)
}

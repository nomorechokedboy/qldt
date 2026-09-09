import type { ColumnDef } from '@tanstack/react-table'
import type { Student } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '../data-table/data-table-column-header'
import { DataTableRowActions } from '../data-table/data-table-row-actions'
import EditableCell from '../data-table/editable-cell'
import EditableMilitaryRank from '../data-table/editable-military-rank'
import EditablePosition from '../data-table/editable-position'
import { toDdMmYyyy } from '@/common'

function isoToDdMmYyyy(isoDate: string): string {
	const [year, month, day] = isoDate.split('-')
	return `${day}/${month}/${year}`.replace('undefined/undefined/', '')
}

// Column definitions shared across two or more student table variants.
// Table-specific fields (e.g. the unit-name cell, adversity's
// familyBackground) stay inline in their owning table array below.

export const selectColumn: ColumnDef<Student> = {
	id: 'select',
	header: ({ table }) => (
		<Checkbox
			checked={
				table.getIsAllPageRowsSelected() ||
				(table.getIsSomePageRowsSelected() && 'indeterminate')
			}
			onCheckedChange={(value) =>
				table.toggleAllPageRowsSelected(!!value)
			}
			aria-label='Select all'
			className='translate-y-[2px] z-99'
		/>
	),
	cell: ({ row }) => (
		<Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label='Select row'
			className='translate-y-[2px] z-99'
		/>
	),
	enableSorting: false,
	enableHiding: false
}

// battalionStudentColumnsWithoutAction's unit cell: shows "<unit> - <parent>"
// when the unit has a parent, unlike the plain badge used elsewhere.
export const battalionUnitColumnWithParent: ColumnDef<Student> = {
	id: 'unit.name',
	accessorFn: (row) => row.unit?.name ?? '',
	header: 'Đơn vị',
	cell: ({ row }) => (
		<div className='w-20'>
			<Badge
				className='bg-green-400 text-white font-bold'
				variant='secondary'
			>
				{row.unit?.parent?.name !== undefined
					? `${row.getValue('unit.name')} - ${row.unit.parent.name}`
					: row.getValue('unit.name')}
			</Badge>
		</div>
	),
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Đơn vị'
	}
}

export const fullNameColumn: ColumnDef<Student> = {
	accessorKey: 'fullName',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Họ và tên' />
	),
	cell: EditableCell,
	meta: {
		label: 'Họ và tên'
	}
}

// Battalion tables receive dob as an ISO date string; other tables use
// toDdMmYyyy (see baseStudentsColumns) on an already-formatted value.
export const dobColumnIso: ColumnDef<Student> = {
	accessorKey: 'dob',
	header: 'Năm sinh',
	cell: ({ row }) => (
		<div className=''>{isoToDdMmYyyy(row.getValue('dob'))}</div>
	),
	meta: {
		label: 'Năm sinh'
	}
}

export const birthPlaceColumn: ColumnDef<Student> = {
	accessorKey: 'birthPlace',
	header: 'Quê quán',
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Quê quán'
	}
}

export const addressColumn: ColumnDef<Student> = {
	accessorKey: 'address',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Trú quán' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Trú quán'
	}
}

export const enlistmentPeriodColumn: ColumnDef<Student> = {
	accessorKey: 'enlistmentPeriod',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Thời gian nhập ngũ' />
	),
	cell: ({ row }) => (
		<div className='min-w-32'>{row.getValue('enlistmentPeriod')}</div>
	),
	enableHiding: true,
	meta: {
		label: 'Thời gian nhập ngũ'
	}
}

export const isGraduatedColumn: ColumnDef<Student> = {
	accessorKey: 'isGraduated',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Đã tốt nghiệp' />
	),
	cell: ({ row }) => (
		<Badge
			className={
				row.getValue('isGraduated') ? 'bg-green-500' : 'bg-red-500'
			}
		>
			{row.getValue('isGraduated') ? 'Có' : 'Không'}
		</Badge>
	),
	enableHiding: true,
	meta: {
		label: 'Đã tốt nghiệp'
	}
}

export const majorColumn: ColumnDef<Student> = {
	accessorKey: 'major',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Chuyên ngành' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Chuyên ngành'
	}
}

export const phoneColumn: ColumnDef<Student> = {
	accessorKey: 'phone',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Số điện thoại' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Số điện thoại'
	}
}

export const policyBeneficiaryGroupColumn: ColumnDef<Student> = {
	accessorKey: 'policyBeneficiaryGroup',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Đối tượng chính sách' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Đối tượng chính sách'
	}
}

export const politicalOrgColumn: ColumnDef<Student> = {
	accessorKey: 'politicalOrg',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Đoàn/Đảng' />
	),
	cell: ({ row }) => {
		const val = row.getValue('politicalOrg')
		const org =
			val === '' || val === undefined
				? 'N/A'
				: val === 'cpv'
					? 'Đảng viên'
					: 'Đoàn viên'

		return (
			<Badge className='bg-purple-500 text-white font-bold'>{org}</Badge>
		)
	},
	enableHiding: true,
	meta: {
		label: 'Đoàn/Đảng'
	}
}

export const politicalOrgOfficialDateColumn: ColumnDef<Student> = {
	accessorKey: 'politicalOrgOfficialDate',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Ngày vào Đoàn' />
	),
	cell: ({ row }) => (
		<div className='min-w-28'>
			{row.getValue('politicalOrgOfficialDate')
				? isoToDdMmYyyy(row.getValue('politicalOrgOfficialDate'))
				: 'N/A'}
		</div>
	),
	enableHiding: true,
	meta: {
		label: 'Ngày vào Đoàn'
	}
}

export const cpvIdColumn: ColumnDef<Student> = {
	accessorKey: 'cpvId',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Số thẻ Đảng' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Số thẻ Đảng'
	}
}

export const cpvOfficialAtColumn: ColumnDef<Student> = {
	accessorKey: 'cpvOfficialAt',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Ngày vào Đảng' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Ngày vào Đảng'
	}
}

export const previousPositionColumn: ColumnDef<Student> = {
	accessorKey: 'previousPosition',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Chức vụ cũ' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Chức vụ cũ'
	}
}

export const religionColumn: ColumnDef<Student> = {
	accessorKey: 'religion',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Tôn giáo' />
	),
	cell: ({ row }) => (
		<Badge className='bg-orange-500 text-white font-bold'>
			{row.getValue('religion')}
		</Badge>
	),
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		label: 'Tôn giáo'
	}
}

export const schoolNameColumn: ColumnDef<Student> = {
	accessorKey: 'schoolName',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Tên trường' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Tên trường'
	}
}

export const shortcomingColumn: ColumnDef<Student> = {
	accessorKey: 'shortcoming',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Khuyết điểm' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Khuyết điểm'
	}
}

export const talentColumn: ColumnDef<Student> = {
	accessorKey: 'talent',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Tài năng' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Tài năng'
	}
}

export const rankColumn: ColumnDef<Student> = {
	accessorKey: 'rank',
	header: 'Cấp bậc',
	cell: EditableMilitaryRank,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		label: 'Cấp bậc'
	}
}

export const rankColumnSortable: ColumnDef<Student> = {
	accessorKey: 'rank',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Cấp bậc' />
	),
	cell: EditableMilitaryRank,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		label: 'Cấp bậc'
	}
}

export const positionColumn: ColumnDef<Student> = {
	accessorKey: 'position',
	header: 'Chức vụ',
	cell: EditablePosition,
	enableHiding: true,
	meta: {
		label: 'Chức vụ'
	}
}

export const previousUnitColumn: ColumnDef<Student> = {
	accessorKey: 'previousUnit',
	header: 'Đơn vị cũ',
	cell: EditableCell,
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Đơn vị cũ'
	}
}

export const previousUnitColumnSortable: ColumnDef<Student> = {
	accessorKey: 'previousUnit',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Đơn vị cũ' />
	),
	cell: EditableCell,
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Đơn vị cũ'
	}
}

export const ethnicColumn: ColumnDef<Student> = {
	accessorKey: 'ethnic',
	header: 'Dân tộc',
	cell: ({ row }) => (
		<Badge className='bg-cyan-500 text-white font-bold'>
			{row.getValue('ethnic')}
		</Badge>
	),
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Dân tộc'
	}
}

export const ethnicColumnSortable: ColumnDef<Student> = {
	accessorKey: 'ethnic',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Dân tộc' />
	),
	cell: ({ row }) => (
		<Badge className='bg-cyan-500 text-white font-bold'>
			{row.getValue('ethnic')}
		</Badge>
	),
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Dân tộc'
	}
}

export const educationLevelColumn: ColumnDef<Student> = {
	accessorKey: 'educationLevel',
	header: 'Học vấn',
	cell: ({ row }) => (
		<Badge className='bg-blue-500 dark:bg-blue-600 text-white font-bold'>
			{row.getValue('educationLevel')}
		</Badge>
	),
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Học vấn'
	}
}

export const educationLevelColumnSortable: ColumnDef<Student> = {
	accessorKey: 'educationLevel',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Học vấn' />
	),
	cell: ({ row }) => (
		<Badge className='bg-blue-500 dark:bg-blue-600 text-white font-bold'>
			{row.getValue('educationLevel')}
		</Badge>
	),
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		label: 'Học vấn'
	}
}

export const fatherNameColumn: ColumnDef<Student> = {
	accessorKey: 'fatherName',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Họ tên bố' />
	),
	cell: EditableCell,
	meta: {
		label: 'Họ tên bố'
	}
}

export const fatherJobColumn: ColumnDef<Student> = {
	accessorKey: 'fatherJob',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Nghề nghiệp của bố' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Nghề nghiệp của bố'
	}
}

export const fatherPhoneNumberColumn: ColumnDef<Student> = {
	accessorKey: 'fatherPhoneNumber',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='SĐT bố' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'SĐT bố'
	}
}

export const motherNameColumn: ColumnDef<Student> = {
	accessorKey: 'motherName',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Họ tên mẹ' />
	),
	cell: EditableCell,
	meta: {
		label: 'Họ tên mẹ'
	}
}

export const motherJobColumn: ColumnDef<Student> = {
	accessorKey: 'motherJob',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Nghề nghiệp của mẹ' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'Nghề nghiệp của mẹ'
	}
}

export const motherPhoneNumberColumn: ColumnDef<Student> = {
	accessorKey: 'motherPhoneNumber',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='SĐT mẹ' />
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		label: 'SĐT mẹ'
	}
}

export const statusColumn: ColumnDef<Student> = {
	accessorKey: 'status',
	header: ({ column }) => (
		<DataTableColumnHeader column={column} title='Trạng thái' />
	),
	cell: ({ row }) => {
		const status = row.getValue('status') as 'pending' | 'confirmed'
		return (
			<Badge
				className={
					status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
				}
			>
				{status === 'confirmed' ? 'Đã xác nhận' : 'Chưa xác nhận'}
			</Badge>
		)
	},
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		label: 'Trạng thái'
	}
}

export const actionsColumn: ColumnDef<Student> = {
	id: 'actions',
	cell: ({ row }) => <DataTableRowActions row={row} />
}

export const baseStudentsColumns: ColumnDef<Student>[] = [
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name,
		header: 'Đơn vị',
		cell: ({ row }) => (
			<div className='w-20'>
				<Badge
					className='bg-green-400 text-white font-bold'
					variant='secondary'
				>
					{row.getValue('unit.name')}
				</Badge>
			</div>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			label: 'Đơn vị'
		}
	},
	fullNameColumn,
	{
		accessorKey: 'dob',
		header: 'Năm sinh',
		cell: ({ row }) => (
			<div className=''>{toDdMmYyyy(row.getValue('dob'))}</div>
		),
		meta: {
			label: 'Năm sinh'
		},
		enableHiding: true
	}
]

export const battalionStudentColumnsWithoutAction: ColumnDef<Student>[] = [
	selectColumn,
	battalionUnitColumnWithParent,
	fullNameColumn,
	dobColumnIso,
	birthPlaceColumn,
	addressColumn,
	enlistmentPeriodColumn,
	isGraduatedColumn,
	majorColumn,
	phoneColumn,
	policyBeneficiaryGroupColumn,
	politicalOrgColumn,
	politicalOrgOfficialDateColumn,
	cpvIdColumn,
	cpvOfficialAtColumn,
	previousPositionColumn,
	religionColumn,
	schoolNameColumn,
	shortcomingColumn,
	talentColumn,
	rankColumn,
	positionColumn,
	previousUnitColumn,
	ethnicColumn,
	educationLevelColumn,
	fatherNameColumn,
	fatherJobColumn,
	fatherPhoneNumberColumn,
	motherNameColumn,
	motherJobColumn,
	motherPhoneNumberColumn
]

export const columnsWithoutAction: ColumnDef<Student>[] = [
	selectColumn,
	...baseStudentsColumns,
	birthPlaceColumn,
	addressColumn,
	enlistmentPeriodColumn,
	isGraduatedColumn,
	majorColumn,
	phoneColumn,
	policyBeneficiaryGroupColumn,
	politicalOrgColumn,
	politicalOrgOfficialDateColumn,
	cpvIdColumn,
	cpvOfficialAtColumn,
	religionColumn,
	schoolNameColumn,
	shortcomingColumn,
	talentColumn,
	rankColumn,
	positionColumn,
	previousUnitColumn,
	ethnicColumn,
	educationLevelColumn,
	fatherNameColumn,
	fatherJobColumn,
	fatherPhoneNumberColumn,
	motherNameColumn,
	motherJobColumn,
	motherPhoneNumberColumn,
	statusColumn
]

export const hcyuTableColumns: ColumnDef<Student>[] = [
	selectColumn,
	...baseStudentsColumns,
	birthPlaceColumn,
	addressColumn,
	enlistmentPeriodColumn,
	isGraduatedColumn,
	majorColumn,
	phoneColumn,
	policyBeneficiaryGroupColumn,
	politicalOrgColumn,
	politicalOrgOfficialDateColumn,
	cpvIdColumn,
	cpvOfficialAtColumn,
	previousPositionColumn,
	religionColumn,
	schoolNameColumn,
	shortcomingColumn,
	talentColumn,
	rankColumn,
	positionColumn,
	previousUnitColumn,
	ethnicColumn,
	educationLevelColumn,
	fatherNameColumn,
	fatherJobColumn,
	fatherPhoneNumberColumn,
	motherNameColumn,
	motherJobColumn,
	motherPhoneNumberColumn,
	statusColumn,
	actionsColumn
]

export const adversityTableColumns: ColumnDef<Student>[] = [
	selectColumn,
	...baseStudentsColumns,
	birthPlaceColumn,
	addressColumn,
	{
		accessorKey: 'familyBackground',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Hoàn cảnh gia đình' />
		),
		cell: ({ row }) => (
			<div className='min-w-32'>{row.getValue('familyBackground')}</div>
		),
		enableHiding: true,
		meta: {
			label: 'Hoàn cảnh gia đình'
		}
	},
	enlistmentPeriodColumn,
	isGraduatedColumn,
	majorColumn,
	phoneColumn,
	policyBeneficiaryGroupColumn,
	politicalOrgColumn,
	politicalOrgOfficialDateColumn,
	cpvIdColumn,
	cpvOfficialAtColumn,
	previousPositionColumn,
	religionColumn,
	schoolNameColumn,
	shortcomingColumn,
	talentColumn,
	rankColumnSortable,
	positionColumn,
	previousUnitColumnSortable,
	ethnicColumnSortable,
	educationLevelColumnSortable,
	fatherNameColumn,
	fatherJobColumn,
	fatherPhoneNumberColumn,
	motherNameColumn,
	motherJobColumn,
	motherPhoneNumberColumn
]

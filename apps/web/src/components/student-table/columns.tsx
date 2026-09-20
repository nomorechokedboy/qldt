import type { ColumnDef } from '@tanstack/react-table'
import i18n from '@/i18n'
import type { Student, Unit } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '../data-table/data-table-column-header'
import { DataTableRowActions } from '../data-table/data-table-row-actions'
import EditableCell from '../data-table/editable-cell'
import EditableMilitaryRank from '../data-table/editable-military-rank'
import EditablePosition from '../data-table/editable-position'
import { toDdMmYyyy } from '@/common'
import type { ActivityStatus } from '@/types'
import {
	activityStatusColors,
	activityStatusLabels
} from '@/data/activity-statuses'
import { unitLabelWithAncestry } from '@/lib/unit-labels'
import { EllipsisText } from '../data-table/ellipsis-text'

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

// battalionStudentColumnsWithoutAction's unit cell: shows the unit's full
// ancestor breadcrumb (e.g. "Tiểu đội Trinh sát (Trung đội Chỉ huy, Đại
// đội 2)") rather than the plain badge used elsewhere, since this table
// can span multiple companies whose sub-units share identical names -
// needs `unitsById` (the full flat unit list keyed by id) to walk the
// chain. Previously read `row.unit` in the cell renderer, which doesn't
// exist on tanstack's `Row` wrapper (only `row.original` does) - the
// parent-name branch was silently dead code.
export function buildBattalionUnitColumnWithParent(
	unitsById: Map<number, Unit>
): ColumnDef<Student> {
	return {
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name ?? '',
		header: () => i18n.t('table:columns.unit'),
		cell: ({ row }) => (
			<div className='w-20'>
				<Badge
					className='bg-green-400 text-white font-bold'
					variant='secondary'
				>
					<EllipsisText maxWidth='120px'>
						{row.original.unit !== undefined
							? unitLabelWithAncestry(
									row.original.unit,
									unitsById
								)
							: row.getValue('unit.name')}
					</EllipsisText>
				</Badge>
			</div>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			get label() {
				return i18n.t('table:columns.unit')
			}
		}
	}
}

export const fullNameColumn: ColumnDef<Student> = {
	accessorKey: 'fullName',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.fullName')}
		/>
	),
	cell: EditableCell,
	meta: {
		get label() {
			return i18n.t('table:columns.fullName')
		}
	}
}

// Battalion tables receive dob as an ISO date string; other tables use
// toDdMmYyyy (see baseStudentsColumns) on an already-formatted value.
export const dobColumnIso: ColumnDef<Student> = {
	accessorKey: 'dob',
	header: () => i18n.t('table:columns.yearOfBirth'),
	cell: ({ row }) => (
		<div className=''>{isoToDdMmYyyy(row.getValue('dob'))}</div>
	),
	meta: {
		get label() {
			return i18n.t('table:columns.yearOfBirth')
		}
	}
}

export const birthPlaceColumn: ColumnDef<Student> = {
	accessorKey: 'birthPlace',
	header: () => i18n.t('table:columns.birthPlace'),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.birthPlace')
		}
	}
}

export const addressColumn: ColumnDef<Student> = {
	accessorKey: 'address',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.address')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.address')
		}
	}
}

export const enlistmentPeriodColumn: ColumnDef<Student> = {
	accessorKey: 'enlistmentPeriod',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.enlistmentPeriod')}
		/>
	),
	cell: ({ row }) => (
		<div className='min-w-32'>{row.getValue('enlistmentPeriod')}</div>
	),
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.enlistmentPeriod')
		}
	}
}

export const isGraduatedColumn: ColumnDef<Student> = {
	accessorKey: 'isGraduated',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.graduated')}
		/>
	),
	cell: ({ row }) => (
		<Badge
			className={
				row.getValue('isGraduated') ? 'bg-green-500' : 'bg-red-500'
			}
		>
			{row.getValue('isGraduated')
				? i18n.t('table:values.yes')
				: i18n.t('table:values.no')}
		</Badge>
	),
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.graduated')
		}
	}
}

export const majorColumn: ColumnDef<Student> = {
	accessorKey: 'major',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.major')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.major')
		}
	}
}

export const phoneColumn: ColumnDef<Student> = {
	accessorKey: 'phone',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.phone')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.phone')
		}
	}
}

export const policyBeneficiaryGroupColumn: ColumnDef<Student> = {
	accessorKey: 'policyBeneficiaryGroup',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.policyGroup')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.policyGroup')
		}
	}
}

export const politicalOrgColumn: ColumnDef<Student> = {
	accessorKey: 'politicalOrg',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.politicalOrg')}
		/>
	),
	cell: ({ row }) => {
		const val = row.getValue('politicalOrg')
		const org =
			val === '' || val === undefined
				? 'N/A'
				: val === 'cpv'
					? i18n.t('table:values.cpvMember')
					: i18n.t('table:values.hcyuMember')

		return (
			<Badge className='bg-purple-500 text-white font-bold'>{org}</Badge>
		)
	},
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.politicalOrg')
		}
	}
}

export const politicalOrgOfficialDateColumn: ColumnDef<Student> = {
	accessorKey: 'politicalOrgOfficialDate',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.hcyuDate')}
		/>
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
		get label() {
			return i18n.t('table:columns.hcyuDate')
		}
	}
}

export const cpvIdColumn: ColumnDef<Student> = {
	accessorKey: 'cpvId',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.cpvId')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.cpvId')
		}
	}
}

export const cpvOfficialAtColumn: ColumnDef<Student> = {
	accessorKey: 'cpvOfficialAt',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.cpvDate')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.cpvDate')
		}
	}
}

export const previousPositionColumn: ColumnDef<Student> = {
	accessorKey: 'previousPosition',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.previousPosition')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.previousPosition')
		}
	}
}

export const religionColumn: ColumnDef<Student> = {
	accessorKey: 'religion',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.religion')}
		/>
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
		get label() {
			return i18n.t('table:columns.religion')
		}
	}
}

export const schoolNameColumn: ColumnDef<Student> = {
	accessorKey: 'schoolName',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.schoolName')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.schoolName')
		}
	}
}

export const shortcomingColumn: ColumnDef<Student> = {
	accessorKey: 'shortcoming',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.shortcoming')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.shortcoming')
		}
	}
}

export const talentColumn: ColumnDef<Student> = {
	accessorKey: 'talent',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.talent')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.talent')
		}
	}
}

export const rankColumn: ColumnDef<Student> = {
	accessorKey: 'rank',
	header: () => i18n.t('table:columns.rank'),
	cell: EditableMilitaryRank,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.rank')
		}
	}
}

export const rankColumnSortable: ColumnDef<Student> = {
	accessorKey: 'rank',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.rank')}
		/>
	),
	cell: EditableMilitaryRank,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.rank')
		}
	}
}

export const positionColumn: ColumnDef<Student> = {
	accessorKey: 'position',
	header: () => i18n.t('table:columns.position'),
	cell: EditablePosition,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.position')
		}
	}
}

export const previousUnitColumn: ColumnDef<Student> = {
	accessorKey: 'previousUnit',
	header: () => i18n.t('table:columns.previousUnit'),
	cell: EditableCell,
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		get label() {
			return i18n.t('table:columns.previousUnit')
		}
	}
}

export const previousUnitColumnSortable: ColumnDef<Student> = {
	accessorKey: 'previousUnit',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.previousUnit')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	meta: {
		get label() {
			return i18n.t('table:columns.previousUnit')
		}
	}
}

export const ethnicColumn: ColumnDef<Student> = {
	accessorKey: 'ethnic',
	header: () => i18n.t('table:columns.ethnic'),
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
		get label() {
			return i18n.t('table:columns.ethnic')
		}
	}
}

export const ethnicColumnSortable: ColumnDef<Student> = {
	accessorKey: 'ethnic',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.ethnic')}
		/>
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
		get label() {
			return i18n.t('table:columns.ethnic')
		}
	}
}

export const educationLevelColumn: ColumnDef<Student> = {
	accessorKey: 'educationLevel',
	header: () => i18n.t('table:columns.education'),
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
		get label() {
			return i18n.t('table:columns.education')
		}
	}
}

export const educationLevelColumnSortable: ColumnDef<Student> = {
	accessorKey: 'educationLevel',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.education')}
		/>
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
		get label() {
			return i18n.t('table:columns.education')
		}
	}
}

export const fatherNameColumn: ColumnDef<Student> = {
	accessorKey: 'fatherName',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.fatherName')}
		/>
	),
	cell: EditableCell,
	meta: {
		get label() {
			return i18n.t('table:columns.fatherName')
		}
	}
}

export const fatherJobColumn: ColumnDef<Student> = {
	accessorKey: 'fatherJob',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.fatherJob')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.fatherJob')
		}
	}
}

export const fatherPhoneNumberColumn: ColumnDef<Student> = {
	accessorKey: 'fatherPhoneNumber',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.fatherPhone')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.fatherPhone')
		}
	}
}

export const motherNameColumn: ColumnDef<Student> = {
	accessorKey: 'motherName',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.motherName')}
		/>
	),
	cell: EditableCell,
	meta: {
		get label() {
			return i18n.t('table:columns.motherName')
		}
	}
}

export const motherJobColumn: ColumnDef<Student> = {
	accessorKey: 'motherJob',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.motherJob')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.motherJob')
		}
	}
}

export const motherPhoneNumberColumn: ColumnDef<Student> = {
	accessorKey: 'motherPhoneNumber',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.motherPhone')}
		/>
	),
	cell: EditableCell,
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.motherPhone')
		}
	}
}

export const statusColumn: ColumnDef<Student> = {
	accessorKey: 'status',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.status')}
		/>
	),
	cell: ({ row }) => {
		const status = row.getValue('status') as 'pending' | 'confirmed'
		return (
			<Badge
				className={
					status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
				}
			>
				{status === 'confirmed'
					? i18n.t('table:values.confirmed')
					: i18n.t('table:values.pending')}
			</Badge>
		)
	},
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.status')
		}
	}
}

export const activityStatusColumn: ColumnDef<Student> = {
	accessorKey: 'activityStatus',
	header: ({ column }) => (
		<DataTableColumnHeader
			column={column}
			title={i18n.t('table:columns.activityStatus')}
		/>
	),
	cell: ({ row }) => {
		const activityStatus = row.getValue('activityStatus') as
			| ActivityStatus
			| undefined
		if (activityStatus === undefined) return null
		return (
			<Badge className={activityStatusColors[activityStatus]}>
				{activityStatusLabels[activityStatus]}
			</Badge>
		)
	},
	filterFn: (row, id, value) => {
		return value.includes(row.getValue(id))
	},
	enableHiding: true,
	meta: {
		get label() {
			return i18n.t('table:columns.activityStatus')
		}
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
		header: () => i18n.t('table:columns.unit'),
		cell: ({ row }) => (
			<div className='w-20'>
				<Badge
					className='bg-green-400 text-white font-bold'
					variant='secondary'
				>
					<EllipsisText maxWidth='120px'>
						{row.getValue('unit.name')}
					</EllipsisText>
				</Badge>
			</div>
		),
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id))
		},
		meta: {
			get label() {
				return i18n.t('table:columns.unit')
			}
		}
	},
	fullNameColumn,
	{
		accessorKey: 'dob',
		header: () => i18n.t('table:columns.yearOfBirth'),
		cell: ({ row }) => (
			<div className=''>{toDdMmYyyy(row.getValue('dob'))}</div>
		),
		meta: {
			get label() {
				return i18n.t('table:columns.yearOfBirth')
			}
		},
		enableHiding: true
	}
]

export function buildBattalionStudentColumnsWithoutAction(
	unitsById: Map<number, Unit>
): ColumnDef<Student>[] {
	return [
		selectColumn,
		buildBattalionUnitColumnWithParent(unitsById),
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
}

// The cells that edit a student in place, swapped for plain text.
const readOnlyCells = new Map<unknown, ColumnDef<Student>['cell']>([
	[EditableCell, (ctx) => <EditableCell {...ctx} readOnly />],
	[EditableMilitaryRank, (ctx) => <EditableMilitaryRank {...ctx} readOnly />],
	[EditablePosition, (ctx) => <EditablePosition {...ctx} readOnly />]
])

export function buildReadOnlyBattalionStudentColumns(
	unitsById: Map<number, Unit>
): ColumnDef<Student>[] {
	const columns = [
		...buildBattalionStudentColumnsWithoutAction(unitsById),
		// The "Tình trạng" facet filters on this column.
		activityStatusColumn
	]
	return columns.map((column) => {
		const cell = readOnlyCells.get(column.cell)
		return cell ? { ...column, cell } : column
	})
}

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
	statusColumn,
	activityStatusColumn
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
	activityStatusColumn,
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
			<DataTableColumnHeader
				column={column}
				title={i18n.t('table:columns.familyCircumstances')}
			/>
		),
		cell: ({ row }) => (
			<div className='min-w-32'>
				<EllipsisText maxWidth='300px'>
					{row.getValue('familyBackground')}
				</EllipsisText>
			</div>
		),
		enableHiding: true,
		meta: {
			get label() {
				return i18n.t('table:columns.familyCircumstances')
			}
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

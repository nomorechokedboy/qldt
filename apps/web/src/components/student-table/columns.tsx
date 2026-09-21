import type { ReactNode } from 'react'
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
import {
	badgeCell,
	columnLabel,
	labelMeta,
	matchesAnyOf,
	minWidthCell,
	studentColumn
} from './column-helpers'

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

// The unit badge sits in a table cell whose width comes from its content, so
// the cell wrapper must be at least as wide as the badge. A fixed `w-20`
// (80px) wrapper around a badge that may grow to 120px+ let the badge spill
// over the next column. The wrapper now grows with the badge up to a cap;
// the text inside is truncated (tooltip on hover) to fit within that cap
// after the badge's own padding and border.
function UnitBadge({ children }: { children: ReactNode }) {
	return (
		<div className='max-w-40'>
			<Badge
				className='max-w-full bg-green-400 text-white font-bold'
				variant='secondary'
			>
				<EllipsisText maxWidth='8.5rem'>{children}</EllipsisText>
			</Badge>
		</div>
	)
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
		header: () => columnLabel('unit'),
		cell: ({ row }) => (
			<UnitBadge>
				{row.original.unit !== undefined
					? unitLabelWithAncestry(row.original.unit, unitsById)
					: row.getValue('unit.name')}
			</UnitBadge>
		),
		filterFn: matchesAnyOf,
		meta: labelMeta('unit')
	}
}

export const fullNameColumn = studentColumn('fullName', 'fullName')

// Battalion tables receive dob as an ISO date string; other tables use
// toDdMmYyyy (see baseStudentsColumns) on an already-formatted value.
export const dobColumnIso: ColumnDef<Student> = {
	accessorKey: 'dob',
	header: () => columnLabel('yearOfBirth'),
	cell: ({ row }) => (
		<div className=''>{isoToDdMmYyyy(row.getValue('dob'))}</div>
	),
	meta: labelMeta('yearOfBirth')
}

export const birthPlaceColumn = studentColumn('birthPlace', 'birthPlace', {
	sortable: false
})
export const addressColumn = studentColumn('address', 'address')

export const enlistmentPeriodColumn = studentColumn(
	'enlistmentPeriod',
	'enlistmentPeriod',
	{ cell: minWidthCell('enlistmentPeriod', 'min-w-32') }
)

export const isGraduatedColumn = studentColumn('isGraduated', 'graduated', {
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
	)
})

export const majorColumn = studentColumn('major', 'major')
export const phoneColumn = studentColumn('phone', 'phone')
export const policyBeneficiaryGroupColumn = studentColumn(
	'policyBeneficiaryGroup',
	'policyGroup'
)

export const politicalOrgColumn = studentColumn(
	'politicalOrg',
	'politicalOrg',
	{
		cell: ({ row }) => {
			const val = row.getValue('politicalOrg')
			const org =
				val === '' || val === undefined
					? 'N/A'
					: val === 'cpv'
						? i18n.t('table:values.cpvMember')
						: i18n.t('table:values.hcyuMember')

			return (
				<Badge className='bg-purple-500 text-white font-bold'>
					{org}
				</Badge>
			)
		}
	}
)

export const politicalOrgOfficialDateColumn = studentColumn(
	'politicalOrgOfficialDate',
	'hcyuDate',
	{
		cell: minWidthCell('politicalOrgOfficialDate', 'min-w-28', (date) =>
			date ? isoToDdMmYyyy(date) : 'N/A'
		)
	}
)

export const cpvIdColumn = studentColumn('cpvId', 'cpvId')
export const cpvOfficialAtColumn = studentColumn('cpvOfficialAt', 'cpvDate')
export const previousPositionColumn = studentColumn(
	'previousPosition',
	'previousPosition'
)

export const religionColumn = studentColumn('religion', 'religion', {
	filter: true,
	cell: badgeCell('religion', 'bg-orange-500 text-white font-bold')
})

export const schoolNameColumn = studentColumn('schoolName', 'schoolName')
export const shortcomingColumn = studentColumn('shortcoming', 'shortcoming')
export const talentColumn = studentColumn('talent', 'talent')

// Some columns come twice: with plain text as the heading, and (`...Sortable`)
// with the sort/filter menu.
export const rankColumn = studentColumn('rank', 'rank', {
	sortable: false,
	filter: true,
	cell: EditableMilitaryRank
})
export const rankColumnSortable = studentColumn('rank', 'rank', {
	filter: true,
	cell: EditableMilitaryRank
})

export const positionColumn = studentColumn('position', 'position', {
	sortable: false,
	cell: EditablePosition
})

export const previousUnitColumn = studentColumn(
	'previousUnit',
	'previousUnit',
	{
		sortable: false,
		filter: true
	}
)
export const previousUnitColumnSortable = studentColumn(
	'previousUnit',
	'previousUnit',
	{ filter: true }
)

const ethnicCell = badgeCell('ethnic', 'bg-cyan-500 text-white font-bold')
export const ethnicColumn = studentColumn('ethnic', 'ethnic', {
	sortable: false,
	filter: true,
	cell: ethnicCell
})
export const ethnicColumnSortable = studentColumn('ethnic', 'ethnic', {
	filter: true,
	cell: ethnicCell
})

const educationLevelCell = badgeCell(
	'educationLevel',
	'bg-blue-500 dark:bg-blue-600 text-white font-bold'
)
export const educationLevelColumn = studentColumn(
	'educationLevel',
	'education',
	{ sortable: false, filter: true, cell: educationLevelCell }
)
export const educationLevelColumnSortable = studentColumn(
	'educationLevel',
	'education',
	{ filter: true, cell: educationLevelCell }
)

export const fatherNameColumn = studentColumn('fatherName', 'fatherName')
export const fatherJobColumn = studentColumn('fatherJob', 'fatherJob')
export const fatherPhoneNumberColumn = studentColumn(
	'fatherPhoneNumber',
	'fatherPhone'
)
export const motherNameColumn = studentColumn('motherName', 'motherName')
export const motherJobColumn = studentColumn('motherJob', 'motherJob')
export const motherPhoneNumberColumn = studentColumn(
	'motherPhoneNumber',
	'motherPhone'
)

export const statusColumn = studentColumn('status', 'status', {
	filter: true,
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
	}
})

export const activityStatusColumn = studentColumn(
	'activityStatus',
	'activityStatus',
	{
		filter: true,
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
		}
	}
)

export const actionsColumn: ColumnDef<Student> = {
	id: 'actions',
	cell: ({ row }) => <DataTableRowActions row={row} />
}

// The columns the tables have in common, in the order they are shown; each
// table lists the ones it has, with its own between them.
const enlistmentToPartyColumns = [
	enlistmentPeriodColumn,
	isGraduatedColumn,
	majorColumn,
	phoneColumn,
	policyBeneficiaryGroupColumn,
	politicalOrgColumn,
	politicalOrgOfficialDateColumn,
	cpvIdColumn,
	cpvOfficialAtColumn
]

const backgroundColumns = [
	religionColumn,
	schoolNameColumn,
	shortcomingColumn,
	talentColumn
]

const familyColumns = [
	fatherNameColumn,
	fatherJobColumn,
	fatherPhoneNumberColumn,
	motherNameColumn,
	motherJobColumn,
	motherPhoneNumberColumn
]

// The rank, position, previous unit, ethnic group and education. Tables that
// let the user filter on the headings use the sortable variants.
const standingColumns = [
	rankColumn,
	positionColumn,
	previousUnitColumn,
	ethnicColumn,
	educationLevelColumn
]

export const baseStudentsColumns: ColumnDef<Student>[] = [
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name,
		header: () => columnLabel('unit'),
		cell: ({ row }) => <UnitBadge>{row.getValue('unit.name')}</UnitBadge>,
		filterFn: matchesAnyOf,
		meta: labelMeta('unit')
	},
	fullNameColumn,
	{
		accessorKey: 'dob',
		header: () => columnLabel('yearOfBirth'),
		cell: ({ row }) => (
			<div className=''>{toDdMmYyyy(row.getValue('dob'))}</div>
		),
		meta: labelMeta('yearOfBirth'),
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
		...enlistmentToPartyColumns,
		previousPositionColumn,
		...backgroundColumns,
		...standingColumns,
		...familyColumns
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
	...enlistmentToPartyColumns,
	...backgroundColumns,
	...standingColumns,
	...familyColumns,
	statusColumn,
	activityStatusColumn
]

export const hcyuTableColumns: ColumnDef<Student>[] = [
	selectColumn,
	...baseStudentsColumns,
	birthPlaceColumn,
	addressColumn,
	...enlistmentToPartyColumns,
	previousPositionColumn,
	...backgroundColumns,
	...standingColumns,
	...familyColumns,
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
				title={columnLabel('familyCircumstances')}
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
		meta: labelMeta('familyCircumstances')
	},
	...enlistmentToPartyColumns,
	previousPositionColumn,
	...backgroundColumns,
	rankColumnSortable,
	positionColumn,
	previousUnitColumnSortable,
	ethnicColumnSortable,
	educationLevelColumnSortable,
	...familyColumns
]

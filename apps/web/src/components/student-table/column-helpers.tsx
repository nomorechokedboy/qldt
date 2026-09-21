import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import i18n from '@/i18n'
import type viTable from '@/i18n/locales/vi/table'
import type { Student } from '@/types'
import { DataTableColumnHeader } from '../data-table/data-table-column-header'
import EditableCell from '../data-table/editable-cell'

// A key of `table:columns.*` - the heading and the label of a column.
export type ColumnLabelKey = keyof (typeof viTable)['columns']

export const columnLabel = (key: ColumnLabelKey) =>
	i18n.t(`table:columns.${key}`)

// `meta.label` names the column in the view-options menu. It is a getter so it
// follows the language at the time it is read, not at module load.
export function labelMeta(key: ColumnLabelKey) {
	return {
		get label() {
			return columnLabel(key)
		}
	}
}

// Multi-select facet filters match when the chosen values include the cell's.
export const matchesAnyOf: NonNullable<ColumnDef<Student>['filterFn']> = (
	row,
	id,
	value
) => value.includes(row.getValue(id))

type StudentColumnOptions = {
	// The heading has the sort/filter menu. Otherwise it is plain text.
	sortable?: boolean
	// Facet filter over the column's values.
	filter?: boolean
	// Defaults to the cell that edits the value in place.
	cell?: ColumnDef<Student>['cell']
}

// A student column shown in the tables and hideable from them.
export function studentColumn(
	accessorKey: keyof Student & string,
	labelKey: ColumnLabelKey,
	{
		sortable = true,
		filter = false,
		cell = EditableCell
	}: StudentColumnOptions = {}
): ColumnDef<Student> {
	return {
		accessorKey,
		header: sortable
			? ({ column }) => (
					<DataTableColumnHeader
						column={column}
						title={columnLabel(labelKey)}
					/>
				)
			: () => columnLabel(labelKey),
		cell,
		...(filter && { filterFn: matchesAnyOf }),
		enableHiding: true,
		meta: labelMeta(labelKey)
	}
}

// The value as a coloured badge.
export const badgeCell =
	(accessorKey: string, className: string): ColumnDef<Student>['cell'] =>
	({ row }) => (
		<Badge className={className}>{row.getValue(accessorKey)}</Badge>
	)

// The value in a cell with a minimum width (a `min-w-*` class).
export const minWidthCell =
	(
		accessorKey: string,
		className: string,
		format: (value: string) => ReactNode = (value) => value
	): ColumnDef<Student>['cell'] =>
	({ row }) => (
		<div className={className}>{format(row.getValue(accessorKey))}</div>
	)

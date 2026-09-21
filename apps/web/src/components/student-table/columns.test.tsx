import type { ColumnDef } from '@tanstack/react-table'
import { isValidElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import EditableCell from '@/components/data-table/editable-cell'
import EditableMilitaryRank from '@/components/data-table/editable-military-rank'
import EditablePosition from '@/components/data-table/editable-position'
import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import type { Student, Unit } from '@/types'
import {
	adversityTableColumns,
	baseStudentsColumns,
	buildBattalionStudentColumnsWithoutAction,
	buildReadOnlyBattalionStudentColumns,
	columnsWithoutAction,
	hcyuTableColumns
} from './columns'

const parent = { id: 1, name: 'Trung đội Chỉ huy' }
const unit = { id: 2, name: 'Tiểu đội 1', parent } as unknown as Unit
const unitsById = new Map<number, Unit>([
	[
		1,
		{
			id: 1,
			name: parent.name,
			parent: { id: 9, name: 'Đại đội 2' }
		} as Unit
	],
	[2, unit]
])
const student = { id: 1, unit, fullName: 'Nguyễn Văn A' } as unknown as Student

// A cell is rendered against each of these, so every branch of the inline
// cells (yes/no, empty, org type, status, ...) shows up in the snapshot.
const SAMPLE_VALUES = [
	'Giá trị',
	'',
	undefined,
	true,
	false,
	'cpv',
	'hcyu',
	'confirmed',
	'pending',
	'serving',
	'2026-01-02'
]

const keyOf = (column: ColumnDef<Student>) =>
	column.id ?? (column as { accessorKey?: string }).accessorKey ?? '?'

const COMPONENTS = new Map<unknown, string>([
	[EditableCell, 'EditableCell'],
	[EditableMilitaryRank, 'EditableMilitaryRank'],
	[EditablePosition, 'EditablePosition'],
	[DataTableRowActions, 'DataTableRowActions']
])

function describeElement(node: unknown): unknown {
	if (isValidElement(node)) {
		const element = node as ReactElement<{ readOnly?: boolean }>
		const component = COMPONENTS.get(element.type)
		if (component) {
			return { component, readOnly: !!element.props.readOnly }
		}
	}
	return renderToStaticMarkup(node as ReactElement)
}

function describeHeader(column: ColumnDef<Student>) {
	const { header } = column
	if (typeof header !== 'function') return { plain: header }
	const result = (header as (ctx: unknown) => unknown)({
		table: {
			getIsAllPageRowsSelected: () => false,
			getIsSomePageRowsSelected: () => false,
			toggleAllPageRowsSelected: () => {}
		}
	})
	if (isValidElement(result) && result.type === DataTableColumnHeader) {
		return { sortable: (result.props as { title: string }).title }
	}
	return { plain: result }
}

function describeCell(column: ColumnDef<Student>) {
	const { cell } = column
	if (typeof cell !== 'function') return String(cell)
	const direct = COMPONENTS.get(cell)
	if (direct) return { component: direct }
	return SAMPLE_VALUES.map((value) => {
		const ctx = {
			row: {
				original: student,
				getValue: () => value,
				getIsSelected: () => false,
				toggleSelected: () => {}
			},
			column: { id: keyOf(column) },
			getValue: () => value
		}
		try {
			return describeElement((cell as (c: unknown) => unknown)(ctx))
		} catch (error) {
			void error
			return 'throws'
		}
	})
}

function describeFilter(column: ColumnDef<Student>) {
	const { filterFn } = column
	if (typeof filterFn !== 'function') return null
	const row = { getValue: () => 'a' }
	const run = (value: string[]) =>
		(filterFn as (r: unknown, id: string, v: string[]) => boolean)(
			row,
			'x',
			value
		)
	return { matches: run(['a']), misses: run(['b']) }
}

function describeColumn(column: ColumnDef<Student>) {
	const meta = column.meta as { label?: string } | undefined
	const accessorFn = (column as { accessorFn?: (row: Student) => unknown })
		.accessorFn
	return {
		key: keyOf(column),
		label: meta?.label ?? null,
		enableHiding: column.enableHiding ?? true,
		enableSorting: column.enableSorting ?? null,
		header: describeHeader(column),
		accessed: accessorFn ? (accessorFn(student) ?? null) : undefined,
		filter: describeFilter(column),
		cell: describeCell(column)
	}
}

const describeColumns = (columns: ColumnDef<Student>[]) =>
	columns.map(describeColumn)

describe('student table column sets', () => {
	it('base columns', () => {
		expect(describeColumns(baseStudentsColumns)).toMatchSnapshot()
	})

	it('battalion columns', () => {
		expect(
			describeColumns(
				buildBattalionStudentColumnsWithoutAction(unitsById)
			)
		).toMatchSnapshot()
	})

	it('read-only battalion columns', () => {
		expect(
			describeColumns(buildReadOnlyBattalionStudentColumns(unitsById))
		).toMatchSnapshot()
	})

	it('company columns', () => {
		expect(describeColumns(columnsWithoutAction)).toMatchSnapshot()
	})

	it('hcyu columns', () => {
		expect(describeColumns(hcyuTableColumns)).toMatchSnapshot()
	})

	it('adversity columns', () => {
		expect(describeColumns(adversityTableColumns)).toMatchSnapshot()
	})

	it('has each column once per table', () => {
		for (const columns of [
			columnsWithoutAction,
			hcyuTableColumns,
			adversityTableColumns,
			buildBattalionStudentColumnsWithoutAction(unitsById)
		]) {
			const keys = columns.map(keyOf)
			expect(new Set(keys).size).toBe(keys.length)
		}
	})
})

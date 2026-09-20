import { DataTableRowActions } from '@/components/data-table/data-table-row-actions'
import type { OnDeleteRows, Student } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'

export default function useActionColumn(
	handler: OnDeleteRows,
	readOnly = false
) {
	return {
		id: 'actions',
		cell: ({ row }) => (
			<DataTableRowActions
				onDeleteRows={handler}
				readOnly={readOnly}
				row={row}
			/>
		)
	} as ColumnDef<Student>
}

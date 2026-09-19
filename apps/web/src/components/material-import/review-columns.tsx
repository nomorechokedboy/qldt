import type { ColumnDef } from '@tanstack/react-table'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function indexColumn<Row>(): ColumnDef<Row> {
	return {
		id: 'index',
		header: '#',
		cell: ({ row }) => (
			<span className='text-muted-foreground'>{row.index + 1}</span>
		)
	}
}

export function statusColumn<Row>(
	errorsByRowIndex: Map<number, string[]>
): ColumnDef<Row> {
	return {
		id: 'status',
		header: 'Trạng thái',
		cell: ({ row }) => {
			const rowErrors = errorsByRowIndex.get(row.index)
			return rowErrors !== undefined ? (
				<span
					className='flex items-center gap-1 text-destructive'
					title={rowErrors.join('\n')}
				>
					<AlertCircle className='h-4 w-4 flex-shrink-0' />
					Lỗi
				</span>
			) : (
				<span className='flex items-center gap-1 text-green-700 dark:text-green-400'>
					<CheckCircle className='h-4 w-4 flex-shrink-0' />
					OK
				</span>
			)
		}
	}
}

// '' from a cleared <select> means "no value".
export const toOptionalId = (value: string) =>
	value === '' ? undefined : Number(value)

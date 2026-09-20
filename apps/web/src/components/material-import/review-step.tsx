import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/react-table'
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	ClipboardList
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface ReviewStepProps<Row> {
	rows: Row[]
	columns: ColumnDef<Row>[]
	validRowCount: number
	errorsByRowIndex: Map<number, string[]>
	isUploading: boolean
	onChooseAnotherFile: () => void
}

export function ReviewStep<Row>({
	rows,
	columns,
	validRowCount,
	errorsByRowIndex,
	isUploading,
	onChooseAnotherFile
}: ReviewStepProps<Row>) {
	const { t } = useTranslation('materials')
	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3'>
					<ClipboardList className='h-6 w-6 text-primary' />
					<div>
						<h3 className='font-medium text-foreground'>
							{t('import.review.title')}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t('import.review.description')}
						</p>
					</div>
				</div>
				<Button
					variant='ghost'
					size='sm'
					onClick={onChooseAnotherFile}
					disabled={isUploading}
				>
					<ArrowLeft className='h-4 w-4' />
					{t('import.review.chooseAnother')}
				</Button>
			</div>

			<div className='flex flex-wrap items-center gap-3 text-sm'>
				<span className='text-muted-foreground'>
					{t('import.review.total')}{' '}
					<span className='font-medium text-foreground'>
						{rows.length}
					</span>
				</span>
				<Badge
					variant='outline'
					className='gap-1 border-green-400 text-green-700 dark:border-green-800 dark:text-green-400'
				>
					<CheckCircle className='h-3.5 w-3.5' />
					{t('import.review.valid', { count: validRowCount })}
				</Badge>
				{errorsByRowIndex.size > 0 && (
					<Badge variant='destructive' className='gap-1'>
						<AlertCircle className='h-3.5 w-3.5' />
						{t('import.review.errorCount', {
							count: errorsByRowIndex.size
						})}
					</Badge>
				)}
			</div>

			<DataTable
				columns={columns}
				data={rows}
				toolbarVisible={false}
				placeholder={t('import.review.empty')}
				getRowClassName={(_row, index) =>
					errorsByRowIndex.has(index)
						? 'bg-destructive/5 hover:bg-destructive/10'
						: undefined
				}
			/>

			{errorsByRowIndex.size > 0 && (
				<p className='text-sm text-muted-foreground'>
					{t('import.review.hint')}
				</p>
			)}
		</div>
	)
}

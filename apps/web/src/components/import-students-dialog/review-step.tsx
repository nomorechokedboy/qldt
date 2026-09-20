import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StudentBody } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	ClipboardList
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Every visible column mounts its own `<form.Field>` per row, and each of
// those re-derives its value from the shared form store (regex path-parse
// included, see TanStack Form's `getBy`/`makePathArray`) on every single
// keystroke/selection anywhere in the table, not just its own row - a cost
// that scales with (visible rows x visible columns), independent of
// anything this app controls. These 6 columns are the ones the help text
// below already tells users to opt into via "Hiển thị các cột" when they
// actually need to fix a place-lookup error, so hiding them by default was
// always the intent - it just was never wired up. Doing so cuts mounted
// fields (and this per-keystroke cost) by ~40% for the common case where no
// one needs to look at them.
const REVIEW_DEFAULT_COLUMN_VISIBILITY = {
	birthPlaceProvinceCode: false,
	birthPlaceWardCode: false,
	birthPlace: false,
	addressProvinceCode: false,
	addressWardCode: false,
	address: false,
	activityStatus: false
}

export interface ReviewStepProps {
	rows: StudentBody[]
	validRowCount: number
	errorRowCount: number
	resetDialog: () => void
	isUploading: boolean
	reviewColumns: ColumnDef<StudentBody>[]
}

export function ReviewStep({
	rows,
	validRowCount,
	errorRowCount,
	resetDialog,
	isUploading,
	reviewColumns
}: ReviewStepProps) {
	const { t } = useTranslation('io')
	const { t: tTable } = useTranslation('table')
	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-3'>
					<ClipboardList className='h-6 w-6 text-primary' />
					<div>
						<h3 className='font-medium text-foreground'>
							{t('importDialog.review.title')}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t('importDialog.review.hint')}
						</p>
					</div>
				</div>
				<Button
					variant='ghost'
					size='sm'
					onClick={resetDialog}
					disabled={isUploading}
				>
					<ArrowLeft className='h-4 w-4' />
					{t('importDialog.review.another')}
				</Button>
			</div>

			<div className='flex flex-wrap items-center gap-3 text-sm'>
				<span className='text-muted-foreground'>
					{t('importDialog.review.total')}{' '}
					<span className='font-medium text-foreground'>
						{rows.length}
					</span>
				</span>
				<Badge
					variant='outline'
					className='gap-1 border-green-400 text-green-700 dark:border-green-800 dark:text-green-400'
				>
					<CheckCircle className='h-3.5 w-3.5' />
					{t('importDialog.review.valid', { count: validRowCount })}
				</Badge>
				{errorRowCount > 0 && (
					<Badge variant='destructive' className='gap-1'>
						<AlertCircle className='h-3.5 w-3.5' />
						{t('importDialog.review.errors', {
							count: errorRowCount
						})}
					</Badge>
				)}
			</div>

			<DataTable
				columns={reviewColumns}
				data={rows}
				placeholder={t('importDialog.review.empty')}
				defaultColumnVisibility={REVIEW_DEFAULT_COLUMN_VISIBILITY}
			/>

			{errorRowCount > 0 && (
				<p className='text-sm text-muted-foreground'>
					{t('importDialog.review.help', {
						status: t('importDialog.columns.status'),
						error: t('importDialog.rowStatus.error'),
						columns: tTable('viewOptions.trigger')
					})}
				</p>
			)}
		</div>
	)
}

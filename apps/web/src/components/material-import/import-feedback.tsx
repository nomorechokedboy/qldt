import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ImportResults, UploadStatus } from './types'

export function UploadMessage({
	status,
	message
}: {
	status: UploadStatus
	message: string
}) {
	return (
		<div className='flex items-center gap-2 rounded-lg border p-3 text-sm'>
			{status === 'success' && (
				<CheckCircle className='h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
			)}
			{status === 'error' && (
				<AlertCircle className='h-5 w-5 flex-shrink-0 text-destructive' />
			)}
			{status === 'uploading' && (
				<Loader2 className='h-5 w-5 flex-shrink-0 animate-spin text-primary' />
			)}
			<span
				className={
					status === 'success'
						? 'text-green-700 dark:text-green-400'
						: status === 'error'
							? 'text-destructive'
							: 'text-foreground'
				}
			>
				{message}
			</span>
		</div>
	)
}

export function ImportResultsPanel({ results }: { results: ImportResults }) {
	const { t } = useTranslation('materials')
	return (
		<div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
			<h4 className='font-medium text-foreground'>
				{t('import.results.title')}
			</h4>
			<div className='grid grid-cols-3 gap-4 text-sm'>
				<div className='text-center'>
					<div className='text-2xl font-bold text-green-600 dark:text-green-400'>
						{results.successCount}
					</div>
					<div className='text-muted-foreground'>
						{t('import.results.success')}
					</div>
				</div>
				<div className='text-center'>
					<div className='text-2xl font-bold text-destructive'>
						{results.errorCount}
					</div>
					<div className='text-muted-foreground'>
						{t('import.results.errors')}
					</div>
				</div>
				<div className='text-center'>
					<div className='text-2xl font-bold text-foreground'>
						{results.totalCount}
					</div>
					<div className='text-muted-foreground'>
						{t('import.results.total')}
					</div>
				</div>
			</div>

			{results.errors && results.errors.length > 0 && (
				<div className='space-y-2 pt-1'>
					<h5 className='font-medium text-destructive'>
						{t('import.results.errorDetails')}
					</h5>
					<div className='max-h-32 overflow-y-auto space-y-1'>
						{results.errors.map((error, index) => (
							<div
								key={index}
								className='rounded border bg-background p-2 text-sm text-destructive'
							>
								{t('import.results.row', {
									row: error.row,
									message: error.message
								})}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

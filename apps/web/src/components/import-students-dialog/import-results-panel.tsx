import type { ImportResults } from '@/components/material-import/types'
import { useTranslation } from 'react-i18next'

function Stat({
	value,
	label,
	className
}: {
	value: number
	label: string
	className: string
}) {
	return (
		<div className='text-center'>
			<div className={`text-2xl font-bold ${className}`}>{value}</div>
			<div className='text-muted-foreground'>{label}</div>
		</div>
	)
}

export function ImportResultsPanel({ results }: { results: ImportResults }) {
	const { t } = useTranslation('io')
	return (
		<div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
			<h4 className='font-medium text-foreground'>
				{t('importDialog.results.title')}
			</h4>
			<div className='grid grid-cols-3 gap-4 text-sm'>
				<Stat
					value={results.successCount}
					label={t('importDialog.results.success')}
					className='text-green-600 dark:text-green-400'
				/>
				<Stat
					value={results.errorCount}
					label={t('importDialog.results.errors')}
					className='text-destructive'
				/>
				<Stat
					value={results.totalCount}
					label={t('importDialog.results.total')}
					className='text-foreground'
				/>
			</div>

			{results.errors.length > 0 && (
				<div className='space-y-2 pt-1'>
					<h5 className='font-medium text-destructive'>
						{t('importDialog.results.details')}
					</h5>
					<div className='max-h-32 overflow-y-auto space-y-1'>
						{results.errors.map((error, index) => (
							<div
								// Errors carry no id and may repeat, and the list is static.
								// biome-ignore lint/suspicious/noArrayIndexKey: see above
								key={index}
								className='rounded border bg-background p-2 text-sm text-destructive'
							>
								{t('importDialog.results.row', {
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

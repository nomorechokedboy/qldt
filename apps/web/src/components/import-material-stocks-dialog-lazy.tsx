import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { ImportDialogSkeleton } from './import-dialog-skeleton'
import type { ImportMaterialStocksDialogProps } from './import-material-stocks-dialog'

const ImportMaterialStocksDialog = lazy(() =>
	import('./import-material-stocks-dialog').then((m) => ({
		default: m.ImportMaterialStocksDialog
	}))
)

export function LazyImportMaterialStocksDialog(
	props: ImportMaterialStocksDialogProps
) {
	const { t } = useTranslation('materials')
	if (!props.isOpen) {
		return null
	}
	return (
		<Suspense
			fallback={
				<ImportDialogSkeleton
					isOpen={props.isOpen}
					onClose={props.onClose}
					title={t('importStocks.title')}
				/>
			}
		>
			<ImportMaterialStocksDialog {...props} />
		</Suspense>
	)
}

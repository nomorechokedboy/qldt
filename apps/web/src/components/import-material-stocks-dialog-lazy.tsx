import { lazy, Suspense } from 'react'
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
	if (!props.isOpen) {
		return null
	}
	return (
		<Suspense
			fallback={
				<ImportDialogSkeleton
					isOpen={props.isOpen}
					onClose={props.onClose}
					title='Import vật tư sinh hoạt'
				/>
			}
		>
			<ImportMaterialStocksDialog {...props} />
		</Suspense>
	)
}

import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { ImportDialogSkeleton } from './import-dialog-skeleton'
import type { ImportMaterialAssetsDialogProps } from './import-material-assets-dialog'

const ImportMaterialAssetsDialog = lazy(() =>
	import('./import-material-assets-dialog').then((m) => ({
		default: m.ImportMaterialAssetsDialog
	}))
)

export function LazyImportMaterialAssetsDialog(
	props: ImportMaterialAssetsDialogProps
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
					title={t('importAssets.title')}
				/>
			}
		>
			<ImportMaterialAssetsDialog {...props} />
		</Suspense>
	)
}

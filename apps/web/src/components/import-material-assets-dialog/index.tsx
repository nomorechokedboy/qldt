import type { materials } from '@/api/client'
import { ImportDialogShell } from '@/components/material-import/import-dialog-shell'
import { downloadWithErrorAlert } from '@/components/material-import/template-helpers'
import type { ImportResults } from '@/components/material-import/types'
import { useImportDialogState } from '@/components/material-import/use-import-dialog-state'
import { useTranslation } from 'react-i18next'
import useImportMaterialAssets from '@/hooks/useImportMaterialAssets'
import { downloadAssetImportTemplate } from './build-import-template'
import { parseAssetRows } from './parse-import-file'
import type { MaterialAssetImportRow } from './types'
import { useAssetImportLookups } from './use-asset-import-lookups'
import { useReviewColumns } from './use-review-columns'

export interface ImportMaterialAssetsDialogProps {
	unitId: number
	isOpen: boolean
	onClose: () => void
	onSuccess?: (results: ImportResults) => void
}

export function ImportMaterialAssetsDialog({
	isOpen,
	unitId,
	onClose,
	onSuccess
}: ImportMaterialAssetsDialogProps) {
	const { t } = useTranslation('materials')
	const { lookups, unitsById } = useAssetImportLookups(isOpen)
	const importAssets = useImportMaterialAssets()

	const state = useImportDialogState<MaterialAssetImportRow>({
		parseRows: (headers, dataRows) =>
			parseAssetRows(headers, dataRows, lookups),
		describeReferenceErrors: (count) =>
			t('importAssets.referenceErrors', { count }),
		importRows: (rows) =>
			importAssets.mutateAsync(rows as materials.MaterialAssetBody[]),
		itemNoun: t('importAssets.itemNoun'),
		onClose,
		onSuccess
	})

	const columns = useReviewColumns({
		lookups,
		errorsByRowIndex: state.errorsByRowIndex,
		updateRow: state.updateRow,
		clearRowErrors: state.clearRowErrors
	})

	if (!isOpen) return null

	return (
		<ImportDialogShell
			title={t('importAssets.title')}
			description={t('importAssets.description')}
			itemNoun={t('importAssets.itemNoun')}
			state={state}
			columns={columns}
			downloadTemplate={() =>
				downloadWithErrorAlert(() =>
					downloadAssetImportTemplate(
						lookups,
						unitsById.get(unitId)?.alias ?? unitId
					)
				)
			}
		/>
	)
}

import type { materials } from '@/api/client'
import { ImportDialogShell } from '@/components/material-import/import-dialog-shell'
import { downloadWithErrorAlert } from '@/components/material-import/template-helpers'
import type { ImportResults } from '@/components/material-import/types'
import { useImportDialogState } from '@/components/material-import/use-import-dialog-state'
import { useTranslation } from 'react-i18next'
import useImportMaterialStocks from '@/hooks/useImportMaterialStocks'
import { downloadStockImportTemplate } from './build-import-template'
import { parseStockRows } from './parse-import-file'
import type { MaterialStockImportRow } from './types'
import { useReviewColumns } from './use-review-columns'
import { useStockImportLookups } from './use-stock-import-lookups'

export interface ImportMaterialStocksDialogProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: (results: ImportResults) => void
}

export function ImportMaterialStocksDialog({
	isOpen,
	onClose,
	onSuccess
}: ImportMaterialStocksDialogProps) {
	const { t } = useTranslation('materials')
	const { lookups, units } = useStockImportLookups(isOpen)
	const importStocks = useImportMaterialStocks()

	const state = useImportDialogState<MaterialStockImportRow>({
		parseRows: (headers, dataRows) =>
			parseStockRows(headers, dataRows, lookups),
		describeReferenceErrors: (count) =>
			t('importStocks.referenceErrors', { count }),
		importRows: (rows) =>
			importStocks.mutateAsync(rows as materials.MaterialStockBody[]),
		itemNoun: t('importStocks.itemNoun'),
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
			title={t('importStocks.title')}
			description={t('importStocks.description')}
			itemNoun={t('importStocks.itemNoun')}
			state={state}
			columns={columns}
			downloadTemplate={() =>
				downloadWithErrorAlert(() =>
					downloadStockImportTemplate(lookups, units?.at(0)?.alias)
				)
			}
		/>
	)
}

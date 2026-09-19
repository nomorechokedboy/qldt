import type { materials } from '@/api/client'
import { ImportDialogShell } from '@/components/material-import/import-dialog-shell'
import { downloadWithErrorAlert } from '@/components/material-import/template-helpers'
import type { ImportResults } from '@/components/material-import/types'
import { useImportDialogState } from '@/components/material-import/use-import-dialog-state'
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
	const { lookups, units } = useStockImportLookups(isOpen)
	const importStocks = useImportMaterialStocks()

	const state = useImportDialogState<MaterialStockImportRow>({
		parseRows: (headers, dataRows) =>
			parseStockRows(headers, dataRows, lookups),
		describeReferenceErrors: (count) =>
			`Đã đọc file, nhưng có ${count} dòng chứa lỗi tham chiếu (vật tư/đơn vị/vị trí không hợp lệ).`,
		importRows: (rows) =>
			importStocks.mutateAsync(rows as materials.MaterialStockBody[]),
		itemNoun: 'vật tư',
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
			title='Import vật tư sinh hoạt'
			description='Tải lên file Excel hoặc CSV để thêm nhiều vật tư cùng lúc.'
			itemNoun='vật tư'
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

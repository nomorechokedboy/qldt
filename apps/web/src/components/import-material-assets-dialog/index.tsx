import type { materials } from '@/api/client'
import { ImportDialogShell } from '@/components/material-import/import-dialog-shell'
import { downloadWithErrorAlert } from '@/components/material-import/template-helpers'
import type { ImportResults } from '@/components/material-import/types'
import { useImportDialogState } from '@/components/material-import/use-import-dialog-state'
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
	const { lookups, unitsById } = useAssetImportLookups(isOpen)
	const importAssets = useImportMaterialAssets()

	const state = useImportDialogState<MaterialAssetImportRow>({
		parseRows: (headers, dataRows) =>
			parseAssetRows(headers, dataRows, lookups),
		describeReferenceErrors: (count) =>
			`Đã đọc file, nhưng có ${count} dòng chứa lỗi tham chiếu (khí tài/đơn vị/vị trí/quân nhân không hợp lệ).`,
		importRows: (rows) =>
			importAssets.mutateAsync(rows as materials.MaterialAssetBody[]),
		itemNoun: 'khí tài',
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
			title='Import vũ khí/trang bị'
			description='Tải lên file Excel hoặc CSV để thêm nhiều khí tài cùng lúc.'
			itemNoun='khí tài'
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

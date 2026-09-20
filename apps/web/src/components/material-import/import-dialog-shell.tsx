import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ImportResultsPanel, UploadMessage } from './import-feedback'
import { ReviewStep } from './review-step'
import type { ImportDialogState } from './use-import-dialog-state'
import { UploadStep } from './upload-step'

export interface ImportDialogShellProps<Row> {
	title: string
	description: string
	itemNoun: string
	state: ImportDialogState<Row>
	columns: ColumnDef<Row>[]
	downloadTemplate: () => void
}

export function ImportDialogShell<Row>({
	title,
	description,
	itemNoun,
	state,
	columns,
	downloadTemplate
}: ImportDialogShellProps<Row>) {
	const { t } = useTranslation('materials')
	const isUploading = state.uploadStatus === 'uploading'

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) state.handleClose()
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{!state.isReviewing && (
						<DialogDescription>{description}</DialogDescription>
					)}
				</DialogHeader>

				<div className='space-y-6'>
					{state.isReviewing ? (
						<ReviewStep
							rows={state.rows}
							columns={columns}
							validRowCount={state.validRowCount}
							errorsByRowIndex={state.errorsByRowIndex}
							isUploading={isUploading}
							onChooseAnotherFile={state.reset}
						/>
					) : (
						<UploadStep
							itemNoun={itemNoun}
							downloadTemplate={downloadTemplate}
							selectedFile={state.selectedFile}
							dragActive={state.dragActive}
							fileInputRef={state.fileInputRef}
							onDrag={state.handleDrag}
							onDrop={state.handleDrop}
							onFileInputChange={state.handleFileInputChange}
						/>
					)}

					{state.uploadMessage && (
						<UploadMessage
							status={state.uploadStatus}
							message={state.uploadMessage}
						/>
					)}

					{state.importResults && (
						<ImportResultsPanel results={state.importResults} />
					)}
				</div>

				<DialogFooter>
					<Button variant='secondary' onClick={state.handleClose}>
						{state.uploadStatus === 'success'
							? t('import.close')
							: t('import.cancel')}
					</Button>

					{state.isReviewing && (
						<Button
							onClick={state.handleImport}
							disabled={
								state.parseErrors.length > 0 || isUploading
							}
							title={
								state.parseErrors.length > 0
									? t('import.fixErrorsFirst')
									: undefined
							}
						>
							{isUploading ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									{t('import.importing')}
								</>
							) : (
								<>
									<Upload className='h-4 w-4' />
									{t('import.confirm')}
									<ArrowRight className='h-4 w-4' />
								</>
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { UploadMessage } from '@/components/material-import/import-feedback'
import type { ImportResults } from '@/components/material-import/types'
import { ArrowRight, Loader2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { downloadImportTemplate } from './build-import-template'
import { ImportResultsPanel } from './import-results-panel'
import { reviewInputClass } from './review-input-class'
import { ReviewStep } from './review-step'
import { UploadStep } from './upload-step'
import { useImportLookups } from './use-import-lookups'
import { useReviewColumns } from './use-review-columns'
import { useStudentImportFlow } from './use-student-import-flow'

export { reviewInputClass }

export interface ImportStudentsDialogProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: (results: ImportResults) => void
}

export function ImportStudentsDialog({
	isOpen,
	onClose,
	onSuccess
}: ImportStudentsDialogProps) {
	const { t } = useTranslation('io')
	const lookups = useImportLookups(isOpen)
	const flow = useStudentImportFlow({
		parseLookups: lookups.parseLookups,
		onClose,
		onSuccess
	})
	const reviewColumns = useReviewColumns({
		form: flow.form,
		clearFieldError: flow.clearFieldError,
		...lookups.selectOptions
	})

	if (!isOpen) return null

	const isUploading = flow.uploadStatus === 'uploading'

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) flow.handleClose()
			}}
		>
			<DialogContent className='max-w-9/10'>
				<DialogHeader>
					<DialogTitle>{t('importDialog.title')}</DialogTitle>
					{!flow.isReviewing && (
						<DialogDescription>
							{t('importDialog.description')}
						</DialogDescription>
					)}
				</DialogHeader>

				<div className='space-y-6'>
					{flow.isReviewing ? (
						<ReviewStep
							rows={flow.rows}
							validRowCount={flow.validRowCount}
							errorRowCount={flow.errorRowCount}
							resetDialog={flow.reset}
							isUploading={isUploading}
							reviewColumns={reviewColumns}
						/>
					) : (
						<UploadStep
							downloadTemplate={() =>
								downloadImportTemplate(lookups.templateData)
							}
							selectedFile={flow.selectedFile}
							dragActive={flow.dragActive}
							fileInputRef={flow.fileInputRef}
							onDrag={flow.handleDrag}
							onDrop={flow.handleDrop}
							onFileInputChange={flow.handleFileInputChange}
						/>
					)}

					{flow.uploadMessage && (
						<UploadMessage
							status={flow.uploadStatus}
							message={flow.uploadMessage}
						/>
					)}

					{flow.importResults && (
						<ImportResultsPanel results={flow.importResults} />
					)}
				</div>

				<DialogFooter>
					<Button variant='secondary' onClick={flow.handleClose}>
						{flow.uploadStatus === 'success'
							? t('importDialog.actions.close')
							: t('importDialog.actions.cancel')}
					</Button>

					{flow.isReviewing && (
						<Button
							onClick={flow.handleImport}
							disabled={flow.errorRowCount > 0 || isUploading}
							title={
								flow.errorRowCount > 0
									? t('importDialog.actions.fixErrorsTooltip')
									: undefined
							}
						>
							{isUploading ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									{t('importDialog.actions.importing')}
								</>
							) : (
								<>
									<Upload className='h-4 w-4' />
									{t('importDialog.actions.confirm')}
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

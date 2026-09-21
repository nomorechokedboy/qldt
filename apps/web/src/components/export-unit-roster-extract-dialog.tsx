import { ExportUnitRosterExtract } from '@/api'
import { LazyDocxPreviewDialog as DocxPreviewDialog } from '@/components/docx-preview-dialog-lazy'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { useAppForm } from '@/hooks/use-app-form'
import useAuth from '@/hooks/useAuth'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

export interface ExportUnitRosterExtractDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	unitId: number
	defaultFilename: string
	defaultValues?: {
		unitName?: string
		underUnitName?: string
	}
	id?: string
}

export function ExportUnitRosterExtractDialog({
	open,
	unitId,
	onOpenChange,
	defaultFilename,
	defaultValues,
	id = 'exportUnitRosterExtractForm'
}: ExportUnitRosterExtractDialogProps) {
	const { t } = useTranslation('io')
	const { user } = useAuth()
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null)
	const [previewFilename, setPreviewFilename] = useState(defaultFilename)

	const form = useAppForm({
		defaultValues: {
			city: 'Đồng Nai',
			commanderName: user?.displayName ?? '',
			commanderPosition: 'CHỈ HUY ĐƠN VỊ',
			commanderRank: user?.rank ?? '',
			reportTitle: 'danh sách biên chế'.toUpperCase(),
			underUnitName: defaultValues?.underUnitName ?? '',
			unitName: defaultValues?.unitName ?? '',
			filename: defaultFilename
		},
		onSubmit: async ({ value, formApi }) => {
			try {
				const resp = await ExportUnitRosterExtract({
					unitId,
					city: value.city,
					commanderName: value.commanderName,
					commanderPosition: value.commanderPosition,
					commanderRank: value.commanderRank,
					reportTitle: value.reportTitle,
					underUnitName: value.underUnitName,
					unitName: value.unitName
				})
				const buffer = await resp.arrayBuffer()

				setPreviewBuffer(buffer)
				setPreviewFilename(value.filename)
				setPreviewOpen(true)
				onOpenChange(false)
				formApi.reset()
			} catch (err) {
				console.error('handleExportUnitRosterExtract error', err)
				toastApiError(t('export.failed'), err)
			}
		}
	})

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<form
					id={id}
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
				>
					<DialogContent className='container' key={id}>
						<DialogHeader>
							<DialogTitle>
								{t('export.roster.title')}
							</DialogTitle>
							<DialogDescription>
								{t('export.roster.description')}
							</DialogDescription>
						</DialogHeader>
						<div className='grid grid-cols-3 gap-4'>
							<form.AppField
								name='filename'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.filename')
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t('export.fields.filename')}
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='unitName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.unitName')
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t('export.fields.unitName')}
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='underUnitName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.underUnitName')
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t('export.fields.underUnitName')}
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<form.AppField
								name='reportTitle'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.reportTitle')
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t('export.fields.reportTitle')}
									/>
								)}
							</form.AppField>
							<form.AppField
								name='city'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.city')
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t('export.fields.city')}
									/>
								)}
							</form.AppField>
						</div>
						<div className='grid grid-cols-3 gap-4'>
							<form.AppField
								name='commanderPosition'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t(
													'export.required.commanderPosition'
												)
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label={t(
											'export.fields.commanderPosition'
										)}
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='commanderName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.commanderName')
											: undefined
								}}
							>
								{(field) => (
									<field.TextField
										label={t('export.fields.commanderName')}
									/>
								)}
							</form.AppField>
							<form.AppField
								name='commanderRank'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('export.required.commanderRank')
											: undefined
								}}
							>
								{(field) => (
									<field.TextField
										label={t('export.fields.commanderRank')}
									/>
								)}
							</form.AppField>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant='outline'>
									{t('export.cancel')}
								</Button>
							</DialogClose>
							<form.Subscribe
								selector={(state) => [
									state.canSubmit,
									state.isSubmitting
								]}
								children={([canSubmit, isSubmitting]) => (
									<Button
										type='submit'
										form={id}
										disabled={!canSubmit}
									>
										{isSubmitting
											? t('export.exporting')
											: t('export.confirm')}
									</Button>
								)}
							/>
						</DialogFooter>
					</DialogContent>
				</form>
			</Dialog>
			<DocxPreviewDialog
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				document={previewBuffer}
				filename={previewFilename}
			/>
		</>
	)
}

import { useTranslation } from 'react-i18next'
import { ExportMaterialAssets } from '@/api'
import { LazyDocxPreviewDialog as DocxPreviewDialog } from '@/components/docx-preview-dialog-lazy'
import { ExportColumnPicker } from '@/components/export-column-picker'
import {
	buildMaterialAssetExportRow,
	materialAssetExportFields
} from '@/components/material-asset-table/export-row'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAppForm } from '@/hooks/use-app-form'
import useAuth from '@/hooks/useAuth'
import { useExportTemplates } from '@/hooks/useExportTemplates'
import type { MaterialAsset } from '@/types'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/api-error'

const NO_TEMPLATE_VALUE = '__default__'

export interface ExportMaterialAssetsDialogProps {
	children: ReactNode
	data: MaterialAsset[]
	defaultFilename: string
	defaultValues?: {
		unitName?: string
		underUnitName?: string
	}
	id?: string
}

export function ExportMaterialAssetsDialog({
	children,
	data,
	defaultFilename,
	defaultValues,
	id = 'exportMaterialAssetsForm'
}: ExportMaterialAssetsDialogProps) {
	const { t } = useTranslation('io')
	const { user } = useAuth()
	const { data: templates } = useExportTemplates('material_assets')
	const [open, setOpen] = useState(false)
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null)
	const [previewFilename, setPreviewFilename] = useState(defaultFilename)
	const [selectedColumns, setSelectedColumns] = useState(
		materialAssetExportFields.map((f) => f.key)
	)

	const templateOptions = [
		{
			label: t('export.students.defaultTemplate'),
			value: NO_TEMPLATE_VALUE
		},
		...(templates ?? []).map((template) => ({
			label: template.name,
			value: String(template.id)
		}))
	]

	const form = useAppForm({
		defaultValues: {
			city: 'Đồng Nai',
			commanderName: user?.displayName ?? '',
			commanderPosition: 'CHỈ HUY ĐƠN VỊ',
			commanderRank: user?.rank ?? '',
			reportTitle: 'Báo cáo vũ khí/trang bị',
			underUnitName: defaultValues?.underUnitName ?? '',
			unitName: defaultValues?.unitName ?? '',
			filename: defaultFilename,
			templateId: NO_TEMPLATE_VALUE
		},
		onSubmit: async ({ value, formApi }) => {
			if (selectedColumns.length === 0) {
				toast.error(t('export.students.noColumns'))
				return
			}

			try {
				const resp = await ExportMaterialAssets({
					city: value.city,
					commanderName: value.commanderName,
					commanderPosition: value.commanderPosition,
					commanderRank: value.commanderRank,
					data: data.map((asset) =>
						buildMaterialAssetExportRow(asset, selectedColumns)
					),
					reportTitle: value.reportTitle,
					underUnitName: value.underUnitName,
					unitName: value.unitName,
					templateId:
						value.templateId === NO_TEMPLATE_VALUE
							? undefined
							: Number(value.templateId)
				})
				const buffer = await resp.arrayBuffer()

				setPreviewBuffer(buffer)
				setPreviewFilename(value.filename)
				setPreviewOpen(true)
				setOpen(false)
				formApi.reset()
			} catch (err) {
				console.error('handleExport error', err)
				toastApiError(t('export.failed'), err)
			}
		}
	})

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<form
					id={id}
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
				>
					<DialogTrigger asChild>{children}</DialogTrigger>
					<DialogContent className='container' key={id}>
						<DialogHeader>
							<DialogTitle>
								{t('export.materialAssets.title')}
							</DialogTitle>
							<DialogDescription>
								{t('export.description')}
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-2'>
							<Label className='text-xl font-bold'>
								{t('export.students.columns')}
							</Label>
							<ExportColumnPicker
								options={materialAssetExportFields}
								selected={selectedColumns}
								onChange={setSelectedColumns}
							/>
						</div>
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
							<form.AppField name='templateId'>
								{(field) => (
									<field.Select
										label={t('export.students.template')}
										values={templateOptions}
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

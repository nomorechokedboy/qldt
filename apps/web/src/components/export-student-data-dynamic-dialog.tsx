import { ExportStudentDataDynamic } from '@/api'
import { LazyDocxPreviewDialog as DocxPreviewDialog } from '@/components/docx-preview-dialog-lazy'
import { ExportColumnPicker } from '@/components/export-column-picker'
import {
	buildStudentExportRow,
	studentExportFields
} from '@/components/student-table/export-row'
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
import { Label } from '@/components/ui/label'
import { useAppForm } from '@/hooks/use-app-form'
import useAuth from '@/hooks/useAuth'
import { useExportTemplates } from '@/hooks/useExportTemplates'
import type { Student } from '@/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/api-error'

const NO_TEMPLATE_VALUE = '__default__'

export interface ExportStudentDataDynamicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	data: Student[]
	defaultFilename: string
	defaultValues?: {
		unitName?: string
		underUnitName?: string
	}
	id?: string
}

export function ExportStudentDataDynamicDialog({
	open,
	onOpenChange,
	data,
	defaultFilename,
	defaultValues,
	id = 'exportStudentDataDynamicForm'
}: ExportStudentDataDynamicDialogProps) {
	const { t } = useTranslation('io')
	const { user } = useAuth()
	const { data: templates } = useExportTemplates('students')
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null)
	const [previewFilename, setPreviewFilename] = useState(defaultFilename)
	const [selectedColumns, setSelectedColumns] = useState(
		studentExportFields.map((f) => f.key)
	)

	const templateOptions = [
		{
			label: t('export.students.defaultTemplate'),
			value: NO_TEMPLATE_VALUE
		},
		...(templates ?? []).map((t) => ({
			label: t.name,
			value: String(t.id)
		}))
	]

	const form = useAppForm({
		defaultValues: {
			city: 'Đồng Nai',
			commanderName: user?.displayName ?? '',
			commanderPosition: 'CHỈ HUY ĐƠN VỊ',
			commanderRank: user?.rank ?? '',
			reportTitle: 'Báo cáo danh sách quân nhân',
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
				const resp = await ExportStudentDataDynamic({
					city: value.city,
					commanderName: value.commanderName,
					commanderPosition: value.commanderPosition,
					commanderRank: value.commanderRank,
					data: data.map((student) =>
						buildStudentExportRow(student, selectedColumns)
					),
					rawData: data as unknown as Record<string, unknown>[],
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
				onOpenChange(false)
				formApi.reset()
			} catch (err) {
				console.error('handleExport error', err)
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
								{t('export.students.title')}
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
								options={studentExportFields}
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

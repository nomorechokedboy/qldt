import { ExportStudentDataDynamic } from '@/api'
import { DocxPreviewDialog } from '@/components/docx-preview-dialog'
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
import { toast } from 'sonner'

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
	const { user } = useAuth()
	const { data: templates } = useExportTemplates('students')
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewBuffer, setPreviewBuffer] = useState<ArrayBuffer | null>(null)
	const [previewFilename, setPreviewFilename] = useState(defaultFilename)
	const [selectedColumns, setSelectedColumns] = useState(
		studentExportFields.map((f) => f.key)
	)

	const templateOptions = [
		{ label: 'Mặc định', value: NO_TEMPLATE_VALUE },
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
				toast.error('Hãy chọn ít nhất một cột để xuất dữ liệu')
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
				toast.error('Chưa thể xuất file, đã có lỗi xảy ra!')
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
							<DialogTitle>Xuất dữ liệu học viên</DialogTitle>
							<DialogDescription>
								Hãy điền những thông tin cần thiết để xuất dữ
								liệu
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-2'>
							<Label className='text-xl font-bold'>
								Cột dữ liệu muốn xuất
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
											? 'Tên file không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label='Tên file'
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='unitName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? 'Tên đơn vị không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label='Tên đơn vị'
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='underUnitName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? 'Tên đơn vị trực thuộc không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label='Tên đơn vị trực thuộc'
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
											? 'Tiêu đề báo cáo không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput label='Tiêu đề báo cáo' />
								)}
							</form.AppField>
							<form.AppField name='templateId'>
								{(field) => (
									<field.Select
										label='Mẫu xuất dữ liệu'
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
											? 'Chức vụ chỉ huy không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput
										label='Cấp bậc của chỉ huy'
										ellipsisMaxWidth='500px'
									/>
								)}
							</form.AppField>
							<form.AppField
								name='commanderName'
								validators={{
									onBlur: ({ value }) =>
										!value
											? 'Tên chỉ huy không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.TextField label='Tên chỉ huy' />
								)}
							</form.AppField>
							<form.AppField
								name='commanderRank'
								validators={{
									onBlur: ({ value }) =>
										!value
											? 'Cấp bậc của chỉ huy không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.TextField label='Cấp bậc của chỉ huy' />
								)}
							</form.AppField>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button variant='outline'>Hủy</Button>
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
											? 'Đang xuất file...'
											: 'Xác nhận'}
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

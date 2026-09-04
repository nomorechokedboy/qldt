import { ExportUnitRosterExtract } from '@/api'
import { DocxPreviewDialog } from '@/components/docx-preview-dialog'
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
import { toast } from 'sonner'

export interface ExportUnitRosterExtractDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	unitAlias: string
	unitLevel: string
	defaultFilename: string
	defaultValues?: {
		unitName?: string
		underUnitName?: string
	}
	id?: string
}

export function ExportUnitRosterExtractDialog({
	open,
	onOpenChange,
	unitAlias,
	unitLevel,
	defaultFilename,
	defaultValues,
	id = 'exportUnitRosterExtractForm'
}: ExportUnitRosterExtractDialogProps) {
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
					unitAlias,
					unitLevel,
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
							<DialogTitle>Xuất danh sách biên chế</DialogTitle>
							<DialogDescription>
								Danh sách biên chế của đơn vị này và toàn bộ đơn
								vị trực thuộc, phân theo từng đơn vị
							</DialogDescription>
						</DialogHeader>
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
							<form.AppField
								name='city'
								validators={{
									onBlur: ({ value }) =>
										!value
											? 'Địa danh không được bỏ trống'
											: undefined
								}}
							>
								{(field) => (
									<field.EditableInput label='Địa danh' />
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
										label='Chức vụ chỉ huy'
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

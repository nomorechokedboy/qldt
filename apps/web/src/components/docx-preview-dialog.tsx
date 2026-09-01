import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { DocxEditor, type DocxEditorRef } from '@docx-editor.dev/react'
import '@docx-editor.dev/core/styles/editor.css'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export interface DocxPreviewDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	document: ArrayBuffer | null
	filename: string
}

export function DocxPreviewDialog({
	open,
	onOpenChange,
	document: doc,
	filename
}: DocxPreviewDialogProps) {
	const editorRef = useRef<DocxEditorRef>(null)
	const [isDownloading, setIsDownloading] = useState(false)

	async function handleDownload() {
		setIsDownloading(true)
		try {
			const bytes = await editorRef.current?.save()
			if (!bytes) {
				toast.error('Chưa thể tải file, đã có lỗi xảy ra!')
				return
			}

			const blob = new Blob([bytes], {
				type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			})
			const link = window.document.createElement('a')
			link.href = window.URL.createObjectURL(blob)
			link.download = `${filename}.docx`

			window.document.body.appendChild(link)
			link.click()

			window.document.body.removeChild(link)
			window.URL.revokeObjectURL(link.href)
		} catch (err) {
			console.error('handleDownload error', err)
			toast.error('Chưa thể tải file, đã có lỗi xảy ra!')
		} finally {
			setIsDownloading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='container h-[95vh] w-[95vw] max-w-[95vw] overflow-hidden flex flex-col sm:max-w-[95vw]'>
				<DialogHeader>
					<DialogTitle>Xem trước file xuất</DialogTitle>
				</DialogHeader>
				<div className='flex-1 overflow-auto rounded-md border'>
					{doc !== null && (
						<DocxEditor ref={editorRef} document={doc} />
					)}
				</div>
				<DialogFooter>
					<Button onClick={handleDownload} disabled={isDownloading}>
						{isDownloading ? 'Đang tải xuống...' : 'Tải xuống'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

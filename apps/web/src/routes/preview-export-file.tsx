import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { SidebarInset } from '@/components/ui/sidebar'
import { consumePendingExportPreview } from '@/lib/pending-export-preview'
import { DocxEditor, type DocxEditorRef } from '@docx-editor.dev/react'
import '@docx-editor.dev/core/styles/editor.css'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/preview-export-file')({
	component: RouteComponent
})

function RouteComponent() {
	const navigate = useNavigate()
	const editorRef = useRef<DocxEditorRef>(null)
	const [isDownloading, setIsDownloading] = useState(false)
	const [preview] = useState(() => consumePendingExportPreview())

	async function handleDownload() {
		if (!preview) return

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
			const link = document.createElement('a')
			link.href = URL.createObjectURL(blob)
			link.download = `${preview.filename}.docx`

			document.body.appendChild(link)
			link.click()

			document.body.removeChild(link)
			URL.revokeObjectURL(link.href)
		} catch (err) {
			console.error('handleDownload error', err)
			toast.error('Chưa thể tải file, đã có lỗi xảy ra!')
		} finally {
			setIsDownloading(false)
		}
	}

	return (
		<ProtectedRoute>
			<SidebarInset>
				<div className='flex h-full flex-1 flex-col gap-4 p-8'>
					<div className='flex items-center justify-between'>
						<h2 className='text-2xl font-bold tracking-tight'>
							Xem trước file xuất
						</h2>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								onClick={() => window.history.back()}
							>
								Đóng
							</Button>
							<Button
								onClick={handleDownload}
								disabled={isDownloading || !preview}
							>
								{isDownloading
									? 'Đang tải xuống...'
									: 'Tải xuống'}
							</Button>
						</div>
					</div>
					{preview ? (
						<div className='flex-1 overflow-auto rounded-md border'>
							<DocxEditor
								ref={editorRef}
								document={preview.buffer}
							/>
						</div>
					) : (
						<div className='flex flex-1 flex-col items-center justify-center gap-4'>
							<p className='text-muted-foreground'>
								Không có file để xem trước. Hãy thực hiện xuất
								file lại.
							</p>
							<Button onClick={() => navigate({ to: '/' })}>
								Về trang chủ
							</Button>
						</div>
					)}
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}

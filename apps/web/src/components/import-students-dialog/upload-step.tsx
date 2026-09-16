import { Button } from '@/components/ui/button'
import {
	CheckCircle,
	Download,
	FileSpreadsheet,
	FileUp,
	Info
} from 'lucide-react'
import type React from 'react'

export interface UploadStepProps {
	downloadTemplate: () => void
	selectedFile: File | null
	dragActive: boolean
	fileInputRef: React.RefObject<HTMLInputElement | null>
	onDrag: (e: React.DragEvent<HTMLDivElement>) => void
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void
	onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UploadStep({
	downloadTemplate,
	selectedFile,
	dragActive,
	fileInputRef,
	onDrag,
	onDrop,
	onFileInputChange
}: UploadStepProps) {
	return (
		<>
			{/* Instructions */}
			<div className='flex items-start gap-3 rounded-lg border bg-muted/30 p-4'>
				<Info className='h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0' />
				<ol className='space-y-1.5 text-sm text-muted-foreground'>
					<li>
						<span className='font-medium text-foreground'>1.</span>{' '}
						Tải xuống file mẫu
					</li>
					<li>
						<span className='font-medium text-foreground'>2.</span>{' '}
						Điền thông tin quân nhân theo định dạng mẫu
					</li>
					<li>
						<span className='font-medium text-foreground'>3.</span>{' '}
						Tải file lên và nhấn Import
					</li>
				</ol>
			</div>

			{/* Download template */}
			<div className='flex items-center justify-between rounded-lg border p-4'>
				<div className='flex items-center space-x-3'>
					<FileSpreadsheet className='h-8 w-8 text-emerald-600 dark:text-emerald-500' />
					<div>
						<h3 className='font-medium text-foreground'>
							File mẫu Excel
						</h3>
						<p className='text-sm text-muted-foreground'>
							Tải xuống để có cấu trúc dữ liệu chính xác
						</p>
					</div>
				</div>
				<Button variant='outline' onClick={downloadTemplate}>
					<Download className='h-4 w-4' />
					Tải xuống
				</Button>
			</div>

			{/* File upload area */}
			<div className='space-y-4'>
				<h3 className='font-medium text-foreground'>
					Chọn file để import
				</h3>

				<div
					className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
						dragActive
							? 'border-primary bg-primary/5'
							: selectedFile
								? 'border-green-400 bg-green-50 dark:bg-green-950/30'
								: 'border-border hover:border-muted-foreground'
					}`}
					onDragEnter={onDrag}
					onDragLeave={onDrag}
					onDragOver={onDrag}
					onDrop={onDrop}
				>
					<input
						ref={fileInputRef}
						type='file'
						accept='.csv,.xlsx,.xls'
						onChange={onFileInputChange}
						className='hidden'
					/>

					{selectedFile ? (
						<div className='space-y-3'>
							<CheckCircle className='h-12 w-12 text-green-500 mx-auto' />
							<div>
								<p className='font-medium text-green-700 dark:text-green-400'>
									{selectedFile.name}
								</p>
								<p className='text-sm text-muted-foreground'>
									{(selectedFile.size / 1024 / 1024).toFixed(
										2
									)}{' '}
									MB
								</p>
							</div>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => fileInputRef.current?.click()}
							>
								Chọn file khác
							</Button>
						</div>
					) : (
						<div className='space-y-3'>
							<FileUp className='h-12 w-12 text-muted-foreground mx-auto' />
							<div>
								<p className='text-muted-foreground'>
									Kéo thả file vào đây hoặc{' '}
									<button
										onClick={() =>
											fileInputRef.current?.click()
										}
										className='text-primary hover:underline font-medium'
									>
										chọn file
									</button>
								</p>
								<p className='text-sm text-muted-foreground mt-1'>
									Hỗ trợ file CSV, Excel (.xlsx, .xls)
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

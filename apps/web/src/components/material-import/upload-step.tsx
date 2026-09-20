import { Button } from '@/components/ui/button'
import {
	CheckCircle,
	Download,
	FileSpreadsheet,
	FileUp,
	Info
} from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'

export interface UploadStepProps {
	itemNoun: string
	downloadTemplate: () => void
	selectedFile: File | null
	dragActive: boolean
	fileInputRef: React.RefObject<HTMLInputElement | null>
	onDrag: (e: React.DragEvent<HTMLDivElement>) => void
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void
	onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UploadStep({
	itemNoun,
	downloadTemplate,
	selectedFile,
	dragActive,
	fileInputRef,
	onDrag,
	onDrop,
	onFileInputChange
}: UploadStepProps) {
	const { t } = useTranslation('materials')
	return (
		<>
			<div className='flex items-start gap-3 rounded-lg border bg-muted/30 p-4'>
				<Info className='h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0' />
				<ol className='space-y-1.5 text-sm text-muted-foreground'>
					<li>
						<span className='font-medium text-foreground'>1.</span>{' '}
						{t('import.upload.step1')}
					</li>
					<li>
						<span className='font-medium text-foreground'>2.</span>{' '}
						{t('import.upload.step2', { itemNoun })}
					</li>
					<li>
						<span className='font-medium text-foreground'>3.</span>{' '}
						{t('import.upload.step3')}
					</li>
				</ol>
			</div>

			<div className='flex items-center justify-between rounded-lg border p-4'>
				<div className='flex items-center space-x-3'>
					<FileSpreadsheet className='h-8 w-8 text-emerald-600 dark:text-emerald-500' />
					<div>
						<h3 className='font-medium text-foreground'>
							{t('import.upload.templateTitle')}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t('import.upload.templateHint')}
						</p>
					</div>
				</div>
				<Button variant='outline' onClick={downloadTemplate}>
					<Download className='h-4 w-4' />
					{t('import.upload.download')}
				</Button>
			</div>

			<div className='space-y-4'>
				<h3 className='font-medium text-foreground'>
					{t('import.upload.chooseHeading')}
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
								{t('import.upload.chooseAnother')}
							</Button>
						</div>
					) : (
						<div className='space-y-3'>
							<FileUp className='h-12 w-12 text-muted-foreground mx-auto' />
							<div>
								<p className='text-muted-foreground'>
									{t('import.upload.dropHint')}{' '}
									<button
										onClick={() =>
											fileInputRef.current?.click()
										}
										className='text-primary hover:underline font-medium'
									>
										{t('import.upload.pick')}
									</button>
								</p>
								<p className='text-sm text-muted-foreground mt-1'>
									{t('import.upload.supported')}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

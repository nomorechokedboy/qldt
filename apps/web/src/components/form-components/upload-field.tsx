import { FileText, Paperclip, Upload } from 'lucide-react'
import { useRef, useState, type DragEvent, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { EllipsisText } from '../data-table/ellipsis-text'
import { FieldFrame } from './field-frame'
import { useFileField } from './use-file-field'

export type UploadFieldProps = JSX.IntrinsicElements['input'] & {
	label: string
	value?: File | null
	accept?: string
	maxSize?: number // in bytes
	showBrowseButton?: boolean
	browseButtonText?: string
	dragDropText?: string
	browseText?: string
	dragDropSize?: 'small' | 'default'
}

const formatFileSize = (bytes: number) =>
	`${(bytes / 1024 / 1024).toFixed(2)} MB`

function SelectedFile({ file }: { file: File }) {
	return (
		<div className='border-2 border-foreground bg-background p-4'>
			<div className='flex items-center gap-3'>
				<FileText />
				<div className='flex-1'>
					<p className='font-medium text-foreground'>{file.name}</p>
					<p className='text-sm text-muted-foreground'>
						{formatFileSize(file.size)}
					</p>
				</div>
			</div>
		</div>
	)
}

export function UploadField({
	label,
	value,
	accept,
	maxSize = 10 * 1024 * 1024, // 10MB default
	className,
	showBrowseButton = true,
	browseButtonText = 'Choose file',
	dragDropText = 'Drag & Drop a file here',
	browseText = 'or click to browse files',
	dragDropSize = 'default'
}: UploadFieldProps) {
	const { t } = useTranslation('common')
	const { field, selectFile, handleInputChange } = useFileField(maxSize)
	const [isDragOver, setIsDragOver] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const openFilePicker = () => fileInputRef.current?.click()

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
	}

	const handleDrop = (e: DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)

		const [file] = Array.from(e.dataTransfer.files)
		if (file) selectFile(file)
	}

	return (
		<FieldFrame
			label={label}
			htmlFor={label}
			className={cn('space-y-4', className)}
		>
			{showBrowseButton && (
				<div className='flex gap-4 items-center'>
					<Button
						type='button'
						variant='outline'
						onClick={openFilePicker}
						className='border-2 border-foreground bg-background text-foreground hover:bg-secondary px-8 py-3 text-base font-medium'
					>
						{browseButtonText}
					</Button>
				</div>
			)}

			<Input
				ref={fileInputRef}
				type='file'
				className='hidden'
				accept={accept}
				onChange={handleInputChange}
				onBlur={field.handleBlur}
			/>

			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={openFilePicker}
				className={cn(
					'bg-background cursor-pointer transition-colors duration-200',
					dragDropSize === 'default' &&
						'border-2 border-foreground p-8 text-center',
					isDragOver && 'bg-secondary',
					value && 'border-primary'
				)}
			>
				{dragDropSize === 'default' ? (
					<div className='flex flex-col items-center gap-3'>
						<Upload />
						<p className='text-foreground font-medium text-lg'>
							{dragDropText}
						</p>
						<p className='text-muted-foreground'>{browseText}</p>
					</div>
				) : (
					<div className='flex items-center gap-3 py-1'>
						<Paperclip />
						<EllipsisText>
							{field.state.value?.name ?? t('form.uploadPrompt')}
						</EllipsisText>
					</div>
				)}
			</div>

			{value && <SelectedFile file={value} />}
		</FieldFrame>
	)
}

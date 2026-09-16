import useUploadFiles from '@/hooks/useUploadFiles'
import { cn, getMediaUri } from '@/lib/utils'
import { Loader2, Upload, X } from 'lucide-react'
import { type ChangeEvent, useRef } from 'react'

export interface MaterialImagesUploadProps {
	value: string[]
	onChange: (value: string[]) => void
	className?: string
}

// Thumbnail grid + "add" tile for a material's multi-image field. Unlike
// AvatarUpload (a single circular image with an overlay upload trigger),
// materials can carry any number of images, so this renders each one as its
// own removable square thumbnail instead of swapping one image in place.
export function MaterialImagesUpload({
	value,
	onChange,
	className
}: MaterialImagesUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { mutateAsync: uploadFiles, isPending } = useUploadFiles()

	const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return

		const formData = new FormData()
		Array.from(files).forEach((file) => formData.append('images', file))

		const resp = await uploadFiles(formData)
		onChange([...value, ...resp.uris])

		e.target.value = ''
	}

	const handleRemove = (uri: string) => {
		onChange(value.filter((v) => v !== uri))
	}

	return (
		<div className={cn('space-y-2', className)}>
			<div className='flex flex-wrap gap-2'>
				{value.map((uri) => (
					<div
						key={uri}
						className='group relative size-20 overflow-hidden rounded-md border'
					>
						<img
							src={getMediaUri(uri)}
							alt=''
							className='size-full object-cover'
						/>
						<button
							type='button'
							onClick={() => handleRemove(uri)}
							className='absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100'
							aria-label='Xóa ảnh'
						>
							<X className='size-3' />
						</button>
					</div>
				))}

				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					disabled={isPending}
					className='flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:opacity-50'
				>
					{isPending ? (
						<Loader2 className='size-5 animate-spin' />
					) : (
						<Upload className='size-5' />
					)}
					<span className='text-[11px]'>Thêm ảnh</span>
				</button>
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				className='hidden'
				onChange={handleFilesSelected}
			/>
		</div>
	)
}

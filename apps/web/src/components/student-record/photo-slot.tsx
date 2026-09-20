import { ErrorMessages } from '@/components/FormComponents'
import { cn } from '@/lib/utils'
import { Camera } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAX_BYTES = 2_000_000

// A 3x4 portrait slot, the photo format used on personnel records.
export default function PhotoSlot({
	field,
	className,
	compact = false,
	currentSrc
}: {
	field: any
	className?: string
	compact?: boolean
	// The photo already saved on the record, shown until a new one is chosen.
	currentSrc?: string
}) {
	const file: File | null = field.state.value
	const inputRef = useRef<HTMLInputElement>(null)
	const [tooLarge, setTooLarge] = useState(false)
	const [chosenUrl, setChosenUrl] = useState<string>()
	const previewUrl = chosenUrl ?? currentSrc

	useEffect(() => {
		if (!file) {
			setChosenUrl(undefined)
			return
		}
		const url = URL.createObjectURL(file)
		setChosenUrl(url)
		return () => URL.revokeObjectURL(url)
	}, [file])

	const errors: string[] = field.state.meta.errors.map((e: unknown) =>
		typeof e === 'string' ? e : ((e as { message?: string })?.message ?? '')
	)

	return (
		<div className={cn('space-y-2', className)}>
			<button
				type='button'
				onClick={() => inputRef.current?.click()}
				className='group relative block aspect-[3/4] w-full overflow-hidden rounded-sm border border-gold/60 bg-sidebar-accent outline-none ring-offset-2 ring-offset-sidebar focus-visible:ring-2 focus-visible:ring-gold'
			>
				{previewUrl ? (
					<img
						src={previewUrl}
						alt='Ảnh 3x4 của quân nhân'
						className='size-full object-cover'
					/>
				) : (
					<span className='flex size-full flex-col items-center justify-center gap-2 px-3 text-center text-sm text-sidebar-foreground/70'>
						<Camera className='size-6' aria-hidden />
						{compact ? (
							<span className='sr-only'>Chọn ảnh 3x4</span>
						) : (
							'Chọn ảnh 3x4'
						)}
					</span>
				)}
				{previewUrl && !compact && (
					<span className='absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
						Đổi ảnh
					</span>
				)}
			</button>
			<input
				ref={inputRef}
				type='file'
				accept='image/png,image/jpeg,image/webp'
				className='hidden'
				aria-label='Ảnh quân nhân'
				onBlur={field.handleBlur}
				onChange={(e) => {
					const picked = e.target.files?.[0] ?? null
					setTooLarge(!!picked && picked.size > MAX_BYTES)
					if (picked && picked.size > MAX_BYTES) return
					field.handleChange(picked)
				}}
			/>
			{!compact && (
				<p className='text-xs text-sidebar-foreground/60'>
					JPG, PNG hoặc WebP, tối đa 2 MB
				</p>
			)}
			{tooLarge && (
				<p
					role='alert'
					className={cn('text-sm text-gold', compact && 'sr-only')}
				>
					Ảnh vượt quá 2 MB, hãy chọn ảnh nhỏ hơn.
				</p>
			)}
			{field.state.meta.isTouched && errors.length > 0 && (
				<div className='text-sm text-gold [&>div]:mt-0 [&>div]:font-normal [&>div]:text-gold'>
					<ErrorMessages errors={errors} />
				</div>
			)}
		</div>
	)
}

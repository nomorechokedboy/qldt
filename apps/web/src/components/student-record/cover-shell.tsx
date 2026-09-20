import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import PhotoSlot from './photo-slot'
import useRecordSummary from './use-record-summary'

export interface RecordSummary {
	fullName?: string
	rank?: string
	position?: string
	unit?: string
}

export interface CoverProps {
	form: any
	// Name of the form field that holds the chosen photo file.
	photoField: string
	// The photo already saved on the record, if any.
	currentSrc?: string
	fallback?: { position?: string; unit?: string }
}

function Line({ value, empty }: { value?: string; empty: string }) {
	return (
		<p
			className={cn(
				'truncate text-sm',
				value ? 'text-sidebar-foreground' : 'text-sidebar-foreground/45'
			)}
		>
			{value ?? empty}
		</p>
	)
}

// The 3x4 portrait of a record that is only being read.
export function Portrait({
	src,
	className
}: {
	src: string
	className?: string
}) {
	return (
		<div
			className={cn(
				'aspect-[3/4] overflow-hidden rounded-sm border border-gold/60 bg-sidebar-accent',
				className
			)}
		>
			<img
				src={src}
				alt='Ảnh 3x4 của quân nhân'
				className='size-full object-cover'
			/>
		</div>
	)
}

// Desktop-only left pane: who the record is about, with `children` (the
// section list) pinned to the bottom.
export function CoverFrame({
	photo,
	summary,
	badge,
	children
}: {
	photo: ReactNode
	summary: RecordSummary
	badge?: ReactNode
	children: ReactNode
}) {
	return (
		<aside className='hidden min-h-0 flex-col gap-6 overflow-y-auto bg-sidebar p-6 text-sidebar-foreground [background-image:var(--sidebar-gradient)] lg:flex'>
			{photo}

			<div className='space-y-1'>
				<p
					className={cn(
						'font-serif text-2xl font-semibold leading-tight',
						!summary.fullName && 'text-sidebar-foreground/45'
					)}
				>
					{summary.fullName ?? 'Họ và tên'}
				</p>
				<Line value={summary.rank} empty='Cấp bậc' />
				<Line value={summary.position} empty='Chức vụ' />
				<Line value={summary.unit} empty='Đơn vị' />
				{badge}
			</div>

			<div className='mt-auto'>{children}</div>
		</aside>
	)
}

// Below the lg breakpoint the cover collapses into this strip; `children`
// goes under the name (progress or section pills).
export function CompactFrame({
	photo,
	title,
	subtitle,
	children
}: {
	photo: ReactNode
	title: string
	subtitle: ReactNode
	children: ReactNode
}) {
	return (
		<header className='space-y-3 border-b bg-secondary px-4 py-3 pr-12 lg:hidden'>
			<div className='flex items-center gap-3'>
				<div className='w-12 shrink-0'>{photo}</div>
				<div className='min-w-0'>
					<p className='truncate font-serif text-lg font-semibold'>
						{title}
					</p>
					<p className='truncate text-sm text-muted-foreground'>
						{subtitle}
					</p>
				</div>
			</div>
			{children}
		</header>
	)
}

// The cover of a form: the record as it is being written.
export function CoverShell({
	form,
	photoField,
	currentSrc,
	fallback,
	children
}: CoverProps & { children: ReactNode }) {
	const summary = useRecordSummary(form, fallback)

	return (
		<CoverFrame
			summary={summary}
			photo={
				<form.AppField name={photoField}>
					{(field: any) => (
						<PhotoSlot
							field={field}
							currentSrc={currentSrc}
							className='w-36'
						/>
					)}
				</form.AppField>
			}
		>
			{children}
		</CoverFrame>
	)
}

export function CompactHeader({
	form,
	photoField,
	currentSrc,
	fallback,
	title,
	subtitle,
	children
}: CoverProps & {
	title: string
	subtitle: ReactNode
	children: ReactNode
}) {
	const summary = useRecordSummary(form, fallback)

	return (
		<CompactFrame
			title={summary.fullName ?? title}
			subtitle={subtitle}
			photo={
				<form.AppField name={photoField}>
					{(field: any) => (
						<PhotoSlot
							field={field}
							currentSrc={currentSrc}
							compact
						/>
					)}
				</form.AppField>
			}
		>
			{children}
		</CompactFrame>
	)
}

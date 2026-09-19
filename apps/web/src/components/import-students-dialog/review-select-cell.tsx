import { EllipsisText } from '@/components/data-table/ellipsis-text'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import { reviewInputClass } from './review-input-class'

// Lists shorter than this render without the search box - it's not worth
// the extra chrome for e.g. the 5-option activityStatus select.
const SELECT_SEARCH_THRESHOLD = 8

// shadcn (Radix) Select-based review-table cell, matching the pattern
// ToggleInput's 'select' case already uses elsewhere in the app. Radix's
// Select has no built-in text filtering (unlike the Command-based
// ReviewComboboxCell above), so for longer catalogs (units, provinces,
// wards) this adds a plain search input pinned to the top of the content
// and filters SelectItems client-side - keydown is stopped from bubbling
// so typing doesn't trigger Radix's own single-key typeahead-jump.
// Radix also rejects an empty-string SelectItem value, so "no selection"
// is represented by an unset Select value (renders the placeholder)
// instead of a `-- Chọn... --` item like the native <select> this
// replaces used.
export function ReviewSelectCell({
	value,
	onChange,
	options,
	placeholder,
	disabled,
	searchPlaceholder = 'Tìm kiếm...'
}: {
	value: string
	onChange: (value: string) => void
	options: { value: string; label: string }[]
	placeholder: string
	disabled?: boolean
	searchPlaceholder?: string
}) {
	const [search, setSearch] = useState('')
	// `search` drives the input's own value so typing itself stays instant;
	// `debouncedSearch` is what actually filters/re-renders the (possibly
	// hundreds-long) SelectItem list, so a fast typist doesn't re-filter
	// and re-render on every single keystroke.
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const searchInputRef = useRef<HTMLInputElement>(null)
	const selected = options.find((o) => o.value === value)
	const searchable = options.length > SELECT_SEARCH_THRESHOLD

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedSearch(search), 200)
		return () => clearTimeout(timeout)
	}, [search])

	const filteredOptions = useMemo(() => {
		const q = debouncedSearch.trim().toLowerCase()
		if (!q) return options
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, debouncedSearch])

	return (
		<Select
			value={value || undefined}
			onValueChange={onChange}
			disabled={disabled}
			onOpenChange={(open) => {
				if (!open) {
					setSearch('')
					setDebouncedSearch('')
					return
				}
				if (searchable) {
					// SelectContent has no `onOpenAutoFocus` prop (unlike
					// Popover/Dialog) - Radix's Select always focuses the
					// selected/first item itself on open and there's no way
					// to hook that. Steal focus back onto the search input
					// right after, once that's done.
					setTimeout(() => searchInputRef.current?.focus(), 0)
				}
			}}
		>
			<SelectTrigger
				className={cn(reviewInputClass, 'justify-between font-normal')}
			>
				<SelectValue placeholder={placeholder}>
					<EllipsisText maxWidth='160px'>
						{selected?.label ?? placeholder}
					</EllipsisText>
				</SelectValue>
			</SelectTrigger>
			<SelectContent position='popper' sideOffset={4}>
				{searchable && (
					<div className='sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover px-2 py-1.5'>
						<input
							ref={searchInputRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Escape') return
								e.stopPropagation()
							}}
							placeholder={searchPlaceholder}
							className='w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
						/>
					</div>
				)}
				{searchable && filteredOptions.length === 0 ? (
					<div className='px-2 py-1.5 text-sm text-muted-foreground'>
						Không tìm thấy.
					</div>
				) : (
					filteredOptions.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))
				)}
			</SelectContent>
		</Select>
	)
}

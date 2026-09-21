import { EllipsisText } from '@/components/data-table/ellipsis-text'
import { Button } from '@/components/ui/button'
import {
	Check,
	ChevronDown,
	ChevronsUpDown,
	Edit3,
	Loader2,
	X
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { InputType } from './types'

const spinner = (
	<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
)

// The save/cancel pair beside an editor, or a spinner while the save runs.
// `onMouseDown` keeps the editor from losing focus (and closing) before the
// click lands.
export function EditActions({
	onSave,
	onCancel,
	disabled,
	isLoading
}: {
	onSave: () => void
	onCancel: () => void
	disabled: boolean
	isLoading: boolean
}) {
	if (isLoading) return spinner

	return (
		<>
			<Button
				size='sm'
				variant='ghost'
				onClick={onSave}
				onMouseDown={(e) => e.preventDefault()}
				className='h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 hover:bg-accent'
				disabled={disabled}
			>
				<Check className='h-4 w-4' />
			</Button>
			<Button
				size='sm'
				variant='ghost'
				onClick={onCancel}
				onMouseDown={(e) => e.preventDefault()}
				className='h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-accent'
				disabled={disabled}
			>
				<X className='h-4 w-4' />
			</Button>
		</>
	)
}

// Only the pick-from-a-list types hint that a dropdown is behind the click.
function DropdownHint({ type }: { type: InputType }) {
	if (type === 'select')
		return <ChevronDown className='h-4 w-4 text-muted-foreground' />
	if (type === 'combobox')
		return <ChevronsUpDown className='h-4 w-4 text-muted-foreground' />
	return null
}

// The resting state: the value as text, with a hover affordance (unless it
// can't be edited) and a dropdown hint for the pick-from-a-list types.
export function DisplayValue({
	children,
	isEmpty,
	onDoubleClick,
	type,
	readOnly,
	disabled,
	isLoading,
	className,
	ellipsisMaxWidth
}: {
	children: ReactNode
	isEmpty: boolean
	onDoubleClick: () => void
	type: InputType
	readOnly: boolean
	disabled: boolean
	isLoading: boolean
	className: string
	ellipsisMaxWidth?: string
}) {
	const locked = disabled || readOnly || isLoading

	return (
		<div
			className={`group flex items-center gap-2 min-h-[40px] px-3 py-2 border border-transparent rounded-md transition-colors ${
				readOnly
					? ''
					: disabled || isLoading
						? 'pointer-events-none opacity-70 cursor-not-allowed'
						: 'cursor-pointer hover:border-border hover:bg-muted/50'
			} ${className}`}
			onDoubleClick={locked ? undefined : onDoubleClick}
		>
			<EllipsisText
				className={`flex-1 ${isEmpty ? 'text-muted-foreground' : ''}`}
				maxWidth={ellipsisMaxWidth}
			>
				{children}
			</EllipsisText>
			<div className='flex items-center gap-1'>
				{!readOnly && <DropdownHint type={type} />}
				{!locked && (
					<Edit3 className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
				)}
			</div>
			{isLoading && spinner}
		</div>
	)
}

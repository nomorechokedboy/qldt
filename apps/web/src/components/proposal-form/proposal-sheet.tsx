import type { FormEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface ProposalSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	triggerLabel: string
	title: string
	formId: string
	onSubmit: (e: FormEvent) => void
	submitLabel: string
	isPending: boolean
	// What the proposal will do, in a sentence; shown once nothing is missing.
	summary: string
	// The next thing the person still has to fill in, or null when the form is
	// complete. Doubles as the reason the submit button is disabled.
	missing: string | null
	// The proposal's own fields (left pane).
	fields: ReactNode
	// The trooper picker (right pane).
	troopers: ReactNode
}

// The "create proposal" button and the side sheet it opens: the fields beside
// the trooper list, and a footer that says what will be submitted (or what is
// still missing) next to the submit button. The panes sit side by side from
// the md breakpoint up and stack below it.
export default function ProposalSheet({
	open,
	onOpenChange,
	triggerLabel,
	title,
	formId,
	onSubmit,
	submitLabel,
	isPending,
	summary,
	missing,
	fields,
	troopers
}: ProposalSheetProps) {
	const { t } = useTranslation('proposals')

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					{triggerLabel}
				</Button>
			</SheetTrigger>
			<SheetContent className='w-full gap-0 overflow-hidden sm:max-w-xl md:max-w-4xl'>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
				</SheetHeader>
				<form
					id={formId}
					className='grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-4 pb-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:overflow-hidden'
					onSubmit={onSubmit}
				>
					<div className='space-y-4 md:overflow-y-auto md:pr-1'>
						{fields}
					</div>
					<div className='flex h-[28rem] min-h-0 flex-col md:h-auto md:border-l md:pl-6'>
						{troopers}
					</div>
				</form>
				<SheetFooter className='border-t sm:flex-row sm:items-center sm:justify-between'>
					<p
						aria-live='polite'
						className={cn(
							'text-sm',
							missing ? 'text-muted-foreground' : 'font-medium'
						)}
					>
						{missing ?? summary}
					</p>
					<Button
						type='submit'
						form={formId}
						className='shrink-0'
						disabled={isPending || missing !== null}
					>
						{isPending ? t('common.creating') : submitLabel}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

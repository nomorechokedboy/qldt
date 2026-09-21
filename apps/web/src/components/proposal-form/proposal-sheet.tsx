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

interface ProposalSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	triggerLabel: string
	title: string
	formId: string
	onSubmit: (e: FormEvent) => void
	submitLabel: string
	isPending: boolean
	submitDisabled: boolean
	children: ReactNode
}

// The "create proposal" button and the side sheet it opens: title, the form
// body (its fields are `children`), and a submit button in the footer.
export default function ProposalSheet({
	open,
	onOpenChange,
	triggerLabel,
	title,
	formId,
	onSubmit,
	submitLabel,
	isPending,
	submitDisabled,
	children
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
			<SheetContent className='w-full overflow-hidden sm:max-w-xl'>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
				</SheetHeader>
				<form
					id={formId}
					className='flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-4 pb-4'
					onSubmit={onSubmit}
				>
					{children}
				</form>
				<SheetFooter>
					<Button
						type='submit'
						form={formId}
						disabled={isPending || submitDisabled}
					>
						{isPending ? t('common.creating') : submitLabel}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

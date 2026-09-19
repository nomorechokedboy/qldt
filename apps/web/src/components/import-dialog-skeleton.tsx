import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

interface ImportDialogSkeletonProps {
	isOpen: boolean
	onClose: () => void
	title: string
}

// Suspense fallback shown while a lazy import-dialog chunk (exceljs/xlsx are
// heavy) is still downloading - mirrors the real dialog's initial layout so
// there's no visible reflow once the module resolves.
export function ImportDialogSkeleton({
	isOpen,
	onClose,
	title
}: ImportDialogSkeletonProps) {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose()
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<Skeleton className='h-4 w-3/4' />
				</DialogHeader>

				<div className='space-y-6'>
					<div className='flex items-start gap-3 rounded-lg border bg-muted/30 p-4'>
						<Skeleton className='h-5 w-5 flex-shrink-0 rounded-full' />
						<div className='w-full space-y-2'>
							<Skeleton className='h-4 w-2/3' />
							<Skeleton className='h-4 w-1/2' />
							<Skeleton className='h-4 w-3/5' />
						</div>
					</div>

					<div className='flex items-center justify-between rounded-lg border p-4'>
						<div className='flex items-center space-x-3'>
							<Skeleton className='h-8 w-8 rounded-md' />
							<div className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-3 w-48' />
							</div>
						</div>
						<Skeleton className='h-9 w-28' />
					</div>

					<div className='space-y-4'>
						<Skeleton className='h-4 w-40' />
						<Skeleton className='h-40 w-full rounded-lg' />
					</div>
				</div>

				<div className='flex justify-end gap-2 pt-2'>
					<Skeleton className='h-9 w-20' />
				</div>
			</DialogContent>
		</Dialog>
	)
}

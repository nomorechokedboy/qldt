import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toastApiError } from '@/lib/api-error'
import type { ProposalAdapter, ProposalRow } from './proposal-adapter'

export default function RejectDialog<TRow extends ProposalRow>({
	adapter,
	id,
	open,
	onOpenChange,
	onSuccess
}: {
	adapter: ProposalAdapter<TRow>
	id: number
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: () => void
}) {
	const { t } = useTranslation('proposals')
	const { kind } = adapter
	const [reason, setReason] = useState('')
	const rejectMutation = adapter.useReject()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!reason.trim()) {
			toast.error(t('reject.reasonRequired'))
			return
		}
		try {
			await rejectMutation.mutateAsync({ id, reason })
			toast.success(t(`${kind}.rejected`))
			setReason('')
			onOpenChange(false)
			onSuccess?.()
		} catch (err) {
			toastApiError(t(`${kind}.rejectFailed`), err)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t(`${kind}.rejectTitle`)}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='reject-reason'>
							{t('reject.reasonLabel')}
						</Label>
						<Textarea
							id='reject-reason'
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							required
						/>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('common.cancel')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							variant='destructive'
							disabled={rejectMutation.isPending}
						>
							{rejectMutation.isPending
								? t('reject.submitting')
								: t('common.reject')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

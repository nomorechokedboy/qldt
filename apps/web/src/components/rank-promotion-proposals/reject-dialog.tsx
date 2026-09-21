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
import { useRejectRankPromotionProposal } from '@/hooks/useRankPromotionProposalActions'
import { toastApiError } from '@/lib/api-error'

export default function RejectDialog({
	id,
	open,
	onOpenChange,
	onSuccess
}: {
	id: number
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: () => void
}) {
	const { t } = useTranslation('proposals')
	const [reason, setReason] = useState('')
	const rejectMutation = useRejectRankPromotionProposal()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!reason.trim()) {
			toast.error(t('reject.reasonRequired'))
			return
		}
		try {
			await rejectMutation.mutateAsync({ id, reason })
			toast.success(t('rank.rejected'))
			setReason('')
			onOpenChange(false)
			onSuccess?.()
		} catch (err) {
			toastApiError(t('rank.rejectFailed'), err)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('rank.rejectTitle')}</DialogTitle>
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

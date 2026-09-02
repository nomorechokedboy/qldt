import { useState } from 'react'
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
import { useRejectTransferRequest } from '@/hooks/useTransferRequestActions'
import { getErrorMessage } from '@/lib/utils'

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
	const [reason, setReason] = useState('')
	const rejectMutation = useRejectTransferRequest()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!reason.trim()) {
			toast.error('Vui lòng nhập lý do từ chối')
			return
		}
		try {
			await rejectMutation.mutateAsync({ id, reason })
			toast.success('Đã từ chối yêu cầu chuyển giao')
			setReason('')
			onOpenChange(false)
			onSuccess?.()
		} catch (err) {
			toast.error(getErrorMessage(err, 'Từ chối yêu cầu thất bại!'))
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Từ chối yêu cầu chuyển giao</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='reject-reason'>Lý do từ chối</Label>
						<Textarea
							id='reject-reason'
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							required
						/>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>Hủy</Button>
						</DialogClose>
						<Button
							type='submit'
							variant='destructive'
							disabled={rejectMutation.isPending}
						>
							{rejectMutation.isPending
								? 'Đang từ chối...'
								: 'Từ chối'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

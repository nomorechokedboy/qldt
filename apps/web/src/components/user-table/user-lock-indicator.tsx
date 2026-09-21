import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter
} from '@/components/ui/dialog'
import useLockedUsers, { LOCKED_USERS_QUERY_KEY } from '@/hooks/useLockedUsers'
import { useUnlockUser } from './useUnlockUser'
import { Trans, useTranslation } from 'react-i18next'
import { toastApiError } from '@/lib/api-error'

interface UserLockIndicatorProps {
	username: string
}

export default function UserLockIndicator({
	username
}: UserLockIndicatorProps) {
	const { t } = useTranslation('admin')
	const queryClient = useQueryClient()
	const { data: lockedUsernames = [] } = useLockedUsers()
	const { mutateAsync: unlockUserMutate, isPending } = useUnlockUser()
	const [confirmOpen, setConfirmOpen] = useState(false)

	const isLocked = lockedUsernames.includes(username.toLowerCase())
	if (!isLocked) {
		return null
	}

	async function handleUnlock() {
		try {
			await unlockUserMutate(username)
			toast.success(t('users.unlock.success'))
			queryClient.invalidateQueries({ queryKey: LOCKED_USERS_QUERY_KEY })
			setConfirmOpen(false)
		} catch (err) {
			toastApiError(t('users.unlock.failed'), err)
		}
	}

	return (
		<>
			<Button
				variant='ghost'
				size='icon'
				className='h-6 w-6 text-destructive hover:text-destructive'
				onClick={() => setConfirmOpen(true)}
				title={t('users.unlock.tooltip')}
			>
				<Lock className='h-4 w-4' />
			</Button>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className='max-w-md h-auto'>
					<DialogHeader>
						<DialogTitle>{t('users.unlock.title')}</DialogTitle>
						<DialogDescription>
							<Trans
								t={t}
								i18nKey='users.unlock.description'
								values={{ username }}
								components={{
									username: <span className='font-medium' />
								}}
							/>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setConfirmOpen(false)}
							disabled={isPending}
						>
							{t('common.cancel')}
						</Button>
						<Button onClick={handleUnlock} disabled={isPending}>
							{isPending && (
								<Loader2 className='w-4 h-4 mr-2 animate-spin' />
							)}
							{t('users.unlock.action')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

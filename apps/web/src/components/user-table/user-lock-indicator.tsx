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
import { getErrorMessage } from '@/lib/utils'
import useLockedUsers, { LOCKED_USERS_QUERY_KEY } from '@/hooks/useLockedUsers'
import { useUnlockUser } from './useUnlockUser'

interface UserLockIndicatorProps {
	username: string
}

export default function UserLockIndicator({
	username
}: UserLockIndicatorProps) {
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
			toast.success('Đã mở khóa đăng nhập cho người dùng')
			queryClient.invalidateQueries({ queryKey: LOCKED_USERS_QUERY_KEY })
			setConfirmOpen(false)
		} catch (err) {
			toast.error(getErrorMessage(err, 'Mở khóa đăng nhập thất bại'))
		}
	}

	return (
		<>
			<Button
				variant='ghost'
				size='icon'
				className='h-6 w-6 text-destructive hover:text-destructive'
				onClick={() => setConfirmOpen(true)}
				title='Tài khoản đang bị khóa đăng nhập do nhập sai mật khẩu nhiều lần. Nhấn để mở khóa.'
			>
				<Lock className='h-4 w-4' />
			</Button>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className='max-w-md h-auto'>
					<DialogHeader>
						<DialogTitle>Mở khóa đăng nhập</DialogTitle>
						<DialogDescription>
							Tài khoản{' '}
							<span className='font-medium'>{username}</span> đang
							bị khóa đăng nhập do nhập sai mật khẩu quá số lần
							cho phép. Bạn có chắc chắn muốn mở khóa ngay bây giờ
							không?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setConfirmOpen(false)}
							disabled={isPending}
						>
							Hủy
						</Button>
						<Button onClick={handleUnlock} disabled={isPending}>
							{isPending && (
								<Loader2 className='w-4 h-4 mr-2 animate-spin' />
							)}
							Mở khóa
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

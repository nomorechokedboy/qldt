import { useAppForm } from '@/hooks/use-app-form'
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/ui/dialog'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { UpdateUser } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { userRankOptions } from '@/data/ranks'
import { userPositionOptions } from '@/data/positions'
import type { User } from '@/types'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

// Zod calls `error` while parsing, so messages follow the language in use at
// that moment instead of the one the module was loaded in.
const msg = (key: string) => ({
	error: () => i18n.t(key as never) as string
})

const schema = z.object({
	id: z.number(),
	displayName: z
		.string()
		.min(1, msg('admin:users.validation.displayNameRequired')),
	rank: z.string().optional(),
	position: z.string().optional()
})

interface ProfileEditFormProps {
	open: boolean
	setOpen: (open: boolean) => void
	user: User
}

export default function ProfileEditForm({
	open,
	setOpen,
	user
}: ProfileEditFormProps) {
	const { t } = useTranslation('admin')
	const queryClient = useQueryClient()

	const { mutateAsync } = useMutation({
		mutationFn: UpdateUser,
		onSuccess: () => {
			// Invalidate auth cache to refetch user data
			queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
			toast.success(t('profile.edit.success'))
			setOpen(false)
		},
		onError: (error) => {
			console.error('Failed to update profile:', error)
			toast.error(getErrorMessage(error, t('profile.edit.failed')))
		}
	})

	const form = useAppForm({
		defaultValues: {
			id: user.id,
			displayName: user.displayName,
			rank: user.rank || '',
			position: user.position || ''
		},
		onSubmit: async ({ value }: { value: any }) => {
			const parsed = schema.parse(value)
			await mutateAsync(parsed)
		},
		validators: {
			onBlur: schema
		}
	})

	useEffect(() => {
		if (open) {
			form.reset({
				id: user.id,
				displayName: user.displayName,
				rank: user.rank || '',
				position: user.position || ''
			})
		}
	}, [open, user])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('profile.edit.title')}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
					className='space-y-4'
				>
					<form.AppField name='displayName'>
						{(field: any) => (
							<field.TextField
								label={t('users.fields.displayName')}
							/>
						)}
					</form.AppField>

					<form.AppField name='rank'>
						{(field: any) => (
							<field.Select
								label={t('users.fields.rank')}
								placeholder={t('users.fields.selectRank')}
								values={userRankOptions}
								value={field.state.value}
							/>
						)}
					</form.AppField>

					<form.AppField name='position'>
						{(field: any) => (
							<field.Select
								label={t('users.fields.position')}
								placeholder={t('users.fields.selectPosition')}
								values={userPositionOptions}
								value={field.state.value}
							/>
						)}
					</form.AppField>

					{/* Read-only unit display */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>
							{t('users.fields.unit')}
						</label>
						<div className='border rounded-md px-3 py-2 bg-muted'>
							{user.unitName || '—'}
						</div>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('common.cancel')}
							</Button>
						</DialogClose>
						<form.AppForm>
							<form.SubscribeButton
								label={t('common.saveShort')}
							/>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

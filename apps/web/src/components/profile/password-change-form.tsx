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
import { ChangePassword } from '@/api'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect } from 'react'
import useAuth from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

// Zod calls `error` while parsing, so messages follow the language in use at
// that moment instead of the one the module was loaded in.
const msg = (key: string) => ({
	error: () => i18n.t(key as never) as string
})

const schema = z
	.object({
		prevPassword: z
			.string()
			.min(1, msg('admin:profile.validation.prevPasswordRequired')),
		password: z
			.string()
			.min(6, msg('admin:profile.validation.passwordMin')),
		confirmPassword: z
			.string()
			.min(1, msg('admin:profile.validation.confirmRequired'))
	})
	.refine((data) => data.password === data.confirmPassword, {
		error: () => i18n.t('admin:profile.validation.passwordMismatch'),
		path: ['confirmPassword']
	})

interface PasswordChangeFormProps {
	open: boolean
	setOpen: (open: boolean) => void
}

export default function PasswordChangeForm({
	open,
	setOpen
}: PasswordChangeFormProps) {
	const { t } = useTranslation('admin')
	const { logout } = useAuth()

	const { mutateAsync } = useMutation({
		mutationFn: ChangePassword,
		onSuccess: () => {
			toast.success(t('profile.password.success'))
			setOpen(false)
			// Logout user to force re-login with new password
			setTimeout(() => logout(), 1500)
		},
		onError: (error: any) => {
			console.error('Failed to change password:', error)
			toast.error(
				error?.message === 'Incorrect password'
					? t('profile.password.incorrect')
					: getErrorMessage(error, t('profile.password.failed'))
			)
		}
	})

	const form = useAppForm({
		defaultValues: {
			prevPassword: '',
			password: '',
			confirmPassword: ''
		},
		onSubmit: async ({ value, formApi }: { value: any; formApi: any }) => {
			const parsed = schema.parse(value)
			await mutateAsync({
				prevPassword: parsed.prevPassword,
				password: parsed.password
			})
			formApi.reset()
		},
		validators: {
			onBlur: schema
		}
	})

	useEffect(() => {
		if (open) {
			form.reset({
				prevPassword: '',
				password: '',
				confirmPassword: ''
			})
		}
	}, [open])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('profile.password.title')}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
					className='space-y-4'
				>
					<form.AppField name='prevPassword'>
						{(field: any) => (
							<field.TextField
								label={t('profile.password.current')}
								type='password'
								placeholder={t(
									'profile.password.currentPlaceholder'
								)}
							/>
						)}
					</form.AppField>

					<form.AppField name='password'>
						{(field: any) => (
							<field.TextField
								label={t('profile.password.new')}
								type='password'
								placeholder={t(
									'profile.password.newPlaceholder'
								)}
							/>
						)}
					</form.AppField>

					<form.AppField name='confirmPassword'>
						{(field: any) => (
							<field.TextField
								label={t('profile.password.confirm')}
								type='password'
								placeholder={t(
									'profile.password.confirmPlaceholder'
								)}
							/>
						)}
					</form.AppField>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('common.cancel')}
							</Button>
						</DialogClose>
						<form.AppForm>
							<form.SubscribeButton
								label={t('profile.password.title')}
							/>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

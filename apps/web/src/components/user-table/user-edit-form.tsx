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
import { useMutation } from '@tanstack/react-query'
import type { UpdateUserBody, User, UserUpdate } from '@/types'
import { toast } from 'sonner'
import { useEffect } from 'react'
import useUnitOptions from '@/hooks/useUnitOptions'
import { userRankOptions } from '@/data/ranks'
import { userPositionOptions } from '@/data/positions'
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
		id: z.number().optional(),
		displayName: z
			.string()
			.min(1, msg('admin:users.validation.displayNameRequired')),
		password: z.string().optional(),
		confirmPassword: z.string().optional(),
		unitId: z.preprocess(
			(val) => {
				if (typeof val === 'string') {
					return Number.parseInt(val)
				}
				return val
			},
			z.number().min(1, msg('admin:users.validation.unitRequired'))
		),
		isSuperUser: z.preprocess((val) => {
			if (val === 'true' || val === true) return true
			if (val === 'false' || val === false) return false
			return val
		}, z.boolean()),
		rank: z.string().optional(),
		position: z.string().optional()
	})
	.refine(
		(data) => {
			// If password provided, must match confirmPassword
			if (data.password && data.password.length > 0) {
				return data.password === data.confirmPassword
			}
			return true
		},
		{
			error: () => i18n.t('admin:profile.validation.passwordMismatch'),
			path: ['confirmPassword']
		}
	)
	.refine(
		(data) => {
			// If password provided, minimum length
			if (data.password && data.password.length > 0) {
				return data.password.length >= 6
			}
			return true
		},
		{
			error: () => i18n.t('admin:users.validation.passwordMin'),
			path: ['password']
		}
	)

export interface UserFormProps {
	onSuccess: (
		data: User,
		variables: UpdateUserBody,
		context: unknown
	) => unknown
	open: boolean
	setOpen: (open: boolean) => void
	onClose?: () => void
	editingUser?: UserUpdate | null
}

export default function UserEditForm({
	onSuccess,
	open,
	setOpen,
	onClose,
	editingUser
}: UserFormProps) {
	const { t } = useTranslation('admin')
	const { options: unitOptions } = useUnitOptions()

	const { mutateAsync } = useMutation({
		mutationFn: UpdateUser,
		onSuccess,
		onError: (error) => {
			console.error('Failed to create class:', error)
		}
	})

	const form = useAppForm({
		defaultValues: {
			id: editingUser?.id || 0,
			displayName: '',
			password: '',
			confirmPassword: '',
			unitId: '1',
			isSuperUser: 'false',
			rank: '',
			position: ''
		},
		onSubmit: async ({ value, formApi }: { value: any; formApi: any }) => {
			try {
				const parsed = schema.parse(value)

				// Remove password if empty, remove confirmPassword always
				const payload: any = { ...parsed }
				if (!payload.password || payload.password.length === 0) {
					delete payload.password
				}
				delete payload.confirmPassword

				await mutateAsync(payload)
				toast.success(t('users.edit.success'))
				formApi.reset()
			} catch (err) {
				console.error(err)
				toast.error(getErrorMessage(err, t('users.edit.failed')))
			} finally {
				setOpen(false)
			}
		},
		validators: {
			onBlur: schema
		}
	})

	const superUserOptions = [
		{ label: t('users.accountTypes.admin'), value: 'true' },
		{ label: t('users.accountTypes.regular'), value: 'false' }
	]
	useEffect(() => {
		if (open && editingUser) {
			form.reset({
				id: editingUser.id,
				displayName: editingUser.displayName,
				password: '',
				confirmPassword: '',
				unitId: editingUser.unitId?.toString() || '1',
				isSuperUser: editingUser.isSuperUser ? 'true' : 'false',
				rank: editingUser.rank || '',
				position: editingUser.position || ''
			})
		}
	}, [open, editingUser])
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('users.edit.title')}</DialogTitle>
				</DialogHeader>
				<div className='space-y-4'>
					<form
						className='space-y-4'
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
					>
						<div className='space-y-2'>
							<form.AppField name='displayName'>
								{(field: any) => (
									<field.TextField
										label={t('users.fields.displayName')}
									/>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='password'>
								{(field: any) => (
									<field.TextField
										label={t('users.edit.newPassword')}
										type='password'
										placeholder={t(
											'users.edit.newPasswordPlaceholder'
										)}
									/>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='confirmPassword'>
								{(field: any) => (
									<field.TextField
										label={t('users.edit.confirmPassword')}
										type='password'
										placeholder={t(
											'profile.password.confirmPlaceholder'
										)}
									/>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='unitId'>
								{(field: any) => (
									<>
										<field.Select
											label={t('users.fields.selectUnit')}
											placeholder={t(
												'users.fields.selectUnit'
											)}
											values={unitOptions}
											value={field.state.value?.toString()}
										/>
									</>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='rank'>
								{(field: any) => (
									<field.Select
										label={t('users.fields.rank')}
										placeholder={t(
											'users.fields.selectRank'
										)}
										values={userRankOptions}
										value={field.state.value}
									/>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='position'>
								{(field: any) => (
									<field.Select
										label={t('users.fields.position')}
										placeholder={t(
											'users.fields.selectPosition'
										)}
										values={userPositionOptions}
										value={field.state.value}
									/>
								)}
							</form.AppField>
						</div>

						<div></div>

						<div className='space-y-2'>
							<form.AppField name='isSuperUser'>
								{(field: any) => (
									<field.Select
										label={t('users.fields.accountType')}
										placeholder={t(
											'users.fields.accountType'
										)}
										values={superUserOptions}
										value={field.state.value}
									/>
								)}
							</form.AppField>
						</div>

						<DialogFooter>
							<DialogClose asChild>
								<Button
									onClick={() => setOpen(false)}
									variant='outline'
								>
									{t('common.cancel')}
								</Button>
							</DialogClose>

							<form.AppForm>
								<form.SubscribeButton
									label={t('common.edit')}
								/>
							</form.AppForm>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	)
}

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
import { CreateUser } from '@/api'
import { useMutation } from '@tanstack/react-query'
import type { User, UserBody, UserFormData } from '@/types'
import { toast } from 'sonner'
import useUnitOptions from '@/hooks/useUnitOptions'
import { userRankOptions } from '@/data/ranks'
import { userPositionOptions } from '@/data/positions'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import { toastApiError } from '@/lib/api-error'

// Zod calls `error` while parsing, so messages follow the language in use at
// that moment instead of the one the module was loaded in.
const msg = (key: string) => ({
	error: () => i18n.t(key as never) as string
})

const schema = z.object({
	username: z.string().min(1, msg('admin:users.validation.usernameRequired')),
	displayName: z
		.string()
		.min(1, msg('admin:users.validation.displayNameRequired')),
	password: z.string().min(1, msg('admin:users.validation.passwordRequired')),
	unitId: z.preprocess((val) => {
		if (typeof val === 'string') {
			return Number.parseInt(val)
		}

		return val
	}, z.number().optional()),
	isSuperUser: z.coerce.boolean(),
	rank: z.string().optional(),
	position: z.string().optional()
})

export interface UserFormProps {
	onSuccess: (data: User[], variables: UserBody, context: unknown) => unknown
	open: boolean
	setOpen: (open: boolean) => void
}

export default function UserForm({ onSuccess, open, setOpen }: UserFormProps) {
	const { t } = useTranslation('admin')
	const { options: unitOptions } = useUnitOptions()

	const { mutateAsync } = useMutation({
		mutationFn: CreateUser,
		onSuccess,
		onError: (error) => {
			console.error('Failed to create user:', error)
		}
	})
	const form = useAppForm({
		defaultValues: {
			username: '',
			password: '',
			displayName: '',
			unitId: undefined,
			isSuperUser: false,
			rank: '',
			position: ''
		},
		onSubmit: async ({ value, formApi }: { value: any; formApi: any }) => {
			try {
				value.isSuperUser = value.isSuperUser === 'true' ? true : false
				const parsed = schema.parse(value)
				await mutateAsync(parsed)
				toast.success(t('users.create.success'))
				formApi.reset()
			} catch (err) {
				console.error(err)
				toastApiError(t('users.create.failed'), err)
			} finally {
				setOpen(false)
			}
		},
		validators: {
			onBlur: schema
		}
	})
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('users.create.title')}</DialogTitle>
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
							<form.AppField name='username'>
								{(field: any) => (
									<field.TextField
										label={t('users.fields.username')}
									/>
								)}
							</form.AppField>
						</div>

						<div className='space-y-2'>
							<form.AppField name='password'>
								{(field: any) => (
									<field.TextField
										label={t('users.fields.password')}
										type='password'
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
										defaultValue={''}
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
										defaultValue={''}
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
										values={[
											{
												label: t(
													'users.accountTypes.admin'
												),
												value: 'true'
											},
											{
												label: t(
													'users.accountTypes.regular'
												),
												value: 'false'
											}
										]}
										defaultValue={'false'}
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
								<form.SubscribeButton label={t('common.add')} />
							</form.AppForm>
						</DialogFooter>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	)
}

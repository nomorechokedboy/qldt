import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { useAppForm } from '@/hooks/use-app-form'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InitAdmin } from '@/api'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { getErrorMessage } from '@/lib/utils'
import i18n from '@/i18n'

// Zod calls `error` while parsing, so messages follow the language in use at
// that moment instead of the one the module was loaded in.
const msg = (key: string) => ({
	error: () => i18n.t(key as never) as string
})

const InitAdminSchema = z
	.object({
		username: z
			.string()
			.nonempty(msg('units:initialize.admin.usernameRequired')),
		displayName: z
			.string()
			.nonempty(msg('units:initialize.admin.displayNameRequired')),

		password: z
			.string()
			.min(8, msg('units:initialize.admin.passwordMin'))
			.regex(/[A-Z]/, msg('units:initialize.admin.passwordUpper'))
			.regex(/[a-z]/, msg('units:initialize.admin.passwordLower'))
			.regex(/[0-9]/, msg('units:initialize.admin.passwordDigit')),

		confirmPassword: z
			.string()
			.nonempty(msg('units:initialize.admin.confirmRequired'))
	})
	.refine((data) => data.password === data.confirmPassword, {
		error: () => i18n.t('units:initialize.admin.confirmMismatch'),
		path: ['confirmPassword'] // highlight the correct field
	})

export interface InitializeAdminFormProps {
	rootUnitId: number
}

export default function InitializeAdminForm({
	rootUnitId
}: InitializeAdminFormProps) {
	const { t } = useTranslation('units')
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { mutateAsync } = useMutation({
		mutationFn: InitAdmin,
		onSuccess: () => {
			toast.success(t('initialize.admin.success'), {
				description: t('initialize.admin.successDescription')
			})
			// The root layout redirects back to /khoi-tao-qtv while
			// isInitAdmin is false, so update the cache synchronously
			// before navigating away, or that stale check bounces the
			// user right back here instead of reaching /login.
			queryClient.setQueryData(['isInitAdmin'], true)
			queryClient.invalidateQueries({ queryKey: ['isInitAdmin'] })
			navigate({ to: '/login', replace: true })
		},
		onError: (err) => {
			console.error('InitAdmin failed', err)
			toast.error(getErrorMessage(err, t('initialize.admin.failed')))
		}
	})
	const form = useAppForm({
		defaultValues: {
			username: '',
			password: '',
			confirmPassword: '',
			displayName: ''
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({ ...value, rootUnitId })
		},
		validators: { onChange: InitAdminSchema }
	})

	return (
		<Card className='w-full max-w-md border-border/50 shadow-lg'>
			<CardHeader className='space-y-1 pb-6'>
				<div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary'>
					<Shield className='h-6 w-6 text-primary-foreground' />
				</div>
				<CardTitle className='text-center text-2xl font-semibold tracking-tight'>
					{t('initialize.admin.title')}
				</CardTitle>
				<CardDescription className='text-center text-muted-foreground'>
					{t('initialize.admin.description')}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className='space-y-4'
				>
					<div className='space-y-2'>
						<form.AppField name='displayName'>
							{(field) => (
								<field.TextField
									label={t('initialize.admin.displayName')}
								/>
							)}
						</form.AppField>
					</div>

					<div className='space-y-2'>
						<form.AppField name='username'>
							{(field) => (
								<field.TextField
									label={t('initialize.admin.username')}
								/>
							)}
						</form.AppField>
					</div>

					<div className='space-y-2'>
						<form.AppField name='password'>
							{(field) => (
								<field.TextField
									type='password'
									label={t('initialize.admin.password')}
								/>
							)}
						</form.AppField>
					</div>

					<div className='space-y-2'>
						<form.AppField name='confirmPassword'>
							{(field) => (
								<field.TextField
									type='password'
									label={t(
										'initialize.admin.confirmPassword'
									)}
								/>
							)}
						</form.AppField>
					</div>

					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting
						]}
						children={([canSubmit, isSubmitting]) => (
							<Button
								className='w-full'
								disabled={!canSubmit}
								type='submit'
							>
								{isSubmitting
									? t('initialize.admin.submitting')
									: t('initialize.admin.submit')}
							</Button>
						)}
					/>
				</form>
			</CardContent>
		</Card>
	)
}

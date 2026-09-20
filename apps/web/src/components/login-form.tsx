import { useTranslation } from 'react-i18next'
import Monument from '@/assets/lu75.jpg'
import { ArtilleryEmblem } from '@/components/artillery-emblem'
import { LanguageSwitcher } from '@/components/language-switcher'
import PasswordInput from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppForm } from '@/hooks/use-app-form'
import useAuth from '@/hooks/useAuth'

const APP_VERSION = '1.0'

function FieldError({ id, errors }: { id: string; errors: unknown[] }) {
	const message = errors
		.map((e) => (typeof e === 'string' ? e : (e as any)?.message))
		.find(Boolean)
	if (!message) return null

	return (
		<p id={id} role='alert' className='mt-1.5 text-sm text-destructive'>
			{message}
		</p>
	)
}

export function LoginForm() {
	const { t } = useTranslation('auth')
	const { login } = useAuth()

	const form = useAppForm({
		defaultValues: {
			username: '',
			password: ''
		},
		onSubmit: async ({ value }) => {
			login(value)
		}
	})

	return (
		<main className='grid min-h-svh grid-cols-[minmax(0,1fr)] bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
			<aside className="relative isolate flex min-h-64 flex-col justify-end overflow-hidden bg-sidebar text-sidebar-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[image:var(--gradient-header)] after:content-[''] lg:min-h-svh lg:after:inset-x-auto lg:after:inset-y-0 lg:after:right-0 lg:after:h-auto lg:after:w-[3px]">
				<img
					src={Monument}
					alt=''
					className='absolute inset-0 -z-30 size-full object-cover object-[50%_18%] grayscale contrast-125'
				/>
				<div className='absolute inset-0 -z-20 bg-primary/60 mix-blend-multiply' />
				<div className='absolute inset-0 -z-10 bg-[linear-gradient(to_top,oklch(0.14_0.012_40)_6%,oklch(0.14_0.012_40/0.72)_38%,oklch(0.14_0.012_40/0.1)_75%)]' />
				<div
					className='absolute inset-0 -z-10 opacity-[0.1]'
					style={{ backgroundImage: 'var(--sidebar-texture)' }}
				/>

				<div className='flex items-end gap-4 p-6 lg:flex-col lg:items-start lg:gap-6 lg:p-12'>
					<ArtilleryEmblem
						variant='badge'
						className='size-16 shrink-0 rounded-lg drop-shadow-lg lg:size-24'
					/>
					<div className='max-w-md'>
						<h2 className='font-serif text-2xl font-bold leading-tight text-sidebar-foreground lg:text-4xl'>
							{t('brand.unit')}
						</h2>
						<p className='mt-1 text-sm text-sidebar-foreground/80 lg:mt-3 lg:text-base'>
							{t('brand.product')}
						</p>
						<p className='mt-6 hidden text-sm leading-relaxed text-sidebar-foreground/65 lg:block'>
							{t('brand.tagline')}
						</p>
					</div>
				</div>
			</aside>

			<section className='flex flex-col'>
				<div className='flex justify-end p-4 lg:p-6'>
					<LanguageSwitcher />
				</div>

				<div className='flex flex-1 items-center justify-center px-6 pb-10'>
					<div className='w-full max-w-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500'>
						<h1 className='font-serif text-3xl font-bold text-foreground'>
							{t('login.title')}
						</h1>
						<p className='mt-2 text-muted-foreground'>
							{t('login.subtitle')}
						</p>

						<form
							noValidate
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								form.handleSubmit()
							}}
							className='mt-8 space-y-5'
						>
							<form.Field
								name='username'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('login.usernameRequired')
											: undefined,
									onSubmit: ({ value }) =>
										!value
											? t('login.usernameRequired')
											: undefined
								}}
							>
								{(field) => {
									const invalid =
										field.state.meta.errors.length > 0
									return (
										<div>
											<Label
												htmlFor={field.name}
												className='mb-2'
											>
												{t('login.username')}
											</Label>
											<Input
												id={field.name}
												name={field.name}
												autoComplete='username'
												autoFocus
												className='h-11'
												aria-invalid={invalid}
												aria-describedby={
													invalid
														? `${field.name}-error`
														: undefined
												}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
											/>
											<FieldError
												id={`${field.name}-error`}
												errors={field.state.meta.errors}
											/>
										</div>
									)
								}}
							</form.Field>

							<form.Field
								name='password'
								validators={{
									onBlur: ({ value }) =>
										!value
											? t('login.passwordRequired')
											: undefined,
									onSubmit: ({ value }) =>
										!value
											? t('login.passwordRequired')
											: undefined
								}}
							>
								{(field) => {
									const invalid =
										field.state.meta.errors.length > 0
									return (
										<div>
											<Label
												htmlFor={field.name}
												className='mb-2'
											>
												{t('login.password')}
											</Label>
											<PasswordInput
												id={field.name}
												name={field.name}
												autoComplete='current-password'
												className='h-11'
												aria-invalid={invalid}
												aria-describedby={
													invalid
														? `${field.name}-error`
														: undefined
												}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														e.target.value
													)
												}
											/>
											<FieldError
												id={`${field.name}-error`}
												errors={field.state.meta.errors}
											/>
										</div>
									)
								}}
							</form.Field>

							<form.Subscribe
								selector={(state) => state.isSubmitting}
								children={(isSubmitting) => (
									<Button
										type='submit'
										disabled={isSubmitting}
										className='h-11 w-full text-base'
									>
										{isSubmitting
											? t('login.submitting')
											: t('login.submit')}
									</Button>
								)}
							/>
						</form>

						<p className='mt-6 text-sm text-muted-foreground'>
							{t('login.forgot')}
						</p>
					</div>
				</div>

				<p className='px-6 pb-6 text-xs text-muted-foreground lg:px-12'>
					{t('login.version', { version: APP_VERSION })}
				</p>
			</section>
		</main>
	)
}

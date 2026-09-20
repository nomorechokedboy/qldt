import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/i18n'
import { cn } from '@/lib/utils'

// Segmented switch between the app's languages. `tone` picks colours that
// read on the dark sidebar or on the light login page.
export function LanguageSwitcher({
	className,
	tone = 'default'
}: {
	className?: string
	tone?: 'default' | 'onDark'
}) {
	const { t, i18n } = useTranslation()

	return (
		<div
			role='group'
			aria-label={t('language.label')}
			className={cn(
				'inline-flex items-center rounded-md border p-0.5 text-xs font-semibold',
				tone === 'onDark'
					? 'border-sidebar-foreground/20'
					: 'border-border bg-card/70',
				className
			)}
		>
			{LANGUAGES.map((lang) => {
				const active = i18n.resolvedLanguage === lang.code
				return (
					<button
						key={lang.code}
						type='button'
						lang={lang.code}
						title={lang.label}
						aria-label={lang.label}
						aria-pressed={active}
						onClick={() => i18n.changeLanguage(lang.code)}
						className={cn(
							'rounded px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
							active
								? 'bg-primary text-primary-foreground'
								: tone === 'onDark'
									? 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
									: 'text-muted-foreground hover:text-foreground'
						)}
					>
						{lang.short}
					</button>
				)
			})}
		</div>
	)
}

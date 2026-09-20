import { STEPS } from '@/data'
import { CoverShell } from '@/components/student-record/cover-shell'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type useStudentWizard from './use-student-wizard'

type Wizard = ReturnType<typeof useStudentWizard>

// Desktop-only left pane: the record as it is being written, plus the steps.
export default function DossierCover({
	form,
	wizard
}: {
	form: any
	wizard: Wizard
}) {
	const { t } = useTranslation('student')

	return (
		<CoverShell form={form} photoField='avatar'>
			<nav aria-label={t('wizard.stepsNav')}>
				<ol className='space-y-1 border-t border-sidebar-border pt-4'>
					{STEPS.map((step, index) => {
						const current = index === wizard.currentStep
						const done = wizard.completedSteps.includes(index)
						return (
							<li key={step.id}>
								<button
									type='button'
									disabled={!wizard.canGoTo(index)}
									aria-current={current ? 'step' : undefined}
									onClick={() => wizard.goTo(index)}
									className={cn(
										'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold enabled:hover:bg-sidebar-accent',
										current && 'bg-sidebar-accent',
										!wizard.canGoTo(index) && 'opacity-50'
									)}
								>
									<span
										className={cn(
											'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
											current &&
												'bg-gold text-gold-foreground',
											!current &&
												done &&
												'bg-olive text-olive-foreground',
											!current &&
												!done &&
												'border border-sidebar-foreground/40'
										)}
									>
										{done && !current ? (
											<Check
												className='size-4'
												aria-label={t('wizard.done')}
											/>
										) : (
											index + 1
										)}
									</span>
									<span className='min-w-0'>
										<span className='block truncate text-sm font-medium'>
											{t(`steps.${step.id}.title`)}
										</span>
										<span className='block truncate text-xs text-sidebar-foreground/60'>
											{t(`steps.${step.id}.hint`)}
										</span>
									</span>
								</button>
							</li>
						)
					})}
				</ol>
			</nav>
		</CoverShell>
	)
}

import { STEPS } from '@/data'
import { CompactHeader as RecordHeader } from '@/components/student-record/cover-shell'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type useStudentWizard from './use-student-wizard'

type Wizard = ReturnType<typeof useStudentWizard>

export default function CompactHeader({
	form,
	wizard
}: {
	form: any
	wizard: Wizard
}) {
	const { t } = useTranslation('student')
	const step = STEPS[wizard.currentStep]

	return (
		<RecordHeader
			form={form}
			photoField='avatar'
			title={t('wizard.add')}
			subtitle={t('wizard.stepOf', {
				current: wizard.currentStep + 1,
				total: STEPS.length,
				title: t(`steps.${step.id}.title`)
			})}
		>
			<div
				role='progressbar'
				aria-valuemin={1}
				aria-valuemax={STEPS.length}
				aria-valuenow={wizard.currentStep + 1}
				className='flex gap-1'
			>
				{STEPS.map((s, index) => (
					<span
						key={s.id}
						className={cn(
							'h-1 flex-1 rounded-full',
							index <= wizard.currentStep
								? 'bg-primary'
								: 'bg-border'
						)}
					/>
				))}
			</div>
		</RecordHeader>
	)
}

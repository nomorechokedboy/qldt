import { STEPS } from '@/data'
import { CompactHeader as RecordHeader } from '@/components/student-record/cover-shell'
import { cn } from '@/lib/utils'
import type useStudentWizard from './use-student-wizard'

type Wizard = ReturnType<typeof useStudentWizard>

export default function CompactHeader({
	form,
	wizard
}: {
	form: any
	wizard: Wizard
}) {
	const step = STEPS[wizard.currentStep]

	return (
		<RecordHeader
			form={form}
			photoField='avatar'
			title='Thêm quân nhân'
			subtitle={`Bước ${wizard.currentStep + 1}/${STEPS.length}: ${step.title}`}
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

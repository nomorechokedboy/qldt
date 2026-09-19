import FamilyStep from '@/components/family-step'
import MilitaryStep from '@/components/military-step'
import ParentInfoStep from '@/components/parent-info-step'
import PersonalStep from '@/components/personal-step'
import { Button, buttonVariants } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { STEPS } from '@/data'
import type { Student, StudentBody } from '@/types'
import type { VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import CompactHeader from './compact-header'
import DossierCover from './dossier-cover'
import { STEP_HINTS } from './step-hints'
import useCreateStudentForm from './use-create-student-form'
import useStudentWizard from './use-student-wizard'

export interface StudentFormProps {
	onSuccess: (
		data: Student[],
		variables: StudentBody,
		context: unknown
	) => unknown
	buttonProps?: React.ComponentProps<'button'> &
		VariantProps<typeof buttonVariants> & { asChild?: boolean }
}

const STEP_COMPONENTS = [PersonalStep, MilitaryStep, ParentInfoStep, FamilyStep]

export default function StudentForm({
	onSuccess,
	buttonProps
}: StudentFormProps) {
	const [open, setOpen] = useState(false)
	const afterCreate = useRef(() => {})
	const scrollRef = useRef<HTMLFormElement>(null)

	const form = useCreateStudentForm({
		onSuccess,
		onCreated: () => afterCreate.current()
	})
	const wizard = useStudentWizard(form)
	afterCreate.current = () => {
		wizard.reset()
		setOpen(false)
	}

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0 })
	}, [wizard.currentStep])

	const Step = STEP_COMPONENTS[wizard.currentStep]
	const step = STEPS[wizard.currentStep]

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button {...buttonProps}>
					<Plus className='w-4 h-4 mr-2' />
					Thêm quân nhân
				</Button>
			</DialogTrigger>
			<DialogContent className='grid-cols-1 grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 lg:h-[85vh] lg:max-w-5xl lg:grid-cols-[18rem_minmax(0,1fr)]'>
				<DialogHeader className='sr-only'>
					<DialogTitle>Thêm quân nhân</DialogTitle>
					<DialogDescription>
						Điền lần lượt {STEPS.length} bước để tạo hồ sơ quân
						nhân.
					</DialogDescription>
				</DialogHeader>

				<DossierCover form={form} wizard={wizard} />

				<div className='flex min-h-0 flex-col bg-card'>
					<CompactHeader form={form} wizard={wizard} />

					<form
						ref={scrollRef}
						id='studentForm'
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (wizard.isLastStep) form.handleSubmit()
							else wizard.next()
						}}
						className='min-h-0 flex-1 overflow-y-auto px-4 py-5 no-scrollbar lg:px-8 lg:py-6 [&_label]:text-sm [&_label]:font-medium'
					>
						<div className='mb-6 hidden lg:block'>
							<h2 className='font-serif text-2xl font-semibold'>
								{step.title}
							</h2>
							<p className='text-sm text-muted-foreground'>
								{STEP_HINTS[step.id]}
							</p>
						</div>
						<div
							key={step.id}
							className='animate-in fade-in-0 duration-200 motion-reduce:animate-none'
						>
							<Step form={form} />
						</div>
					</form>

					<footer className='flex items-center justify-between gap-3 border-t px-4 py-3 lg:px-8'>
						<Button
							type='button'
							variant='outline'
							onClick={wizard.previous}
							disabled={wizard.currentStep === 0}
						>
							<ChevronLeft className='mr-1 size-4' />
							Quay lại
						</Button>
						{wizard.isLastStep ? (
							<form.Subscribe
								selector={(state: any) => [
									state.canSubmit,
									state.isSubmitting
								]}
							>
								{([canSubmit, isSubmitting]: boolean[]) => (
									<Button
										type='submit'
										form='studentForm'
										disabled={!canSubmit}
									>
										{isSubmitting
											? 'Đang thêm quân nhân...'
											: 'Thêm quân nhân'}
									</Button>
								)}
							</form.Subscribe>
						) : (
							<Button type='button' onClick={wizard.next}>
								Tiếp theo
								<ChevronRight className='ml-1 size-4' />
							</Button>
						)}
					</footer>
				</div>
			</DialogContent>
		</Dialog>
	)
}

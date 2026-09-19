import { STEPS } from '@/data'
import { useState } from 'react'
import { validateAndSetErrors } from './validation'

export const LAST_STEP = STEPS.length - 1

export default function useStudentWizard(form: any) {
	const [currentStep, setCurrentStep] = useState(0)
	const [completedSteps, setCompletedSteps] = useState<number[]>([])

	// Validates only the current step's fields before moving on.
	const next = () => {
		const step = STEPS[currentStep]
		const values = Object.fromEntries(
			step.fields.map((name) => [name, form.state.values[name]])
		)

		if (
			!validateAndSetErrors(form, step.validationSchema.safeParse(values))
		)
			return false

		for (const name of step.fields) {
			form.setFieldMeta(name, (prev: any) => ({ ...prev, errorMap: {} }))
		}
		setCompletedSteps((done) =>
			done.includes(currentStep) ? done : [...done, currentStep]
		)
		setCurrentStep((s) => Math.min(s + 1, LAST_STEP))
		return true
	}

	const previous = () => setCurrentStep((s) => Math.max(s - 1, 0))

	// Steps already passed stay reachable, plus the one right after them.
	const canGoTo = (index: number) =>
		index <= currentStep || completedSteps.includes(index - 1)

	const goTo = (index: number) => {
		if (canGoTo(index)) setCurrentStep(index)
	}

	const reset = () => {
		setCurrentStep(0)
		setCompletedSteps([])
	}

	return {
		currentStep,
		completedSteps,
		isLastStep: currentStep === LAST_STEP,
		next,
		previous,
		goTo,
		canGoTo,
		reset
	}
}

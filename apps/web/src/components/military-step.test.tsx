import { mockFetch } from '@/test/fetch-mock'
import { useAppForm } from '@/hooks/use-app-form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import MilitaryStep from './military-step'

beforeAll(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
})

function Harness() {
	const form = useAppForm({
		defaultValues: {
			rank: '',
			positionId: undefined,
			enlistmentPeriod: '',
			activityStatus: 'serving',
			politicalOrg: 'hcyu',
			politicalOrgOfficialDate: '',
			cpvId: '',
			cpvOfficialAt: '',
			contactPerson: { name: '', phoneNumber: '', address: '' }
		}
	})
	return <MilitaryStep form={form} />
}

function setup() {
	mockFetch(() => ({ body: { data: [] } }))
	render(
		<QueryClientProvider client={new QueryClient()}>
			<Harness />
		</QueryClientProvider>
	)
}

describe('MilitaryStep', () => {
	it.each(['Ngày vào Đoàn', 'Ngày vào Đảng'])(
		'lets %s be typed as day/month/year',
		(label) => {
			setup()
			const input = screen.getByLabelText(label) as HTMLInputElement

			for (const digit of '19052020') {
				fireEvent.change(input, {
					target: { value: input.value + digit }
				})
			}

			expect(input.value).toBe('19/05/2020')
		}
	)

	it('offers a calendar for both date fields', () => {
		setup()

		expect(
			screen.getAllByRole('button', { name: /Select date/ })
		).toHaveLength(2)
	})
})

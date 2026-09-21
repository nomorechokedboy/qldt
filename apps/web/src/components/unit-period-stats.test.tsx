import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import { currentPeriod, periodRange } from '@/lib/stats-period'
import UnitPeriodStats from './unit-period-stats'

afterEach(() => {
	vi.unstubAllGlobals()
})

const report = (from: string, to: string, assigned: number) => ({
	from,
	to,
	weaponActivity: {
		assigned,
		unassigned: 0,
		transferred: 0,
		damaged: 0,
		lost: 0,
		retired: 0
	},
	troopMovement: {
		joined: 4,
		transferredIn: 0,
		transferredOut: 0,
		promoted: 0,
		discharged: 3,
		cpvAdmitted: 0
	},
	supplyMovement: [
		{ materialTypeId: 1, materialTypeName: 'Gạo', received: 30, sent: 5 }
	]
})

function renderStats(fail = false) {
	const requests = mockFetch((req) => {
		if (fail) return { status: 500, body: { code: 'internal' } }
		const from = req.url.searchParams.get('from') ?? ''
		const to = req.url.searchParams.get('to') ?? ''
		// A whole month is a different answer from a whole quarter.
		return {
			body: report(from, to, dayjs(to).diff(from, 'day') > 40 ? 9 : 2)
		}
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	render(
		<QueryClientProvider client={client}>
			<UnitPeriodStats unitId={7} />
		</QueryClientProvider>
	)

	return requests
}

describe('UnitPeriodStats', () => {
	it('asks for the current month first and shows what came back', async () => {
		const requests = renderStats()
		const month = periodRange(currentPeriod('month'))

		expect(await screen.findByText('Gạo')).toBeTruthy()
		const asked = requests.requests.find((r) =>
			r.path.endsWith('/units/7/stats/period')
		)
		expect(asked?.url.searchParams.get('from')).toBe(month.from)
		expect(asked?.url.searchParams.get('to')).toBe(month.to)
		expect(screen.getByText('Quân nhân mới (tạo hồ sơ)')).toBeTruthy()
		expect(
			within(screen.getByText('Xuất ngũ').closest('li')!).getByText('3')
		).toBeTruthy()
		expect(screen.getByText(/không phản ánh mức tiêu hao/)).toBeTruthy()
	})

	it('refetches for the whole quarter when the kind changes', async () => {
		const requests = renderStats()
		await screen.findByText('Gạo')

		const quarterTab = screen.getByRole('tab', { name: 'Quý' })
		fireEvent.mouseDown(quarterTab)
		fireEvent.click(quarterTab)

		const quarter = periodRange(currentPeriod('quarter'))
		await waitFor(() =>
			expect(
				requests.requests.some(
					(r) =>
						r.url.searchParams.get('from') === quarter.from &&
						r.url.searchParams.get('to') === quarter.to
				)
			).toBe(true)
		)
		expect(await screen.findByText('9')).toBeTruthy()
	})

	it('tells the user when the figures could not be loaded', async () => {
		renderStats(true)

		expect(await screen.findByRole('alert')).toBeTruthy()
	})
})

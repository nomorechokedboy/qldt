import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import PositionCatalog from './position-catalog'

afterEach(() => {
	vi.unstubAllGlobals()
})

const unit = (id: number, name: string, level: string) => ({
	id,
	alias: name.toLowerCase(),
	name,
	level,
	children: []
})

function renderCatalog(rootLevel: string) {
	const positionQueries: string[] = []
	mockFetch((req) => {
		if (req.path.includes('position')) {
			positionQueries.push(req.url.search)
			return { body: { data: [] } }
		}

		return { body: { data: [unit(1, 'Root', rootLevel)] } }
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	render(
		<QueryClientProvider client={client}>
			<PositionCatalog />
		</QueryClientProvider>
	)

	return { positionQueries }
}

const tabNames = () => screen.getAllByRole('tab').map((t) => t.textContent)

describe('PositionCatalog level tabs', () => {
	it('offers the root unit level and every level below it', async () => {
		renderCatalog('regiment')

		await screen.findByRole('tab', { name: 'Trung đoàn' })
		expect(tabNames()).toEqual([
			'Tiểu đội',
			'Trung đội',
			'Đại đội',
			'Tiểu đoàn',
			'Cơ quan',
			'Lữ đoàn',
			'Trung đoàn'
		])
	})

	it('stops at a smaller root and opens on its level', async () => {
		const { positionQueries } = renderCatalog('company')

		await screen.findByRole('tab', { name: 'Đại đội' })
		expect(tabNames()).toEqual(['Tiểu đội', 'Trung đội', 'Đại đội'])
		expect(screen.getByRole('tab', { name: 'Đại đội' }).ariaSelected).toBe(
			'true'
		)
		await waitFor(() =>
			expect(positionQueries.some((q) => q.includes('company'))).toBe(
				true
			)
		)
	})

	it('keeps the tab the user picked', async () => {
		renderCatalog('division')

		fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Đại đội' }))
		fireEvent.click(screen.getByRole('tab', { name: 'Đại đội' }))
		await waitFor(() =>
			expect(
				screen.getByRole('tab', { name: 'Đại đội' }).ariaSelected
			).toBe('true')
		)
	})
})

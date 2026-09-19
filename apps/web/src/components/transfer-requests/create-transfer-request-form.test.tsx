import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import CreateTransferRequestForm from './create-transfer-request-form'

// Radix Select and Sheet lean on browser APIs jsdom does not implement.
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

const battalion = {
	id: 1,
	alias: 'd1',
	name: 'Tieu doan 1',
	level: 'battalion'
}
const company1 = {
	id: 2,
	alias: 'c1',
	name: 'Dai doi 1',
	level: 'company',
	parent: { id: 1, name: 'Tieu doan 1' }
}
const company2 = {
	id: 3,
	alias: 'c2',
	name: 'Dai doi 2',
	level: 'company',
	parent: { id: 1, name: 'Tieu doan 1' }
}
const platoon = {
	id: 4,
	alias: 'bch',
	name: 'Ban chi huy',
	level: 'platoon',
	parent: { id: 2, name: 'Dai doi 1' }
}

// What the caller can see, and the org-wide destination list, which also
// contains a unit the caller has no view of.
const scopedUnits = [battalion, company1, company2, platoon]
const destinationUnits = [
	{ id: 1, alias: 'd1', name: 'Tieu doan 1', level: 'battalion' },
	{ id: 2, alias: 'c1', name: 'Dai doi 1', level: 'company' },
	{ id: 3, alias: 'c2', name: 'Dai doi 2', level: 'company' },
	{ id: 90, alias: 'ext', name: 'Dai doi ngoai', level: 'company' }
]

function setup() {
	const mock = mockFetch(({ path }) => {
		if (path === '/units') return { body: { data: scopedUnits } }
		if (path === '/transfer-requests/destination-units')
			return { body: { data: destinationUnits } }
		return { body: { data: [] } }
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	render(
		<QueryClientProvider client={client}>
			<CreateTransferRequestForm />
		</QueryClientProvider>
	)
	return mock
}

const [SOURCE, DESTINATION] = [0, 1]

async function openForm() {
	fireEvent.click(
		screen.getByRole('button', { name: /Tạo yêu cầu bàn giao/ })
	)
	await screen.findByText('Yêu cầu bàn giao nguồn lực')
}

const openSelect = (index: number) =>
	fireEvent.keyDown(screen.getAllByRole('combobox')[index], { key: 'Enter' })

const optionNames = () =>
	screen.queryAllByRole('option').map((o) => o.textContent ?? '')

describe('CreateTransferRequestForm unit pickers', () => {
	it('offers only company-or-larger units as the source', async () => {
		setup()
		await openForm()

		openSelect(SOURCE)

		await waitFor(() => expect(optionNames().length).toBeGreaterThan(0))
		const names = optionNames().join('|')
		expect(names).toContain('Dai doi 1')
		expect(names).toContain('Dai doi 2')
		expect(names).toContain('Tieu doan 1')
		expect(names).not.toContain('Ban chi huy')
	})

	it('leaves the chosen source out of the destination list', async () => {
		setup()
		await openForm()

		openSelect(SOURCE)
		fireEvent.click(
			await screen.findByRole('option', { name: /Dai doi 1/ })
		)

		openSelect(DESTINATION)
		await waitFor(() => expect(optionNames().length).toBeGreaterThan(0))

		const names = optionNames()
		expect(names.some((n) => n.includes('Dai doi 2'))).toBe(true)
		expect(names.filter((n) => n.includes('Dai doi 1'))).toHaveLength(0)
	})

	it('lists destination units the caller has no view of', async () => {
		setup()
		await openForm()

		openSelect(SOURCE)
		fireEvent.click(
			await screen.findByRole('option', { name: /Dai doi 1/ })
		)

		openSelect(DESTINATION)

		expect(
			await screen.findByRole('option', { name: /Dai doi ngoai/ })
		).toBeTruthy()
	})

	it('asks for the eligible approvers once both units are chosen', async () => {
		const { requests } = setup()
		await openForm()

		openSelect(SOURCE)
		fireEvent.click(
			await screen.findByRole('option', { name: /Dai doi 1/ })
		)
		openSelect(DESTINATION)
		fireEvent.click(
			await screen.findByRole('option', { name: /Dai doi ngoai/ })
		)

		await waitFor(() => {
			const req = requests.find((r) =>
				r.path.includes('eligible-approvers')
			)
			expect(req?.url.searchParams.get('sourceUnitId')).toBe('2')
			expect(req?.url.searchParams.get('destinationUnitId')).toBe('90')
		})
	})
})

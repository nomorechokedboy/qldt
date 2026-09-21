import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import CreateTransferRequestForm from './create-transfer-request-form'

// Radix Select and Sheet lean on browser APIs jsdom does not implement.
beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
	// Removed again by unstubAllGlobals, so it is set up for every test.
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
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

// --- What can be moved, and what is sent -------------------------------

const stockOf = (
	id: number,
	unitId: number,
	materialTypeId: number,
	condition: string | null,
	quantity: number
) => ({ id, unitId, materialTypeId, condition, quantity })

const resources = {
	students: [
		{ id: 10, fullName: 'Le Van A', unitId: 2 },
		// Reached through the platoon beneath the source.
		{ id: 11, fullName: 'Pham Van B', unitId: 4 },
		// A squad member, attached to a unit only through their class.
		{ id: 13, fullName: 'Ngo Van D', class: { unit: { id: 4 } } },
		// Belongs to the other company.
		{ id: 12, fullName: 'Vu Van C', unitId: 3 }
	],
	assets: [
		{ id: 21, unitId: 2, materialTypeId: 100, serialNumber: 'SN-1' },
		{ id: 22, unitId: 3, materialTypeId: 100, serialNumber: 'SN-2' }
	],
	stocks: [
		stockOf(31, 2, 100, 'good', 10),
		stockOf(32, 4, 101, null, 5),
		stockOf(33, 3, 100, 'good', 8)
	],
	types: [
		{ id: 100, name: 'Ao mua' },
		{ id: 101, name: 'Giay' }
	],
	rooms: [
		{ id: 7, unitId: 3, name: 'Kho so 3' },
		{ id: 8, unitId: 2, name: 'Kho so 2' }
	]
}

function setupWithResources() {
	const mock = mockFetch((req) => {
		const { method, path } = req
		if (method === 'POST' && path === '/transfer-requests')
			return { body: { data: {} } }
		if (path === '/units') return { body: { data: scopedUnits } }
		if (path === '/transfer-requests/destination-units')
			return { body: { data: destinationUnits } }
		if (path === '/transfer-requests/eligible-approvers')
			return {
				body: { data: [{ id: 5, displayName: 'Tran Phe duyet' }] }
			}
		if (path === '/students') return { body: { data: resources.students } }
		if (path === '/material-assets')
			return { body: { data: resources.assets } }
		if (path === '/material-stocks')
			return { body: { data: resources.stocks } }
		if (path === '/material-types')
			return { body: { data: resources.types } }
		if (path === '/rooms') return { body: { data: resources.rooms } }
		return { body: { data: [] } }
	})
	render(
		<QueryClientProvider
			client={
				new QueryClient({
					defaultOptions: {
						queries: { retry: false },
						mutations: { retry: false }
					}
				})
			}
		>
			<CreateTransferRequestForm />
		</QueryClientProvider>
	)
	return mock
}

async function choose(index: number, option: RegExp | string) {
	openSelect(index)
	fireEvent.click(await screen.findByRole('option', { name: option }))
}

const showTab = (name: RegExp) =>
	fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0 })

// A stock's row, found by its text, and the checkbox in it.
const stockCheckbox = async (text: RegExp) => {
	const row = (await screen.findByText(text)).closest('div') as HTMLElement
	return within(row).getByRole('checkbox')
}

const post = (requests: { method: string }[]) =>
	requests.filter((r) => r.method === 'POST')

async function chooseUnits() {
	await choose(SOURCE, /Dai doi 1/)
	await choose(DESTINATION, /Dai doi 2/)
}

describe('CreateTransferRequestForm resources', () => {
	it('asks the user to pick a source before offering anything to move', async () => {
		setupWithResources()
		await openForm()

		expect(
			screen.getByText(
				'Chọn đơn vị nguồn để xem nguồn lực có thể chuyển giao'
			)
		).toBeTruthy()
		expect(screen.queryByRole('tab')).toBeNull()
	})

	it('offers the troopers of the source and the units beneath it, and no others', async () => {
		setupWithResources()
		await openForm()
		await choose(SOURCE, /Dai doi 1/)

		expect(
			await screen.findByRole('checkbox', { name: 'Le Van A' })
		).toBeTruthy()
		expect(
			screen.getByRole('checkbox', { name: 'Pham Van B' })
		).toBeTruthy()
		expect(screen.getByRole('checkbox', { name: 'Ngo Van D' })).toBeTruthy()
		expect(screen.queryByRole('checkbox', { name: 'Vu Van C' })).toBeNull()
	})

	it('offers the assets of the source scope, named by type and serial', async () => {
		setupWithResources()
		await openForm()
		await choose(SOURCE, /Dai doi 1/)
		await screen.findByRole('checkbox', { name: 'Le Van A' })

		showTab(/Khí tài/)

		expect(
			await screen.findByRole('checkbox', { name: 'Ao mua — SN-1' })
		).toBeTruthy()
		expect(screen.queryByText(/SN-2/)).toBeNull()
	})

	it('offers the stocks of the source scope with what remains', async () => {
		setupWithResources()
		await openForm()
		await choose(SOURCE, /Dai doi 1/)
		await screen.findByRole('checkbox', { name: 'Le Van A' })

		showTab(/Vật tư/)

		expect(await stockCheckbox(/Ao mua \(good\) — còn 10/)).toBeTruthy()
		expect(await stockCheckbox(/Giay .* — còn 5/)).toBeTruthy()
		expect(screen.getAllByRole('checkbox')).toHaveLength(2)
	})

	it('says so when the source has nothing of a kind', async () => {
		resources.assets.length = 0
		try {
			setupWithResources()
			await openForm()
			await choose(SOURCE, /Dai doi 1/)
			await screen.findByRole('checkbox', { name: 'Le Van A' })

			showTab(/Khí tài/)

			expect(
				await screen.findByText('Không có khí tài nào thuộc đơn vị này')
			).toBeTruthy()
		} finally {
			resources.assets.push(
				{
					id: 21,
					unitId: 2,
					materialTypeId: 100,
					serialNumber: 'SN-1'
				},
				{ id: 22, unitId: 3, materialTypeId: 100, serialNumber: 'SN-2' }
			)
		}
	})

	it('offers only the rooms of the destination unit', async () => {
		setupWithResources()
		await openForm()
		await choose(SOURCE, /Dai doi 1/)
		await choose(DESTINATION, /Dai doi 2/)

		openSelect(2)
		expect(
			await screen.findByRole('option', { name: 'Kho so 3' })
		).toBeTruthy()
		expect(screen.queryByRole('option', { name: 'Kho so 2' })).toBeNull()
		expect(
			screen.getByRole('option', { name: 'Không chỉ định' })
		).toBeTruthy()
	})

	it('counts what is picked on each tab, and forgets it when the source changes', async () => {
		setupWithResources()
		await openForm()
		await choose(SOURCE, /Dai doi 1/)
		fireEvent.click(
			await screen.findByRole('checkbox', { name: 'Le Van A' })
		)
		fireEvent.click(screen.getByRole('checkbox', { name: 'Pham Van B' }))

		expect(screen.getByRole('tab', { name: /Quân nhân\s*2/ })).toBeTruthy()

		await choose(SOURCE, /Dai doi 2/)

		expect(screen.getByRole('tab', { name: /Quân nhân$/ })).toBeTruthy()
	})

	it('keeps the submit button off until both units and an approver are chosen', async () => {
		setupWithResources()
		await openForm()
		const submit = () =>
			screen.getByRole('button', {
				name: 'Tạo yêu cầu'
			}) as HTMLButtonElement
		expect(submit().disabled).toBe(true)

		await choose(SOURCE, /Dai doi 1/)
		await choose(DESTINATION, /Dai doi 2/)
		expect(submit().disabled).toBe(true)

		await choose(3, 'Tran Phe duyet')
		expect(submit().disabled).toBe(false)
	})

	it('sends nothing when nothing is picked to move', async () => {
		const { requests } = setupWithResources()
		await openForm()
		await chooseUnits()
		await choose(3, 'Tran Phe duyet')

		fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu' }))

		await new Promise((r) => setTimeout(r, 50))
		expect(post(requests)).toEqual([])
	})

	it('sends what was picked, with stock quantities kept within what remains', async () => {
		const { requests } = setupWithResources()
		await openForm()
		await chooseUnits()
		await choose(2, 'Kho so 3')
		await choose(3, 'Tran Phe duyet')

		fireEvent.click(
			await screen.findByRole('checkbox', { name: 'Le Van A' })
		)
		fireEvent.click(screen.getByRole('checkbox', { name: 'Ngo Van D' }))
		showTab(/Khí tài/)
		fireEvent.click(
			await screen.findByRole('checkbox', { name: 'Ao mua — SN-1' })
		)
		showTab(/Vật tư/)
		fireEvent.click(await stockCheckbox(/Ao mua \(good\)/))
		fireEvent.click(await stockCheckbox(/Giay/))

		const [first, second] = screen.getAllByRole('spinbutton')
		// Full quantity to begin with, then clamped to 1..remaining.
		expect((first as HTMLInputElement).value).toBe('10')
		fireEvent.change(first, { target: { value: '99' } })
		expect((first as HTMLInputElement).value).toBe('10')
		fireEvent.change(first, { target: { value: '3' } })
		fireEvent.change(second, { target: { value: '0' } })
		expect((second as HTMLInputElement).value).toBe('1')

		fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu' }))

		await waitFor(() => expect(post(requests)).toHaveLength(1))
		expect(post(requests)[0]).toMatchObject({
			path: '/transfer-requests',
			body: {
				sourceUnitId: 2,
				destinationUnitId: 3,
				destinationRoomId: 7,
				approverUserId: 5,
				troopers: [{ studentId: 10 }, { studentId: 13 }],
				materialAssets: [{ materialAssetId: 21 }],
				materialStocks: [
					{ materialTypeId: 100, condition: 'good', quantity: 3 },
					// No recorded condition counts as good.
					{ materialTypeId: 101, condition: 'good', quantity: 1 }
				]
			}
		})
	})

	it('sends no room when none is chosen', async () => {
		const { requests } = setupWithResources()
		await openForm()
		await chooseUnits()
		await choose(3, 'Tran Phe duyet')
		fireEvent.click(
			await screen.findByRole('checkbox', { name: 'Le Van A' })
		)

		fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu' }))

		await waitFor(() => expect(post(requests)).toHaveLength(1))
		expect(
			(
				post(requests)[0] as unknown as {
					body: { destinationRoomId: unknown }
				}
			).body.destinationRoomId
		).toBeNull()
	})

	it('closes and starts empty again after a request is created', async () => {
		setupWithResources()
		await openForm()
		await chooseUnits()
		await choose(3, 'Tran Phe duyet')
		fireEvent.click(
			await screen.findByRole('checkbox', { name: 'Le Van A' })
		)

		fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu' }))
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

		await openForm()
		expect(screen.queryByRole('tab')).toBeNull()
		expect(screen.getByText('Chọn đơn vị nguồn')).toBeTruthy()
	})
})

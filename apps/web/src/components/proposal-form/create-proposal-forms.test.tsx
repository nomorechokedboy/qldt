import { mockFetch, type RecordedRequest } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import dayjs from 'dayjs'
import type { ComponentType } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CreateActivityStatusProposalForm from '@/components/activity-status-proposals/create-proposal-form'
import CreateRankPromotionProposalForm from '@/components/rank-promotion-proposals/create-proposal-form'

vi.setConfig({ testTimeout: 20_000 })

beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn()
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
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
	name: 'Tiểu đoàn 1',
	level: 'battalion'
}
const student = (id: number, fullName: string, rank: string) => ({
	id,
	fullName,
	rank,
	unitId: 1
})
const students = [
	student(10, 'Lê Văn A', 'Trung úy'),
	student(11, 'Phạm Văn B', 'Trung úy'),
	student(12, 'Vũ Văn C', 'Thượng úy')
]

function renderForm(
	Form: ComponentType<{ onSuccess?: () => void }>,
	base: string
) {
	const mock = mockFetch((req) => {
		if (req.method === 'GET' && req.path === '/units') {
			return { body: { data: [battalion] } }
		}
		if (req.method === 'GET' && req.path === '/students') {
			return { body: { data: students } }
		}
		if (req.method === 'GET' && req.path === `${base}/eligible-approvers`) {
			return {
				body: { data: [{ id: 2, displayName: 'Trần Phê duyệt' }] }
			}
		}
		if (req.method === 'GET' && req.path === base) {
			return { body: { data: [] } }
		}
		if (req.method === 'POST' && req.path === base) {
			return { body: { data: {} } }
		}
		return { status: 404 }
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
			<Form />
		</QueryClientProvider>
	)
	return mock
}

const footer = () =>
	document.querySelector('[aria-live="polite"]')?.textContent ?? ''

const combobox = async (index: number) =>
	(await screen.findAllByRole('combobox'))[index]

async function choose(index: number, option: string) {
	fireEvent.keyDown(await combobox(index), { key: 'Enter' })
	fireEvent.keyDown(await screen.findByRole('option', { name: option }), {
		key: 'Enter'
	})
}

async function openForm(buttonName: string) {
	fireEvent.click(await screen.findByRole('button', { name: buttonName }))
	await screen.findByRole('dialog')
}

// The calendar's day buttons are named by their full date, so find them by the
// day of the month shown. Days 7-25 only ever appear once in a month view.
async function clickDay(day: string) {
	const button = await waitFor(() => {
		const found = [...document.querySelectorAll('button[data-day]')].find(
			(b) => b.textContent?.trim() === day
		)
		if (!found) throw new Error(`no day ${day}`)
		return found
	})
	fireEvent.click(button)
}

// Picks the 15th of the month the calendar opens on.
async function pickDay(trigger: string) {
	fireEvent.click(screen.getByRole('button', { name: trigger }))
	await clickDay('15')
}

const posted = (requests: RecordedRequest[]) =>
	requests.filter((r) => r.method === 'POST')

const fifteenth = dayjs().date(15)

describe('rank promotion proposal form', () => {
	const base = '/rank-promotion-proposals'
	const open = () => openForm('Tạo đề xuất thăng quân hàm')

	it('says what is still missing, one step at a time', async () => {
		renderForm(CreateRankPromotionProposalForm, base)
		await open()

		expect(footer()).toBe('Chọn đơn vị')
		await choose(0, 'Tiểu đoàn 1')
		expect(footer()).toBe('Chọn quân hàm đề xuất')
		await choose(1, 'Thượng úy')
		expect(footer()).toBe('Chọn người phê duyệt')
		await choose(2, 'Trần Phê duyệt')
		expect(footer()).toBe('Chọn ngày hiệu lực')
		await pickDay('Chọn ngày hiệu lực')
		expect(footer()).toBe('Chọn ít nhất một quân nhân')
		expect(
			screen.getByRole('button', { name: 'Tạo đề xuất' })
		).toHaveProperty('disabled', true)
	})

	it('summarises the proposal once it is complete', async () => {
		renderForm(CreateRankPromotionProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Thượng úy')
		await choose(2, 'Trần Phê duyệt')
		await pickDay('Chọn ngày hiệu lực')

		fireEvent.click(await screen.findByLabelText('Lê Văn A (Trung úy)'))
		fireEvent.click(screen.getByLabelText('Phạm Văn B (Trung úy)'))

		expect(footer()).toBe(
			`Thăng Quân hàm Thượng úy cho 2 quân nhân, hiệu lực ${fifteenth.format('DD/MM/YYYY')}`
		)
		expect(
			screen.getByRole('button', { name: 'Tạo đề xuất' })
		).toHaveProperty('disabled', false)
	})

	it('lists troopers who cannot be picked, with the reason', async () => {
		renderForm(CreateRankPromotionProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Thượng úy')

		expect(await screen.findByText('Không đủ điều kiện (1)')).toBeTruthy()
		expect(screen.getByText('Vũ Văn C (Thượng úy)')).toBeTruthy()
		expect(screen.getByText('Đã là Thượng úy')).toBeTruthy()
		expect(screen.queryByLabelText('Vũ Văn C (Thượng úy)')).toBeNull()
	})

	it('tells the person when changing the rank drops selected troopers', async () => {
		renderForm(CreateRankPromotionProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Thượng úy')
		fireEvent.click(await screen.findByLabelText('Lê Văn A (Trung úy)'))
		fireEvent.click(screen.getByLabelText('Phạm Văn B (Trung úy)'))

		await choose(1, 'Đại úy')

		expect(
			await screen.findByText('Đã bỏ chọn 2 quân nhân không còn phù hợp')
		).toBeTruthy()
		expect(screen.getByText('Đã chọn 0/1')).toBeTruthy()
	})

	it('sends a trooper’s own rank when it was set from their row', async () => {
		const { requests } = renderForm(CreateRankPromotionProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Thượng úy')
		await choose(2, 'Trần Phê duyệt')
		await pickDay('Chọn ngày hiệu lực')
		fireEvent.click(await screen.findByLabelText('Lê Văn A (Trung úy)'))
		fireEvent.click(screen.getByLabelText('Phạm Văn B (Trung úy)'))

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Tuỳ chỉnh riêng: Lê Văn A (Trung úy)'
			})
		)
		await choose(3, 'Đại úy')
		expect(await screen.findByText('Riêng: Đại úy')).toBeTruthy()
		fireEvent.keyDown(document.activeElement ?? document.body, {
			key: 'Escape'
		})
		fireEvent.click(screen.getByRole('button', { name: 'Tạo đề xuất' }))

		await waitFor(() => expect(posted(requests)).toHaveLength(1))
		expect(posted(requests)[0].body).toEqual({
			unitId: 1,
			approverUserId: 2,
			targetRank: 'Thượng úy',
			note: null,
			effectiveDate: fifteenth.format('YYYY-MM-DD'),
			troopers: [
				{ studentId: 10, targetRank: 'Đại úy', effectiveDate: null },
				{ studentId: 11, targetRank: null, effectiveDate: null }
			]
		})
	})
})

describe('activity status proposal form', () => {
	const base = '/activity-status-proposals'
	const open = () => openForm('Tạo đề xuất chế độ')

	it('asks for a single date when the status is a discharge', async () => {
		const { requests } = renderForm(CreateActivityStatusProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		expect(footer()).toBe('Chọn chế độ')
		await choose(1, 'Xuất ngũ')
		await choose(2, 'Trần Phê duyệt')
		expect(footer()).toBe('Chọn ngày hiệu lực')
		await pickDay('Chọn ngày hiệu lực')
		fireEvent.click(await screen.findByLabelText('Lê Văn A'))

		expect(footer()).toBe(
			`Chuyển chế độ Xuất ngũ cho 1 quân nhân, hiệu lực ${fifteenth.format('DD/MM/YYYY')}`
		)
		fireEvent.click(screen.getByRole('button', { name: 'Tạo đề xuất' }))
		await waitFor(() => expect(posted(requests)).toHaveLength(1))
		expect(posted(requests)[0].body).toMatchObject({
			unitId: 1,
			approverUserId: 2,
			targetActivityStatus: 'discharged',
			effectiveDate: fifteenth.format('YYYY-MM-DD'),
			startDate: null,
			endDate: null,
			troopers: [
				{
					studentId: 10,
					effectiveDate: null,
					startDate: null,
					endDate: null
				}
			]
		})
	})

	it('asks for a date range for any other status', async () => {
		renderForm(CreateActivityStatusProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Nghỉ phép năm')
		await choose(2, 'Trần Phê duyệt')
		expect(footer()).toBe('Chọn khoảng ngày')

		fireEvent.click(
			screen.getByRole('button', { name: 'Chọn khoảng ngày' })
		)
		await clickDay('10')
		// jsdom drops focus with the clicked day and so closes the popover (a
		// browser keeps it open); the picker now shows a one-day range.
		if (!document.querySelector('button[data-day]')) {
			fireEvent.click(
				screen.getByRole('button', { name: /^\d{2}\/\d{2}\/\d{4} - / })
			)
		}
		await clickDay('20')
		fireEvent.click(await screen.findByLabelText('Lê Văn A'))

		const month = dayjs()
		expect(footer()).toBe(
			`Chuyển chế độ Nghỉ phép năm cho 1 quân nhân, từ ${month.date(10).format('DD/MM/YYYY')} đến ${month.date(20).format('DD/MM/YYYY')}`
		)
	})

	it('lets every trooper of the unit take any status', async () => {
		renderForm(CreateActivityStatusProposalForm, base)
		await open()
		await choose(0, 'Tiểu đoàn 1')
		await choose(1, 'Xuất ngũ')

		expect(await screen.findByLabelText('Vũ Văn C')).toBeTruthy()
		expect(screen.queryByText(/Không đủ điều kiện/)).toBeNull()
	})
})

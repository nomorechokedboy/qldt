import { unitLevelLabels } from '@/data/unit-levels'
import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react'
import * as XLSX from 'xlsx'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImportStudentsDialog } from './index'

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
	name: 'Tieu doan 1',
	level: 'battalion'
}
const position = {
	id: 5,
	name: 'Tieu doan truong',
	level: 'battalion',
	priority: 1,
	group: 'HSQ'
}
const province = { code: '01', nameWithType: 'Thành phố Hà Nội' }
const ward = {
	code: '0001',
	provinceCode: '01',
	nameWithType: 'Phường Ba Đình'
}
const positionLabel = `${unitLevelLabels.battalion} - ${position.name}`

const headers = [
	'fullName',
	'unitId',
	'positionId',
	'politicalOrg',
	'activityStatus',
	'birthPlaceProvinceName',
	'birthPlaceWardName',
	'birthPlaceDetail',
	'addressProvinceName',
	'addressWardName',
	'addressDetail'
]

function validRow(name: string, unit = battalion.name) {
	return [
		name,
		unit,
		positionLabel,
		'Đoàn',
		'',
		province.nameWithType,
		ward.nameWithType,
		'Xom 1',
		province.nameWithType,
		ward.nameWithType,
		'So 2'
	]
}

function spreadsheet(rows: unknown[][], name = 'quan-nhan.xlsx') {
	const sheet = XLSX.utils.aoa_to_sheet([headers, headers, ...rows])
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, sheet, 'Mau')
	const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
	return new File([bytes], name, {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	})
}

function setup(
	options: {
		isOpen?: boolean
		bulk?: { status?: number; body?: unknown }
	} = {}
) {
	const mock = mockFetch(({ path }) => {
		if (path === '/units') return { body: { data: [battalion] } }
		if (path === '/positions') return { body: { data: [position] } }
		if (path === '/provinces') return { body: { data: [province] } }
		if (path === '/wards') return { body: { data: [ward] } }
		if (path === '/students/bulk')
			return options.bulk ?? { body: { data: [] } }
		return { body: { data: [] } }
	})
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const onClose = vi.fn()
	const onSuccess = vi.fn()
	const view = render(
		<QueryClientProvider client={client}>
			<ImportStudentsDialog
				isOpen={options.isOpen ?? true}
				onClose={onClose}
				onSuccess={onSuccess}
			/>
		</QueryClientProvider>
	)
	return { ...mock, onClose, onSuccess, view }
}

// Lookups load asynchronously and a file parsed before they arrive would
// report every reference as unknown, so wait for the four list requests.
async function waitForLookups(requests: { path: string }[]) {
	await waitFor(() => {
		const paths = requests.map((r) => r.path)
		for (const p of ['/units', '/positions', '/provinces', '/wards'])
			expect(paths).toContain(p)
	})
	await new Promise((r) => setTimeout(r, 50))
}

function chooseFile(file: File) {
	const input = document.querySelector<HTMLInputElement>('input[type=file]')
	if (!input) throw new Error('file input missing')
	fireEvent.change(input, { target: { files: [file] } })
}

const confirmButton = () =>
	screen.getByRole('button', { name: /Xác nhận & Import/ })

describe('ImportStudentsDialog', () => {
	it('renders nothing and loads nothing while closed', () => {
		const { requests, view } = setup({ isOpen: false })

		expect(view.container.innerHTML).toBe('')
		expect(screen.queryByRole('dialog')).toBeNull()
		expect(requests).toHaveLength(0)
	})

	it('opens on the upload step with a cancel button and no confirm', async () => {
		const { requests } = setup()

		expect(screen.getByRole('dialog')).toBeTruthy()
		expect(screen.getByText('Import danh sách quân nhân')).toBeTruthy()
		expect(screen.getByText('File mẫu Excel')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Hủy' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
		await waitForLookups(requests)
	})

	it('cancel closes the dialog', async () => {
		const { onClose, requests } = setup()
		await waitForLookups(requests)

		fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))

		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('rejects a file that is not csv or excel', async () => {
		const { requests } = setup()
		await waitForLookups(requests)

		chooseFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))

		expect(
			await screen.findByText(
				'Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)'
			)
		).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
	})

	it('reports a corrupt spreadsheet', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const { requests } = setup()
		await waitForLookups(requests)

		// Zip signature followed by garbage: not a readable workbook.
		const zipStub = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4])
		chooseFile(new File([zipStub], 'broken.xlsx'))

		expect(
			await screen.findByText(
				'Lỗi đọc file. Vui lòng kiểm tra định dạng file.'
			)
		).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
	})

	it('stays on the upload step when the file has no data rows', async () => {
		const { requests } = setup()
		await waitForLookups(requests)

		chooseFile(spreadsheet([], 'empty.xlsx'))

		expect(await screen.findByText('empty.xlsx')).toBeTruthy()
		expect(screen.queryByText('Xem trước dữ liệu import')).toBeNull()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
	})

	it('shows the parsed rows for review with valid/error counts', async () => {
		const { requests } = setup()
		await waitForLookups(requests)

		chooseFile(spreadsheet([validRow('Nguyen Van A'), validRow('Tran B')]))

		expect(await screen.findByText('Xem trước dữ liệu import')).toBeTruthy()
		expect(screen.getByText('Hợp lệ: 2')).toBeTruthy()
		// The cells show the parsed values, not blanks.
		expect(screen.getByDisplayValue('Nguyen Van A')).toBeTruthy()
		expect(screen.getByDisplayValue('Tran B')).toBeTruthy()
		expect(screen.queryByText(/^Lỗi: /)).toBeNull()
		expect(screen.queryByText('Kéo thả file vào đây hoặc')).toBeNull()
		expect(confirmButton().hasAttribute('disabled')).toBe(false)
		expect(screen.getByRole('button', { name: 'Hủy' })).toBeTruthy()
	})

	it('flags rows with unknown units and blocks the import', async () => {
		const { requests } = setup()
		await waitForLookups(requests)

		chooseFile(
			spreadsheet([
				validRow('Nguyen Van A'),
				validRow('Tran B', 'Nowhere')
			])
		)

		expect(
			await screen.findByText(
				'Đã đọc file, nhưng có 1 dòng chứa lỗi tham chiếu (đơn vị/chức vụ không hợp lệ).'
			)
		).toBeTruthy()
		expect(screen.getByText('Hợp lệ: 1')).toBeTruthy()
		expect(screen.getByText('Lỗi: 1')).toBeTruthy()
		expect(confirmButton().hasAttribute('disabled')).toBe(true)
		expect(confirmButton().getAttribute('title')).toBe(
			'Vui lòng sửa các dòng có lỗi trước khi import'
		)
		expect(requests.some((r) => r.path === '/students/bulk')).toBe(false)
	})

	it('sends the resolved students and reports success', async () => {
		const { requests, onSuccess } = setup()
		await waitForLookups(requests)
		chooseFile(spreadsheet([validRow('Nguyen Van A'), validRow('Tran B')]))
		await screen.findByText('Xem trước dữ liệu import')

		fireEvent.click(confirmButton())

		expect(
			await screen.findByText(
				'Import hoàn tất! Thành công: 2/2 quân nhân'
			)
		).toBeTruthy()

		const post = requests.find((r) => r.path === '/students/bulk')
		expect(post?.method).toBe('POST')
		const sent = (post?.body as { data: Record<string, unknown>[] }).data
		expect(sent).toHaveLength(2)
		expect(sent[0]).toMatchObject({
			fullName: 'Nguyen Van A',
			unitId: 1,
			positionId: 5,
			politicalOrg: 'hcyu',
			activityStatus: 'serving',
			birthPlace: 'Xom 1',
			birthPlaceProvinceCode: '01',
			birthPlaceWardCode: '0001',
			address: 'So 2',
			addressProvinceCode: '01',
			addressWardCode: '0001'
		})
		expect(sent[1]).toMatchObject({ fullName: 'Tran B', unitId: 1 })

		expect(onSuccess).toHaveBeenCalledWith({
			successCount: 2,
			errorCount: 0,
			totalCount: 2,
			errors: []
		})
		// Success leaves the review step and swaps Cancel for Close.
		expect(screen.queryByText('Xem trước dữ liệu import')).toBeNull()
		expect(screen.getByText('Kết quả import:')).toBeTruthy()
		expect(screen.getByRole('button', { name: 'Đóng' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
	})

	it('shows the failure and keeps the review open when the API rejects', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const { requests, onSuccess } = setup({
			bulk: {
				status: 400,
				body: {
					code: 'invalid_argument',
					message: 'studentId already exists',
					details: null
				}
			}
		})
		await waitForLookups(requests)
		chooseFile(spreadsheet([validRow('Nguyen Van A')]))
		await screen.findByText('Xem trước dữ liệu import')

		fireEvent.click(confirmButton())

		expect(
			await screen.findByText('Lỗi import: studentId already exists')
		).toBeTruthy()
		expect(screen.getByText('Kết quả import:')).toBeTruthy()
		expect(
			screen.getByText('Dòng 1: studentId already exists')
		).toBeTruthy()
		expect(onSuccess).not.toHaveBeenCalled()
		expect(screen.getByText('Xem trước dữ liệu import')).toBeTruthy()
		expect(confirmButton().hasAttribute('disabled')).toBe(false)
	})

	it('going back from review returns to the upload step', async () => {
		const { requests } = setup()
		await waitForLookups(requests)
		chooseFile(spreadsheet([validRow('Nguyen Van A')]))
		await screen.findByText('Xem trước dữ liệu import')

		fireEvent.click(screen.getByRole('button', { name: 'Chọn file khác' }))

		expect(await screen.findByText('File mẫu Excel')).toBeTruthy()
		expect(screen.queryByText('Xem trước dữ liệu import')).toBeNull()
		expect(screen.queryByRole('button', { name: /Xác nhận/ })).toBeNull()
		expect(screen.queryByText('Kết quả import:')).toBeNull()
	})

	it('accepts a file dropped on the upload area', async () => {
		const { requests } = setup()
		await waitForLookups(requests)

		const zone = screen
			.getByText('Hỗ trợ file CSV, Excel (.xlsx, .xls)')
			.closest('div.border-dashed') as HTMLElement
		fireEvent.dragEnter(zone)
		expect(zone.className).toContain('border-primary')
		fireEvent.drop(zone, {
			dataTransfer: { files: [spreadsheet([validRow('Nguyen Van A')])] }
		})

		expect(await screen.findByText('Xem trước dữ liệu import')).toBeTruthy()
		expect(within(document.body).getByText('Hợp lệ: 1')).toBeTruthy()
	})
})

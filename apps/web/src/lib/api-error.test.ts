import '@/i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { GetUnitStatsPeriod } from '@/api'
import i18n from '@/i18n'
import { mockFetch } from '@/test/fetch-mock'
import { describeApiError, toastApiError } from './api-error'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

afterEach(async () => {
	vi.unstubAllGlobals()
	vi.clearAllMocks()
	await i18n.changeLanguage('vi')
})

// The error a component actually catches: raised by the generated client from
// a response shaped like the API's.
async function failWith(status: number, body: unknown) {
	mockFetch(() => ({ status, body }))
	try {
		await GetUnitStatsPeriod(1, '2026-03-01', '2026-03-31')
	} catch (err) {
		return err
	}
	throw new Error('expected the request to fail')
}

describe('describeApiError', () => {
	it('explains a known reason with the values the server sent', async () => {
		const err = await failWith(400, {
			code: 'invalid_argument',
			message: 'Not enough stock',
			details: {
				reason: 'insufficient_stock',
				params: { requested: 8, available: 3 }
			}
		})

		expect(describeApiError(err)).toBe(
			'Không đủ vật tư tại đơn vị gửi: cần 8, hiện có 3.'
		)
	})

	it('speaks the active language', async () => {
		const err = await failWith(409, {
			code: 'already_exists',
			message: 'x',
			details: {
				reason: 'unique_violation',
				params: { field: 'units.alias' }
			}
		})
		await i18n.changeLanguage('en')

		expect(describeApiError(err)).toBe(
			'This unit code is already in use. Choose a different one.'
		)
	})

	it('names the side of a transfer only when the server says which', async () => {
		const withSide = await failWith(400, {
			code: 'invalid_argument',
			message: 'x',
			details: {
				reason: 'unit_not_found',
				params: { side: 'source', id: 4 }
			}
		})
		const without = await failWith(400, {
			code: 'invalid_argument',
			message: 'x',
			details: { reason: 'unit_not_found', params: { id: 4 } }
		})

		expect(describeApiError(withSide)).toBe(
			'Không tìm thấy đơn vị gửi (#4).'
		)
		expect(describeApiError(without)).toBe('Không tìm thấy đơn vị (#4).')
	})

	it('falls back to what the error code means when there is no reason', async () => {
		const err = await failWith(403, {
			code: 'permission_denied',
			message: "You don't have permission Delete student!"
		})

		expect(describeApiError(err)).toBe(
			'Bạn không có quyền thực hiện thao tác này, hoặc dữ liệu thuộc đơn vị ngoài phạm vi của bạn.'
		)
	})

	it('falls back to the code for a reason this app does not know yet', async () => {
		const err = await failWith(404, {
			code: 'not_found',
			message: 'x',
			details: { reason: 'brand_new_reason' }
		})

		expect(describeApiError(err)).toBe(
			'Không tìm thấy dữ liệu. Có thể dữ liệu đã bị xóa hoặc chuyển đi, hãy tải lại trang.'
		)
	})

	it('keeps a Vietnamese message the server wrote itself', async () => {
		const err = await failWith(400, {
			code: 'invalid_argument',
			message: 'Vui lòng chọn tỉnh/thành và phường/xã cho nơi sinh'
		})

		expect(describeApiError(err)).toBe(
			'Vui lòng chọn tỉnh/thành và phường/xã cho nơi sinh'
		)
	})

	it('says the server could not be reached when the request never got an answer', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new TypeError('Failed to fetch')
			})
		)
		let caught: unknown
		try {
			await GetUnitStatsPeriod(1, '2026-03-01', '2026-03-31')
		} catch (err) {
			caught = err
		}

		expect(describeApiError(caught)).toBe(
			'Không kết nối được tới máy chủ. Hãy kiểm tra đường truyền rồi thử lại.'
		)
	})

	it('has nothing to add for an error that is not a failed request', () => {
		expect(describeApiError(new Error('boom'))).toBeUndefined()
	})
})

describe('toastApiError', () => {
	it('titles the toast with the action and explains the cause below it', async () => {
		const err = await failWith(400, {
			code: 'invalid_argument',
			message: 'x',
			details: { reason: 'not_pending' }
		})

		toastApiError('Không duyệt được yêu cầu', err)

		expect(toast.error).toHaveBeenCalledWith('Không duyệt được yêu cầu', {
			description:
				'Yêu cầu này đã được xử lý hoặc đã bị hủy nên không thể thao tác thêm. Hãy tải lại trang.'
		})
	})

	it('shows just the title when there is nothing to explain', () => {
		toastApiError('Không xóa được', new Error('boom'))

		expect(toast.error).toHaveBeenCalledWith('Không xóa được', undefined)
	})
})

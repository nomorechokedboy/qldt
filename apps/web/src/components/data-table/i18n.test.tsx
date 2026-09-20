import { act, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { DataTable } from '.'
import i18n from '@/i18n'

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

afterEach(() => act(() => i18n.changeLanguage('vi')))

type Row = { id: number; name: string }
const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Tên' }]

describe('DataTable language', () => {
	it('words the empty table and pagination in Vietnamese by default', () => {
		render(<DataTable columns={columns} data={[]} />)

		expect(screen.getByText('Không có dữ liệu nào')).toBeTruthy()
		expect(screen.getByText('Số hàng mỗi trang')).toBeTruthy()
	})

	it('switches to English when the language changes', async () => {
		render(<DataTable columns={columns} data={[]} />)

		await act(() => i18n.changeLanguage('en'))

		expect(screen.getByText('No data')).toBeTruthy()
		expect(screen.getByText('Rows per page')).toBeTruthy()
		expect(screen.getByText('0 of 0 row(s) selected.')).toBeTruthy()
	})
})

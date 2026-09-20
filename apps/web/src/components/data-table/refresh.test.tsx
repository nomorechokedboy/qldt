import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { DataTable } from '.'

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

type Row = { id: number; name: string }
const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Tên' }]
const data: Row[] = [{ id: 1, name: 'Alpha' }]

describe('DataTable refresh', () => {
	it('offers no refresh button unless a refresh is provided', () => {
		render(<DataTable columns={columns} data={data} />)

		expect(screen.queryByRole('button', { name: 'Làm mới' })).toBeNull()
	})

	it('reloads on click and stays disabled until the reload settles', async () => {
		let finish: () => void = () => {}
		const onRefresh = vi.fn(
			() => new Promise<void>((resolve) => (finish = resolve))
		)
		render(
			<DataTable columns={columns} data={data} onRefresh={onRefresh} />
		)

		const button = screen.getByRole('button', {
			name: 'Làm mới'
		}) as HTMLButtonElement
		fireEvent.click(button)
		fireEvent.click(button)

		expect(onRefresh).toHaveBeenCalledTimes(1)
		expect(button.disabled).toBe(true)

		finish()
		await waitFor(() => expect(button.disabled).toBe(false))
	})
})

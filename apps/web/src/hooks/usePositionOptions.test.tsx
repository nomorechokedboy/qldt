import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import usePositionOptions from './usePositionOptions'

const position = (
	id: number,
	name: string,
	level: string,
	priority: number,
	group: string | null = null
) => ({ id, name, level, priority, group, code: `p${id}` })

function setup(positions: ReturnType<typeof position>[]) {
	mockFetch(() => ({ body: { data: positions } }))
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)
	return renderHook(() => usePositionOptions(), { wrapper })
}

describe('usePositionOptions', () => {
	it('groups positions by the level of unit they belong to', async () => {
		const { result } = setup([
			position(1, 'Trung doi truong', 'platoon', 1),
			position(2, 'Tieu doan truong', 'battalion', 1),
			position(3, 'Dai doi truong', 'company', 1)
		])

		await waitFor(() => expect(result.current).toHaveLength(3))
		expect(result.current.map((o) => o.group)).toEqual([
			'Trung đội',
			'Đại đội',
			'Tiểu đoàn'
		])
	})

	it('keeps the HSQ classification from mixing levels under one heading', async () => {
		const { result } = setup([
			position(1, 'Ban truong', 'battalion', 2, 'HSQ'),
			position(2, 'Tieu doi truong', 'platoon', 1, 'HSQ'),
			position(3, 'Chi huy', 'battalion', 1)
		])

		await waitFor(() => expect(result.current).toHaveLength(3))
		expect(result.current.map((o) => [o.group, o.label])).toEqual([
			['Trung đội', 'Tieu doi truong'],
			['Tiểu đoàn', 'Chi huy'],
			['Tiểu đoàn', 'Ban truong']
		])
	})
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import useUnitOptions from './useUnitOptions'

afterEach(() => {
	vi.unstubAllGlobals()
})

function wrapper() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)
}

const unit = (
	id: number,
	name: string,
	level: string,
	parent?: { id: number; name: string }
) => ({ id, alias: name.toLowerCase(), name, level, parent })

const battalion = unit(1, 'Tieu doan 1', 'battalion')
const units = [
	battalion,
	unit(2, 'Dai doi 1', 'company', battalion),
	unit(3, 'Dai doi 2', 'company', battalion),
	unit(4, 'Ban chi huy', 'platoon', { id: 2, name: 'Dai doi 1' }),
	unit(5, 'Ban chi huy', 'platoon', { id: 3, name: 'Dai doi 2' })
]

describe('useUnitOptions', () => {
	it('lists every unit the caller can see, one option per unit', async () => {
		mockFetch(() => ({ body: { data: units } }))

		const { result } = renderHook(() => useUnitOptions(), {
			wrapper: wrapper()
		})

		await waitFor(() => expect(result.current.options).toHaveLength(5))
		expect(result.current.options.map((o) => o.id).sort()).toEqual([
			1, 2, 3, 4, 5
		])
	})

	it('tells apart units that share a name', async () => {
		mockFetch(() => ({ body: { data: units } }))

		const { result } = renderHook(() => useUnitOptions(), {
			wrapper: wrapper()
		})

		await waitFor(() => expect(result.current.options).toHaveLength(5))
		const labels = result.current.options
			.filter((o) => o.id === 4 || o.id === 5)
			.map((o) => o.label)
		expect(new Set(labels).size).toBe(2)
	})

	it('only offers units at the minimum level or larger', async () => {
		mockFetch(() => ({ body: { data: units } }))

		const { result } = renderHook(
			() => useUnitOptions({ minLevel: 'company' }),
			{ wrapper: wrapper() }
		)

		await waitFor(() => expect(result.current.options).toHaveLength(3))
		expect(result.current.options.map((o) => o.id).sort()).toEqual([
			1, 2, 3
		])
	})

	it('still exposes the full unit list when the options are narrowed', async () => {
		mockFetch(() => ({ body: { data: units } }))

		const { result } = renderHook(
			() => useUnitOptions({ minLevel: 'company' }),
			{ wrapper: wrapper() }
		)

		await waitFor(() => expect(result.current.units).toHaveLength(5))
		expect(result.current.unitsById.get(4)?.name).toBe('Ban chi huy')
	})

	it('does not fetch until enabled', async () => {
		const { requests } = mockFetch(() => ({ body: { data: units } }))

		const { result } = renderHook(
			() => useUnitOptions({ enabled: false }),
			{
				wrapper: wrapper()
			}
		)

		await new Promise((r) => setTimeout(r, 20))
		expect(requests).toHaveLength(0)
		expect(result.current.options).toEqual([])
	})
})

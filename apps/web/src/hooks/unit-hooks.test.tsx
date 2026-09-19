import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import useUnitData from './useUnitData'
import useUnitStats from './useUnitStats'
import useUnitStatsMaterialAssets from './useUnitStatsMaterialAssets'
import useUnitStatsMaterialStocks from './useUnitStatsMaterialStocks'
import useUnitStatsStudents from './useUnitStatsStudents'

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

const unitReply = ({ path }: { path: string }) => ({
	body: {
		data: {
			id: Number(path.split('/')[2]),
			alias: 'bch',
			name: `Unit ${path.split('/')[2]}`
		}
	}
})

describe('useUnitData', () => {
	it('loads the unit with the given id', async () => {
		const { requests } = mockFetch(unitReply)

		const { result } = renderHook(() => useUnitData({ id: 6 }), {
			wrapper: wrapper()
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(requests.map((r) => r.path)).toEqual(['/units/6'])
		expect(result.current.data).toMatchObject({ id: 6 })
	})

	it('does not mix up two units that share an alias', async () => {
		mockFetch(unitReply)
		const shared = wrapper()

		const first = renderHook(() => useUnitData({ id: 6 }), {
			wrapper: shared
		})
		const second = renderHook(() => useUnitData({ id: 16 }), {
			wrapper: shared
		})

		await waitFor(() => {
			expect(first.result.current.isSuccess).toBe(true)
			expect(second.result.current.isSuccess).toBe(true)
		})
		expect(first.result.current.data).toMatchObject({ id: 6 })
		expect(second.result.current.data).toMatchObject({ id: 16 })
	})

	it('refetches when the id changes', async () => {
		const { requests } = mockFetch(unitReply)

		const { result, rerender } = renderHook(
			({ id }) => useUnitData({ id }),
			{ wrapper: wrapper(), initialProps: { id: 6 } }
		)
		await waitFor(() =>
			expect(result.current.data).toMatchObject({ id: 6 })
		)

		rerender({ id: 16 })

		await waitFor(() =>
			expect(result.current.data).toMatchObject({ id: 16 })
		)
		expect(requests.map((r) => r.path)).toEqual(['/units/6', '/units/16'])
	})

	it('exposes a server error', async () => {
		mockFetch(() => ({
			status: 400,
			body: { code: 'invalid_argument', message: 'Unit not found: 9' }
		}))

		const { result } = renderHook(() => useUnitData({ id: 9 }), {
			wrapper: wrapper()
		})

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(result.current.data).toBeUndefined()
	})
})

describe.each([
	['useUnitStats', useUnitStats, '/units/4/stats'],
	['useUnitStatsStudents', useUnitStatsStudents, '/units/4/stats/students'],
	[
		'useUnitStatsMaterialStocks',
		useUnitStatsMaterialStocks,
		'/units/4/stats/material-stocks'
	],
	[
		'useUnitStatsMaterialAssets',
		useUnitStatsMaterialAssets,
		'/units/4/stats/material-assets'
	]
])('%s', (_name, useHook, expectedPath) => {
	it('loads stats for the given unit id', async () => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		const { result } = renderHook(() => useHook(4), {
			wrapper: wrapper()
		})

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(requests.map((r) => r.path)).toEqual([expectedPath])
	})

	it('does not request anything until a unit id is known', async () => {
		const { requests } = mockFetch()

		const { result } = renderHook(() => useHook(undefined), {
			wrapper: wrapper()
		})

		expect(result.current.fetchStatus).toBe('idle')
		expect(requests).toHaveLength(0)
	})

	it('starts loading once the id becomes available', async () => {
		const { requests } = mockFetch(() => ({ body: { data: [] } }))

		const { result, rerender } = renderHook(
			({ id }: { id: number | undefined }) => useHook(id),
			{
				wrapper: wrapper(),
				initialProps: { id: undefined } as { id: number | undefined }
			}
		)
		expect(requests).toHaveLength(0)

		rerender({ id: 4 })

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(requests.map((r) => r.path)).toEqual([expectedPath])
	})
})

import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApplyInventorySessionResults } from './useInventorySession'

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

function setup() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	)
	const hook = renderHook(() => useApplyInventorySessionResults(), {
		wrapper
	})
	return { ...hook, client }
}

describe('useApplyInventorySessionResults', () => {
	it('invalidates the stocks and assets lists once applied, so an already-mounted table refetches the new quantities/statuses', async () => {
		mockFetch(() => ({ body: {} }))
		const { result, client } = setup()

		// Both lists are already mounted (as they would be behind the
		// inventory session dialog) and settled, the way a real cached query
		// looks right before an apply.
		client.setQueryData(['material-stocks', {}], [{ id: 1, quantity: 30 }])
		client.setQueryData(
			['material-assets', {}],
			[{ id: 1, status: 'in_service' }]
		)
		await waitFor(() =>
			expect(client.getQueryState(['material-stocks', {}])?.status).toBe(
				'success'
			)
		)

		await result.current.mutateAsync({ id: 1 })

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryState(['material-stocks', {}])?.isInvalidated
		).toBe(true)
		expect(
			client.getQueryState(['material-assets', {}])?.isInvalidated
		).toBe(true)
	})
})

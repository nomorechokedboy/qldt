import { mockFetch } from '@/test/fetch-mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useCreateStudents from './useCreateStudents'

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
	return renderHook(() => useCreateStudents(), { wrapper })
}

describe('useCreateStudents', () => {
	it('rejects with the API error itself when the server refuses', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		mockFetch(() => ({
			status: 400,
			body: {
				code: 'invalid_argument',
				message: 'studentId already exists',
				details: null
			}
		}))
		const { result } = setup()

		const outcome = result.current.mutateAsync([]).catch((e: Error) => e)

		expect((await outcome).message).toBe('studentId already exists')
		await waitFor(() => expect(result.current.isError).toBe(true))
	})

	it('rejects with the original error when the request never got an answer', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				throw new TypeError('Failed to fetch')
			})
		)
		const { result } = setup()

		const outcome = result.current.mutateAsync([]).catch((e: Error) => e)

		expect((await outcome).message).toBe('Failed to fetch')
	})
})

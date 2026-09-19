import { vi } from 'vitest'

export interface RecordedRequest {
	method: string
	url: URL
	path: string
	body: unknown
}

type Reply = { status?: number; body?: unknown }
type Responder = (req: RecordedRequest) => Reply | Promise<Reply>

// Replaces the network boundary only: everything above it (generated client,
// api wrappers, hooks, components) runs for real, so tests assert on what the
// app sends and how it reacts to replies - not on which internal function
// produced them.
export function mockFetch(responder: Responder = () => ({ body: {} })) {
	const requests: RecordedRequest[] = []

	const fetchMock = vi.fn(
		async (input: RequestInfo | URL, init?: RequestInit) => {
			const raw = typeof input === 'string' ? input : input.toString()
			const url = new URL(raw, 'http://localhost')
			const rawBody = init?.body
			let body: unknown = rawBody
			if (typeof rawBody === 'string') {
				try {
					body = JSON.parse(rawBody)
				} catch {
					body = rawBody
				}
			}
			const req: RecordedRequest = {
				method: (init?.method ?? 'GET').toUpperCase(),
				url,
				path: url.pathname,
				body
			}
			requests.push(req)

			const reply = await responder(req)
			const status = reply.status ?? 200
			return new Response(JSON.stringify(reply.body ?? {}), {
				status,
				headers: { 'Content-Type': 'application/json' }
			})
		}
	)
	vi.stubGlobal('fetch', fetchMock)

	return { requests, fetchMock }
}

import { APIError, ErrCode } from 'encore.dev/api'
import { EventEmitter } from 'node:events'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { getTypedRequestBody } from './index'

const schema = v.object({ name: v.string() })

// A request that emits `body` and ends, like the stream an api.raw handler gets.
function requestWith(body: string) {
	const req = new EventEmitter()
	queueMicrotask(() => {
		req.emit('data', Buffer.from(body))
		req.emit('end')
	})
	return req
}

async function errorOf(promise: Promise<unknown>) {
	try {
		await promise
	} catch (err) {
		return err
	}
	throw new Error('expected the promise to reject')
}

describe('getTypedRequestBody', () => {
	it('returns the parsed body when it matches the schema', async () => {
		expect(
			await getTypedRequestBody(requestWith('{"name":"a"}'), schema)
		).toEqual({ name: 'a' })
	})

	it('reports malformed JSON as invalid_argument', async () => {
		const err = await errorOf(
			getTypedRequestBody(requestWith('{oops'), schema)
		)

		expect(err).toBeInstanceOf(APIError)
		expect((err as APIError).code).toBe(ErrCode.InvalidArgument)
	})

	it('reports a body that breaks the schema as invalid_argument', async () => {
		const err = await errorOf(
			getTypedRequestBody(requestWith('{"name":1}'), schema)
		)

		expect(err).toBeInstanceOf(APIError)
		expect((err as APIError).code).toBe(ErrCode.InvalidArgument)
	})
})

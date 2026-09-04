import { APICallMeta } from 'encore.dev'
import { APIError, middleware } from 'encore.dev/api'
import log from 'encore.dev/log'

interface RateLimitRule {
	max: number
	windowMs: number
	/**
	 * How to derive the bucket identity for a request. Defaults to the
	 * client IP - override when IP alone is too coarse (e.g. keying login
	 * attempts by the submitted username instead, so a shared office IP
	 * doesn't lock out every employee after one person mistypes a password).
	 */
	keyFn?: (meta: APICallMeta) => string | undefined
	/**
	 * Which requests count toward the limit.
	 * - 'all' (default): every matched request counts, success or failure.
	 *   Right for plain throttling (exports, expensive reads).
	 * - 'failure': only requests where the handler threw count, and a
	 *   success clears the bucket. Right for login-style endpoints, so
	 *   normal use (e.g. repeatedly logging in and out) never counts
	 *   against the limit - only genuine wrong-credential attempts do.
	 */
	countOn?: 'all' | 'failure'
}

// Which routes get rate limited, and how. Add an entry here plus
// `tags: ['rate_limit']` on the endpoint's api() options whenever a new
// route needs throttling - unauthenticated, expensive, or abuse-prone
// endpoints (login, OTP/email senders, exports, search) are the usual
// candidates.
const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
	'POST:/authn/login': {
		max: 5,
		windowMs: 15 * 60 * 1000,
		countOn: 'failure',
		keyFn: (meta) => {
			const username = meta.parsedPayload?.username
			return typeof username === 'string'
				? username.toLowerCase()
				: undefined
		}
	}
}

function matchRule(method: string, path: string): RateLimitRule | undefined {
	const key = `${method}:${path}`
	if (RATE_LIMIT_RULES[key]) {
		return RATE_LIMIT_RULES[key]
	}

	for (const [pattern, rule] of Object.entries(RATE_LIMIT_RULES)) {
		const sepIndex = pattern.indexOf(':')
		const patternMethod = pattern.slice(0, sepIndex)
		const patternPath = pattern.slice(sepIndex + 1)
		if (method !== patternMethod) continue

		const regexPattern = patternPath
			.replace(/:\w+/g, '[^/]+')
			.replace(/\*/g, '.*')
		if (new RegExp(`^${regexPattern}$`).test(path)) {
			return rule
		}
	}

	return undefined
}

function clientIp(meta: APICallMeta): string {
	const forwarded = meta.headers['x-forwarded-for']
	const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded
	if (forwardedValue) {
		return forwardedValue.split(',')[0].trim()
	}

	const real = meta.headers['x-real-ip']
	const realValue = Array.isArray(real) ? real[0] : real
	return realValue ?? 'unknown'
}

// In-memory sliding window - single-process only. If the API is ever
// horizontally scaled, move counters to a shared store (Redis) so limits
// are enforced across replicas rather than per-instance.
interface Bucket {
	count: number
	windowStart: number
}

const buckets = new Map<string, Bucket>()

// Read-only: how many hits are recorded for `key` in the current window,
// without recording one. Expired windows are treated (and lazily reaped) as
// zero so a rule that hasn't seen a hit in `windowMs` doesn't stay over
// limit forever.
function currentCount(key: string, windowMs: number): number {
	const bucket = buckets.get(key)
	if (!bucket) return 0

	if (Date.now() - bucket.windowStart >= windowMs) {
		buckets.delete(key)
		return 0
	}

	return bucket.count
}

function recordHit(key: string, windowMs: number): void {
	const now = Date.now()
	const bucket = buckets.get(key)

	if (!bucket || now - bucket.windowStart >= windowMs) {
		buckets.set(key, { count: 1, windowStart: now })
		return
	}

	bucket.count++
}

// Lets an admin lift a rate limit early (e.g. a user fat-fingered their
// password enough times to get blocked and shouldn't have to wait out the
// window). `identity` must match what the rule's `keyFn` (or, absent one,
// clientIp) would have produced for the blocked request.
export function clearRateLimit(
	method: string,
	path: string,
	identity: string
): void {
	buckets.delete(`${method}:${path}:${identity}`)
}

export function unlockLogin(username: string): void {
	clearRateLimit('POST', '/authn/login', username.toLowerCase())
}

// Usernames currently blocked from /authn/login, so the UI can flag them
// (e.g. a lock icon in the user table) instead of an admin having to guess
// who fat-fingered their password enough times to trip the limit.
export function getLockedLoginUsernames(): string[] {
	const rule = RATE_LIMIT_RULES['POST:/authn/login']
	const prefix = 'POST:/authn/login:'

	const usernames: string[] = []
	for (const [key, bucket] of buckets) {
		if (!key.startsWith(prefix)) continue
		if (Date.now() - bucket.windowStart >= rule.windowMs) continue
		if (bucket.count < rule.max) continue
		usernames.push(key.slice(prefix.length))
	}

	return usernames
}

export const rateLimitMiddleware = middleware(
	{ target: { tags: ['rate_limit'] } },
	async (req, next) => {
		const meta = req.requestMeta as APICallMeta | undefined
		if (!meta) {
			return next(req)
		}

		const rule = matchRule(meta.method, meta.path)
		if (!rule) {
			return next(req)
		}

		const identity = rule.keyFn?.(meta) ?? clientIp(meta)
		const bucketKey = `${meta.method}:${meta.path}:${identity}`

		if (currentCount(bucketKey, rule.windowMs) >= rule.max) {
			log.warn('rateLimitMiddleware: rate limit exceeded', {
				endpoint: `${meta.method}:${meta.path}`,
				identity
			})
			// Vietnamese, not English: apps/web only forwards a backend error
			// message to the user verbatim when it's already Vietnamese (see
			// getErrorMessage in apps/web/src/lib/utils.ts) - an English
			// message here would silently fall back to a generic toast and
			// the user would have no idea they'd been rate limited.
			throw APIError.resourceExhausted(
				'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.'
			)
		}

		if (rule.countOn === 'failure') {
			// Only a thrown error counts as an attempt against the limit;
			// a successful call clears the slate so unrelated later
			// mistakes don't inherit an old streak of failures.
			try {
				const resp = await next(req)
				buckets.delete(bucketKey)
				return resp
			} catch (err) {
				recordHit(bucketKey, rule.windowMs)
				throw err
			}
		}

		recordHit(bucketKey, rule.windowMs)
		return next(req)
	}
)

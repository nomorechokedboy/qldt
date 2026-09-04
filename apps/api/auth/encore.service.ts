import { Service } from 'encore.dev/service'
import { rateLimitMiddleware } from '../middleware/rate-limit'

export default new Service('auth', {
	middlewares: [rateLimitMiddleware]
})

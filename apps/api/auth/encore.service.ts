import { Service } from 'encore.dev/service'
import { rateLimitMiddleware } from '../middleware/rate-limit'
import { permissionMiddleware } from '../middleware/authz'

export default new Service('auth', {
	middlewares: [rateLimitMiddleware, permissionMiddleware]
})

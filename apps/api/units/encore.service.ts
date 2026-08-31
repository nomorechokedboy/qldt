import { Service } from 'encore.dev/service'
import { authzMiddleware } from '../middleware/authz'
import { auditMiddleware } from '../middleware/audit'

export default new Service('units', {
	middlewares: [authzMiddleware, auditMiddleware]
})

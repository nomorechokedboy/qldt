import { Service } from 'encore.dev/service'
import { authzMiddleware, permissionMiddleware } from '../middleware/authz'
import { auditMiddleware } from '../middleware/audit'

export default new Service('rank-promotion-proposals', {
	middlewares: [authzMiddleware, permissionMiddleware, auditMiddleware]
})

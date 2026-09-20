import { Service } from 'encore.dev/service'
import { permissionMiddleware } from '../middleware/authz'
import { auditMiddleware } from '../middleware/audit'

export default new Service('lang-packs', {
	middlewares: [permissionMiddleware, auditMiddleware]
})

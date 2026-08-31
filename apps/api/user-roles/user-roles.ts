import { api } from 'encore.dev/api'
import { AssignRoleRequest } from '../schema'
import userRolesController from './controller'
import { setAuditContext } from '../middleware/audit'

interface AssignRolesResponse {
	success: boolean
}

export const AssignRolesToUser = api(
	{
		auth: true,
		expose: true,
		method: 'POST',
		path: '/user-roles/assign'
	},
	async (req: AssignRoleRequest): Promise<AssignRolesResponse> => {
		const previousRoleIds = await userRolesController.getRolesByUserId(
			req.userId
		)
		await userRolesController.assignRolesToUser(req)

		setAuditContext({
			resourceIds: [req.userId],
			previousValue: { roleIds: previousRoleIds },
			newValue: { roleIds: req.roleIds }
		})

		return { success: true }
	}
)

interface GetUserRolesResponse {
	roleIds: number[]
}

export const GetUserRoles = api(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/user-roles/:userId'
	},
	async ({ userId }: { userId: number }): Promise<GetUserRolesResponse> => {
		const roleIds = await userRolesController.getRolesByUserId(userId)
		return { roleIds }
	}
)

import { AssignRolesToUser } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/api-error'
import { AssignRoleRequest } from '@/types'
import i18n from '@/i18n'

export default function useAssignRoles() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: AssignRoleRequest) => AssignRolesToUser(data),
		onSuccess: (_, variables) => {
			toast.success(i18n.t('admin:assignRoles.success'))
			queryClient.invalidateQueries({
				queryKey: ['user-roles', variables.userId]
			})
			queryClient.invalidateQueries({
				queryKey: ['users']
			})
		},
		onError: (error: Error) => {
			toastApiError(i18n.t('admin:assignRoles.failed'), error)
		}
	})
}

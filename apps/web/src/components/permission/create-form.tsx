import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CreatePermission } from '@/api'
import { toast } from 'sonner'
import { queryClient } from '@/integrations/tanstack-query/root-provider'
import { useAppForm } from '@/hooks/use-app-form'
import { toastApiError } from '@/lib/api-error'
import { useTranslation } from 'react-i18next'

export default function PermissionForm() {
	const { t } = useTranslation('admin')
	const [open, setOpen] = useState(false)
	const { mutateAsync } = useMutation({
		mutationFn: CreatePermission,
		onError: (err) => {
			console.error('CreatePermission error', err)
			toastApiError(t('permissions.create.failed'), err)
		},
		onSuccess: () => {
			toast.success(t('permissions.create.success'))
			setOpen(false)
			queryClient.invalidateQueries({ queryKey: ['permissions'] })
		}
	})
	const form = useAppForm({
		defaultValues: {
			resourceId: 0,
			actionId: 0
		},
		onSubmit: async ({ value }) => {
			await mutateAsync(value)
		}
	})

	return null
}

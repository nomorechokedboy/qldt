import { useMutation } from '@tanstack/react-query'
import RoleModal from './modal'
import { useAppForm } from '@/hooks/use-app-form'
import { UpdateRole } from '@/api'
import { toast } from 'sonner'
import { useState } from 'react'
import { queryClient } from '@/integrations/tanstack-query/root-provider'
import { Button } from '../ui/button'
import { Edit2 } from 'lucide-react'
import { toastApiError } from '@/lib/api-error'
import { useTranslation } from 'react-i18next'

interface UpdateRoleFormProps {
	id: number
	name: string
	description: string | undefined
}

export default function UpdateRoleForm({
	id,
	name,
	description
}: UpdateRoleFormProps) {
	const { t } = useTranslation('admin')
	const { mutateAsync, isPending } = useMutation({
		mutationFn: UpdateRole,
		onSuccess: () => {
			toast.success(t('roles.update.success'))
			setOpen(false)
			queryClient.invalidateQueries({ queryKey: ['roles'] })
		},
		onError: (err) => {
			toastApiError(t('roles.update.failed'), err)
		}
	})
	const form = useAppForm({
		defaultValues: { name, description, id },
		onSubmit: async ({ value }) => {
			await mutateAsync(value)
		}
	})
	const [open, setOpen] = useState(false)

	return (
		<RoleModal
			title={t('roles.update.title')}
			form={form}
			formId={`updateRoleForm-${id}`}
			open={open}
			onOpenChange={setOpen}
			actionText={t('roles.update.action')}
			loadingText={t('roles.update.loading')}
			trigger={
				<Button variant='outline' size='sm' disabled={isPending}>
					<Edit2 className='h-4 w-4' />
				</Button>
			}
		/>
	)
}

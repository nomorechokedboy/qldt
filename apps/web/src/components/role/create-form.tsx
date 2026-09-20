import { useMutation } from '@tanstack/react-query'
import RoleModal from './modal'
import { useAppForm } from '@/hooks/use-app-form'
import { CreateRole } from '@/api'
import { toast } from 'sonner'
import { useState } from 'react'
import { queryClient } from '@/integrations/tanstack-query/root-provider'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function CreateRoleForm() {
	const { t } = useTranslation('admin')
	const { mutateAsync } = useMutation({
		mutationFn: CreateRole,
		onSuccess: () => {
			toast.success(t('roles.create.success'))
			setOpen(false)
			queryClient.invalidateQueries({ queryKey: ['roles'] })
		},
		onError: (err) => {
			console.error('CreateRole error', err)
			toast.error(t('roles.create.failed'), {
				description: getErrorMessage(err, t('common.retryLater'))
			})
		}
	})
	const form = useAppForm({
		defaultValues: { name: '', description: '' },
		onSubmit: async ({ value }) => {
			await mutateAsync(value)
		}
	})
	const [open, setOpen] = useState(false)

	return (
		<RoleModal
			title={t('roles.create.title')}
			form={form}
			formId='createRoleForm'
			open={open}
			onOpenChange={setOpen}
			actionText={t('roles.create.action')}
			loadingText={t('roles.create.loading')}
			trigger={
				<Button className='gap-2'>
					<Plus className='h-4 w-4' />
					{t('roles.create.trigger')}
				</Button>
			}
		/>
	)
}

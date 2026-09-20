import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../ui/dialog'
import { DialogClose, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'

interface PermissionModalProps {
	actionText: string
	loadingText: string
	title: string
	trigger: ReactNode
	form: any
	formId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export default function PermissionModal({
	actionText,
	loadingText,
	form,
	formId,
	open,
	title,
	trigger,
	onOpenChange
}: PermissionModalProps) {
	const { t } = useTranslation('admin')
	const handleSubmit = () => {}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<form
				onSubmit={handleSubmit}
				className='mt-4 space-y-4'
				id={formId}
			>
				<DialogTrigger>{trigger}</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<form.AppField name='name'>
						{(field: any) => (
							<field.TextField
								label={t('permissions.fields.name')}
								disabled
							/>
						)}
					</form.AppField>
					<form.AppField name='displayName'>
						{(field: any) => (
							<field.TextField
								label={t('permissions.fields.displayName')}
							/>
						)}
					</form.AppField>
					<form.AppField name='description'>
						{(field: any) => (
							<field.TextField
								label={t('permissions.fields.description')}
							/>
						)}
					</form.AppField>
					<form.AppField name='resourceId'>
						{(field: any) => (
							<field.TextField
								label={t('permissions.fields.resource')}
							/>
						)}
					</form.AppField>
					<form.AppField name='actionId'>
						{(field: any) => (
							<field.TextField
								label={t('permissions.fields.action')}
							/>
						)}
					</form.AppField>
					<DialogFooter>
						<DialogClose>
							<Button type='button' variant='outline'>
								{t('common.cancel')}
							</Button>
						</DialogClose>
						<form.Subscribe
							selector={(state: any) => [
								state.canSubmit,
								state.isSubmitting
							]}
							children={([canSubmit, isSubmitting]: any) => (
								<Button
									type='submit'
									disabled={!canSubmit}
									form={formId}
								>
									{isSubmitting ? loadingText : actionText}
								</Button>
							)}
						/>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	)
}

import type React from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface RoleModalProps {
	actionText: string
	loadingText: string
	title: string
	form: any
	formId: string
	open: boolean
	trigger: ReactNode
	onOpenChange: (open: boolean) => void
}

export default function RoleModal({
	actionText,
	loadingText,
	title,
	form,
	formId,
	open,
	trigger,
	onOpenChange
}: RoleModalProps) {
	const { t } = useTranslation('admin')
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		e.stopPropagation()
		form.handleSubmit()
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<form onSubmit={handleSubmit} id={formId}>
				<DialogTrigger asChild>{trigger}</DialogTrigger>
				<DialogContent className='sm:max-w-md h-auto'>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<div className='grid grid-cols-1 gap-4'>
						<form.AppField name='name'>
							{(field: any) => (
								<field.TextField
									label={t('roles.fields.name')}
								/>
							)}
						</form.AppField>

						<form.AppField name='description'>
							{(field: any) => (
								<field.TextField
									label={t('roles.fields.description')}
								/>
							)}
						</form.AppField>
					</div>

					<DialogFooter>
						<DialogClose asChild>
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

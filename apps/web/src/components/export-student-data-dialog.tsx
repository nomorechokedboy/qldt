import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { useAppForm } from '@/hooks/use-app-form'
import useAuth from '@/hooks/useAuth'
import useExportButton from '@/hooks/useExportButton'
import type { TemplType } from '@/types'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ExportStudentDataDialogProps {
	children: ReactNode
	data: Record<string, string>[]
	defaultFilename: string
	defaultValues?: {
		unitName?: string
		underUnitName?: string
	}
	templType: TemplType
	id?: string
}

export function ExportStudentDataDialog({
	children,
	data,
	defaultFilename,
	defaultValues,
	templType,
	id = 'exportFileForm'
}: ExportStudentDataDialogProps) {
	const { t } = useTranslation('io')
	const { user } = useAuth()
	const { onExport } = useExportButton({ filename: defaultFilename })
	const [open, setOpen] = useState(false)
	const form = useAppForm({
		defaultValues: {
			city: 'Đồng Nai',
			commanderName: user?.displayName ?? '',
			commanderPosition: 'CHỈ HUY ĐƠN VỊ',
			commanderRank: user?.rank ?? '',
			data,
			underUnitName: defaultValues?.underUnitName ?? '',
			unitName: defaultValues?.unitName ?? '',
			filename: defaultFilename,
			templateType: templType
		},
		onSubmit: async ({ value, formApi }) => {
			onExport(value).then(() => {
				formApi.reset()
			})
			setOpen(false)
		}
	})
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<form
				id={id}
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent className='container' key={id}>
					<DialogHeader>
						<DialogTitle>{t('export.generic.title')}</DialogTitle>
						<DialogDescription>
							{t('export.description')}
						</DialogDescription>
					</DialogHeader>
					<div className='grid grid-cols-3 gap-4'>
						<form.AppField
							name='filename'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.filename')
										: undefined
							}}
						>
							{(field) => (
								<field.EditableInput
									label={t('export.fields.filename')}
									ellipsisMaxWidth='500px'
								/>
							)}
						</form.AppField>
						<form.AppField
							name='unitName'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.unitName')
										: undefined
							}}
						>
							{(field) => (
								<field.EditableInput
									label={t('export.fields.unitName')}
									ellipsisMaxWidth='500px'
								/>
							)}
						</form.AppField>
						<form.AppField
							name='underUnitName'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.underUnitName')
										: undefined
							}}
						>
							{(field) => (
								<field.EditableInput
									label={t('export.fields.underUnitName')}
									ellipsisMaxWidth='500px'
								/>
							)}
						</form.AppField>
					</div>
					<div className='grid grid-cols-3 gap-4'>
						<form.AppField
							name='commanderPosition'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.commanderPosition')
										: undefined
							}}
						>
							{(field) => (
								<field.EditableInput
									label={t('export.fields.commanderPosition')}
									ellipsisMaxWidth='500px'
								/>
							)}
						</form.AppField>
						<form.AppField
							name='commanderName'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.commanderName')
										: undefined
							}}
						>
							{(field) => (
								<field.TextField
									label={t('export.fields.commanderName')}
								/>
							)}
						</form.AppField>
						<form.AppField
							name='commanderRank'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('export.required.commanderRank')
										: undefined
							}}
						>
							{(field) => (
								<field.TextField
									label={t('export.fields.commanderRank')}
								/>
							)}
						</form.AppField>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('export.cancel')}
							</Button>
						</DialogClose>
						<form.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting
							]}
							children={([canSubmit, isSubmitting]) => (
								<Button
									type='submit'
									form={id}
									disabled={!canSubmit}
								>
									{isSubmitting
										? t('export.exporting')
										: t('export.confirm')}
								</Button>
							)}
						/>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	)
}

import { Button } from '@/components/ui/button'
import { useAppForm } from '@/hooks/use-app-form'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import type { ExportPoliticsQualitySummary } from '@/types'
import useExportPoliticsQualityReport from '@/hooks/useExportPoliticsQualityReport'

export interface ExportPoliticsQualityDialogProps {
	children: ReactNode
	data: {
		data: ExportPoliticsQualitySummary[]
		total: Omit<ExportPoliticsQualitySummary, 'idx' | 'className' | 'note'>
	}
	defaultFilename: string
}

export default function ExportPoliticsQualityDialog({
	children,
	data: { total, data },
	defaultFilename
}: ExportPoliticsQualityDialogProps) {
	const { t } = useTranslation('stats')
	const { onExport } = useExportPoliticsQualityReport({
		filename: defaultFilename
	})
	const [open, setOpen] = useState(false)
	const form = useAppForm({
		defaultValues: {
			data,
			total,
			title: '',
			filename: defaultFilename
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
				id='exportFileForm'
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent className='sm:max-w-[425px] h-auto'>
					<DialogHeader>
						<DialogTitle>{t('exportDialog.title')}</DialogTitle>
						<DialogDescription>
							{t('exportDialog.description')}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4'>
						<form.AppField
							name='title'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('exportDialog.titleRequired')
										: undefined
							}}
						>
							{(field) => (
								<field.TextField
									label={t('exportDialog.titleLabel')}
								/>
							)}
						</form.AppField>
						<form.AppField
							name='filename'
							validators={{
								onBlur: ({ value }) =>
									!value
										? t('exportDialog.filenameRequired')
										: undefined
							}}
						>
							{(field) => (
								<field.TextField
									label={t('exportDialog.filenameLabel')}
								/>
							)}
						</form.AppField>
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('exportDialog.cancel')}
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
									form='exportFileForm'
									disabled={!canSubmit}
								>
									{isSubmitting
										? t('exportDialog.exporting')
										: t('exportDialog.confirm')}
								</Button>
							)}
						/>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	)
}

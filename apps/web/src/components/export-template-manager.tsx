import { DataTable } from '@/components/data-table'
import { ExportTemplateGuideline } from '@/components/export-template-guideline'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	useDeleteExportTemplate,
	useExportTemplates,
	useUploadExportTemplate
} from '@/hooks/useExportTemplates'
import type { ExportResourceType, ExportTemplate } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export interface ExportTemplateManagerProps {
	children: ReactNode
	resourceType: ExportResourceType
}

export function ExportTemplateManager({
	children,
	resourceType
}: ExportTemplateManagerProps) {
	const { t } = useTranslation('io')
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	const columns = useMemo<ColumnDef<ExportTemplate>[]>(
		() => [
			{
				id: 'select',
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() &&
								'indeterminate')
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label='Select all'
						className='translate-y-[2px]'
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label='Select row'
						className='translate-y-[2px]'
					/>
				),
				enableSorting: false,
				enableHiding: false
			},
			{
				accessorKey: 'name',
				header: t('templates.columns.name')
			},
			{
				accessorKey: 'originalFilename',
				header: t('templates.columns.filename')
			}
		],
		[t]
	)

	const {
		data: templates,
		isLoading,
		refetch
	} = useExportTemplates(resourceType)
	const { mutateAsync: upload, isPending: isUploading } =
		useUploadExportTemplate(resourceType)
	const { mutateAsync: remove } = useDeleteExportTemplate(resourceType)

	async function handleUpload() {
		const file = fileInputRef.current?.files?.[0]
		if (!file) {
			toast.error(t('templates.pickFile'))
			return
		}
		if (!name.trim()) {
			toast.error(t('templates.nameRequired'))
			return
		}

		const formData = new FormData()
		formData.append('name', name)
		formData.append('resourceType', resourceType)
		formData.append('file', file)

		try {
			await upload(formData)
			setName('')
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
			toast.success(t('templates.uploaded'))
		} catch (err) {
			console.error('handleUpload error', err)
			toast.error(t('templates.uploadFailed'))
		}
	}

	async function handleDeleteRows(ids: number[]) {
		await Promise.all(ids.map((id) => remove(id)))
		return refetch()
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className='container'>
				<DialogHeader>
					<DialogTitle>{t('templates.title')}</DialogTitle>
					<DialogDescription>
						{t('templates.description')}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue='templates'>
					<TabsList>
						<TabsTrigger value='templates'>
							{t('templates.tabs.mine')}
						</TabsTrigger>
						<TabsTrigger value='guideline'>
							{t('templates.tabs.guideline')}
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value='templates'
						className='flex flex-col gap-4'
					>
						<div className='grid grid-cols-[1fr_1fr_auto] items-end gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='template-name'>
									{t('templates.nameLabel')}
								</Label>
								<Input
									id='template-name'
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t('templates.namePlaceholder')}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='template-file'>
									{t('templates.fileLabel')}
								</Label>
								<Input
									id='template-file'
									ref={fileInputRef}
									type='file'
									accept='.docx'
								/>
							</div>
							<Button
								onClick={handleUpload}
								disabled={isUploading}
							>
								{isUploading
									? t('templates.uploading')
									: t('templates.upload')}
							</Button>
						</div>

						<DataTable
							columns={columns}
							data={isLoading ? [] : (templates ?? [])}
							placeholder={
								isLoading
									? t('templates.loading')
									: t('templates.empty')
							}
							onDeleteRows={handleDeleteRows}
							pagination={false}
							toolbarVisible={false}
						/>
					</TabsContent>
					<TabsContent value='guideline'>
						<ExportTemplateGuideline resourceType={resourceType} />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}

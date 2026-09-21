import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pencil, Trash, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
	Card,
	CardHeader,
	CardTitle,
	CardFooter,
	CardDescription
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import UnitEditForm from '@/components/UnitEditForm'
import { useDeleteUnits } from '@/hooks/useDeleteUnits'
import useAuth from '@/hooks/useAuth'
import {
	getUnitDetailUrl,
	unitDetailRoutePrefix,
	unitLevelLabels
} from '@/data/unit-levels'
import type { Unit } from '@/types'
import { toastApiError } from '@/lib/api-error'

function unitDetailLink(data: Unit) {
	const to = getUnitDetailUrl(data.level, encodeURIComponent(data.alias))

	// Levels without a dedicated route (see unitDetailRoutePrefix) fall back
	// to the generic '/don-vi' route, which needs the level/name search
	// params the dedicated routes don't.
	if (unitDetailRoutePrefix[data.level] === undefined) {
		return {
			to,
			search: { level: data.level, name: '', id: data.id }
		} as const
	}

	return { to, search: { level: data.level, name: '', id: data.id } } as const
}

interface UnitCardProps {
	data: Unit
	onEdit?: () => void
	onDelete?: () => void
}

export default function UnitCard({ data, onEdit, onDelete }: UnitCardProps) {
	const { t } = useTranslation('units')
	const [openEdit, setOpenEdit] = useState(false)
	const [openDelete, setOpenDelete] = useState(false)
	const deleteUnitMutation = useDeleteUnits()
	const { user } = useAuth()
	const isSuperAdmin = !!user?.isSuperAdmin

	const handleDelete = async () => {
		try {
			await deleteUnitMutation.mutateAsync([data.id])
			toast.success(t('card.deleteSuccess', { name: data.name }))
			onDelete?.()
		} catch (error) {
			toastApiError(t('card.deleteFailed'), error)
		} finally {
			setOpenDelete(false)
		}
	}

	const levelLabel = unitLevelLabels[data.level]
	const isRoot = !data.parent

	return (
		<>
			<Card className='@container/card relative group'>
				<CardHeader className='flex items-center justify-between'>
					<div>
						<CardTitle className='text-xl font-semibold flex items-center gap-2'>
							{data.name}
							<Badge variant='secondary' className='text-xs'>
								{levelLabel}
							</Badge>
							{isRoot && (
								<Badge variant='outline' className='text-xs'>
									{t('card.rootBadge')}
								</Badge>
							)}
						</CardTitle>
						<CardDescription>
							{t('card.aliasLine', { alias: data.alias })}
							{data.parent &&
								t('card.parentSuffix', {
									name: data.parent.name
								})}
						</CardDescription>
					</div>
					<div className='hidden gap-2 transition-all group-hover:flex self-start'>
						<Button
							asChild
							type='button'
							aria-label='Manage'
							title={t('card.manage')}
							variant='ghost'
							className='text-emerald-600'
							size='icon'
						>
							<Link {...unitDetailLink(data)}>
								<ExternalLink size={18} />
							</Link>
						</Button>
						<Button
							type='button'
							aria-label='Edit'
							title={t('card.edit')}
							variant='ghost'
							className='text-sky-600'
							size='icon'
							onClick={() => setOpenEdit(true)}
						>
							<Pencil size={18} />
						</Button>
						{!isRoot && isSuperAdmin && (
							<Button
								type='button'
								variant='ghost'
								aria-label='Delete'
								title={t('card.delete')}
								className='text-destructive'
								size='icon'
								onClick={() => setOpenDelete(true)}
							>
								<Trash size={18} />
							</Button>
						)}
					</div>
				</CardHeader>
				{data.children !== undefined && data.children.length > 0 && (
					<CardFooter className='flex-col items-start gap-1.5 text-sm'>
						<div className='text-muted-foreground'>
							{t('card.childCount', {
								count: data.children.length
							})}
						</div>
					</CardFooter>
				)}
			</Card>

			<Dialog open={openEdit} onOpenChange={setOpenEdit}>
				<DialogContent className='backdrop-blur-sm flex items-center justify-center'>
					<DialogTitle className='sr-only'>
						{t('card.editTitle')}
					</DialogTitle>
					<UnitEditForm
						unitData={data}
						onUpdate={() => {
							onEdit?.()
							setOpenEdit(false)
						}}
						onClose={() => setOpenEdit(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={openDelete} onOpenChange={setOpenDelete}>
				<DialogContent className='max-w-md max-h-1/3'>
					<DialogTitle className='sr-only'>
						{t('card.deleteTitle')}
					</DialogTitle>
					<div className='flex flex-col gap-4'>
						<div className='font-semibold text-lg text-center'>
							{t('card.deleteHeading')}
						</div>
						<div className='text-center text-muted-foreground'>
							<Trans
								t={t}
								i18nKey='card.deleteConfirm'
								values={{ name: data.name }}
								components={{
									name: <b className='text-red-600' />
								}}
							/>
							<p>
								<Trans
									t={t}
									i18nKey='card.irreversible'
									components={{ strong: <b /> }}
								/>
							</p>
						</div>
						<div className='flex justify-end gap-2 mt-4'>
							<button
								type='button'
								className='px-4 py-2 rounded-lg border'
								onClick={() => setOpenDelete(false)}
								disabled={deleteUnitMutation.isPending}
							>
								{t('card.cancel')}
							</button>
							<button
								type='button'
								className='px-4 py-2 rounded-lg bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50'
								onClick={handleDelete}
								disabled={deleteUnitMutation.isPending}
							>
								{deleteUnitMutation.isPending
									? t('card.deleting')
									: t('card.delete')}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

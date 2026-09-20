import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { toast } from 'sonner'
import type { inventory_sessions } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useApplyInventorySessionResults } from '@/hooks/useInventorySession'
import {
	materialConditionLabels,
	materialConditionOptions
} from '@/data/material-categories'

interface InventorySessionApplyPanelProps {
	session: inventory_sessions.InventorySessionResp
	diff: inventory_sessions.InventorySessionDiffItem[]
	stockDiff: inventory_sessions.InventorySessionStockDiffItem[]
	onApplied: (review: inventory_sessions.InventorySessionReview) => void
}

function stockKey(materialTypeId: number, condition: string): string {
	return `${materialTypeId}:${condition}`
}

// Git-conflict-resolution-style follow-up to the diff review: missing assets
// are always marked lost and condition changes always applied automatically
// (there's nothing for a human to decide there), but an unmatched extra
// asset serial or a short/over/extra stock line only gets written into
// material_assets/material_stocks when the reviewer explicitly checks it
// here and hits the apply button - everything left unchecked stays
// flagged in the diff for a later pass instead of being silently applied or
// silently dropped.
export default function InventorySessionApplyPanel({
	session,
	diff,
	stockDiff,
	onApplied
}: InventorySessionApplyPanelProps) {
	const { t } = useTranslation('materials')
	const [selectedSerials, setSelectedSerials] = useState<Set<string>>(
		new Set()
	)
	const [selectedStockKeys, setSelectedStockKeys] = useState<Set<string>>(
		new Set()
	)
	const applyResults = useApplyInventorySessionResults()

	if (session.status !== 'reviewed') return null
	if (session.appliedAt !== null) {
		return (
			<p className='text-muted-foreground text-sm text-center'>
				{t('inventory.apply.applied')}
			</p>
		)
	}

	const missingCount = diff.filter((d) => d.status === 'missing').length
	const conditionChangedCount = diff.filter(
		(d) => d.status === 'condition_changed'
	).length
	const extraAssets = diff.filter((d) => d.status === 'extra')
	const resolvableStockLines = stockDiff.filter((s) => s.status !== 'matched')

	const toggleSerial = (serial: string) =>
		setSelectedSerials((prev) => {
			const next = new Set(prev)
			if (next.has(serial)) next.delete(serial)
			else next.add(serial)
			return next
		})

	const toggleStockLine = (key: string) =>
		setSelectedStockKeys((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})

	const handleApply = async () => {
		try {
			const result = await applyResults.mutateAsync({
				id: session.id,
				assetResolutions: extraAssets.map((d) => ({
					serial: d.serial,
					action: selectedSerials.has(d.serial) ? 'apply' : 'ignore'
				})),
				stockResolutions: resolvableStockLines.map((s) => ({
					materialTypeId: s.materialTypeId,
					condition: s.condition,
					action: selectedStockKeys.has(
						stockKey(s.materialTypeId, s.condition)
					)
						? 'apply'
						: 'ignore'
				}))
			})
			toast.success(
				t('inventory.apply.success', {
					missing: result.data.missingApplied,
					conditionChanged: result.data.conditionChangedApplied,
					extraAssets: result.data.extraAssetsApplied,
					stockLines:
						result.data.stockShortOverApplied +
						result.data.stockExtraApplied
				})
			)
			onApplied({
				session: result.data.session,
				diff,
				stockDiff
			})
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : t('inventory.apply.failed')
			)
		}
	}

	const hasAnyResolvableLines =
		missingCount > 0 ||
		conditionChangedCount > 0 ||
		extraAssets.length > 0 ||
		resolvableStockLines.length > 0

	if (!hasAnyResolvableLines) return null

	return (
		<div className='flex flex-col gap-3 rounded-md border p-3'>
			<p className='text-sm font-medium'>{t('inventory.apply.title')}</p>

			{(missingCount > 0 || conditionChangedCount > 0) && (
				<p className='text-muted-foreground text-xs'>
					{t('inventory.apply.automatic', {
						missing: missingCount,
						conditionChanged: conditionChangedCount
					})}
				</p>
			)}

			{extraAssets.length > 0 && (
				<div className='flex flex-col gap-1.5'>
					<p className='text-xs font-medium'>
						{t('inventory.apply.extraAssets')}
					</p>
					{extraAssets.map((d) => (
						<label
							key={d.serial}
							className='flex items-center gap-2 text-xs'
						>
							<Checkbox
								checked={selectedSerials.has(d.serial)}
								onCheckedChange={() => toggleSerial(d.serial)}
							/>
							<span className='font-mono'>{d.serial}</span>
							{d.observedCondition && (
								<span className='text-muted-foreground'>
									(
									{
										materialConditionLabels[
											d.observedCondition
										]
									}
									)
								</span>
							)}
						</label>
					))}
				</div>
			)}

			{resolvableStockLines.length > 0 && (
				<div className='flex flex-col gap-1.5'>
					<p className='text-xs font-medium'>
						{t('inventory.apply.stockLines')}
					</p>
					{resolvableStockLines.map((s) => {
						const key = stockKey(s.materialTypeId, s.condition)
						return (
							<label
								key={key}
								className='flex items-center gap-2 text-xs'
							>
								<Checkbox
									checked={selectedStockKeys.has(key)}
									onCheckedChange={() => toggleStockLine(key)}
								/>
								<span>
									{s.materialTypeName ??
										`#${s.materialTypeId}`}{' '}
									(
									{materialConditionOptions.find(
										(o) => o.value === s.condition
									)?.label ?? s.condition}
									) -{' '}
									{t('inventory.apply.observedQuantity', {
										count: s.observedQuantity
									})}
								</span>
							</label>
						)
					})}
				</div>
			)}

			<Button
				onClick={handleApply}
				disabled={applyResults.isPending}
				size='sm'
			>
				{applyResults.isPending
					? t('inventory.apply.applying')
					: t('inventory.apply.title')}
			</Button>
		</div>
	)
}

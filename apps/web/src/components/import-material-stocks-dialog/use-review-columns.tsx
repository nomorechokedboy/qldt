import { reviewInputClass } from '@/components/import-students-dialog/review-input-class'
import {
	indexColumn,
	statusColumn,
	toOptionalId
} from '@/components/material-import/review-columns'
import { materialConditionOptions } from '@/data/material-categories'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StockImportLookups } from './build-lookups'
import type { MaterialConditionName, MaterialStockImportRow } from './types'

interface UseReviewColumnsOptions {
	lookups: StockImportLookups
	errorsByRowIndex: Map<number, string[]>
	updateRow: (index: number, patch: Partial<MaterialStockImportRow>) => void
	clearRowErrors: (index: number, keywords: string[]) => void
}

export function useReviewColumns({
	lookups,
	errorsByRowIndex,
	updateRow,
	clearRowErrors
}: UseReviewColumnsOptions) {
	const { t } = useTranslation('materials')
	const { materialTypeOptions, unitOptions, roomsByUnitId } = lookups

	return useMemo<ColumnDef<MaterialStockImportRow>[]>(() => {
		const changeMaterialType = (index: number, value: string) => {
			const id = toOptionalId(value)
			updateRow(index, { materialTypeId: id })
			if (id !== undefined) clearRowErrors(index, ['vật tư'])
		}

		// Moving a row to another unit invalidates its room, which belongs
		// to the old unit.
		const changeUnit = (index: number, value: string) => {
			const id = toOptionalId(value)
			updateRow(index, { unitId: id, roomId: undefined })
			if (id !== undefined) clearRowErrors(index, ['đơn vị', 'vị trí'])
		}

		const changeRoom = (index: number, value: string) => {
			updateRow(index, { roomId: toOptionalId(value) })
			clearRowErrors(index, ['vị trí'])
		}

		return [
			indexColumn(),
			statusColumn(errorsByRowIndex),
			{
				accessorKey: 'materialTypeId',
				header: t('importStocks.columns.materialType'),
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.materialTypeId ?? ''}
						onChange={(e) =>
							changeMaterialType(row.index, e.target.value)
						}
					>
						<option value=''>
							{t('importStocks.pickMaterialType')}
						</option>
						{materialTypeOptions.map((o) => (
							<option key={o.id} value={o.id}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'unitId',
				header: t('importStocks.columns.unit'),
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.unitId ?? ''}
						onChange={(e) => changeUnit(row.index, e.target.value)}
					>
						<option value=''>{t('importShared.pickUnit')}</option>
						{unitOptions.map((o) => (
							<option key={o.id} value={o.id}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'roomId',
				header: t('importStocks.columns.room'),
				cell: ({ row }) => {
					const unitId = row.original.unitId
					const options =
						unitId !== undefined
							? (roomsByUnitId.get(unitId) ?? [])
							: []
					return (
						<select
							className={reviewInputClass}
							value={row.original.roomId ?? ''}
							disabled={unitId === undefined}
							onChange={(e) =>
								changeRoom(row.index, e.target.value)
							}
						>
							<option value=''>
								{t('shared.noSpecificRoom')}
							</option>
							{options.map((r) => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</select>
					)
				}
			},
			{
				accessorKey: 'quantity',
				header: t('importStocks.columns.quantity'),
				cell: ({ row }) => (
					<input
						type='number'
						min={1}
						className={reviewInputClass}
						value={row.original.quantity}
						onChange={(e) =>
							updateRow(row.index, {
								quantity: Number(e.target.value)
							})
						}
					/>
				)
			},
			{
				accessorKey: 'condition',
				header: t('importStocks.columns.condition'),
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.condition ?? ''}
						onChange={(e) =>
							updateRow(row.index, {
								condition: (e.target.value ||
									undefined) as MaterialConditionName
							})
						}
					>
						<option value=''>
							{t('importAssets.defaultCondition')}
						</option>
						{materialConditionOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				)
			}
		]
	}, [
		errorsByRowIndex,
		materialTypeOptions,
		unitOptions,
		roomsByUnitId,
		updateRow,
		clearRowErrors,
		t
	])
}

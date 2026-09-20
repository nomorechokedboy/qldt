import {
	indexColumn,
	statusColumn,
	toOptionalId
} from '@/components/material-import/review-columns'
import { reviewInputClass } from '@/components/import-students-dialog/review-input-class'
import {
	materialAssetStatusOptions,
	materialConditionOptions
} from '@/data/material-categories'
import { MAX_MATERIAL_ASSET_SERIAL_LENGTH } from '@/lib/material-limits'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { studentLabel, type AssetImportLookups } from './build-lookups'
import type {
	MaterialAssetImportRow,
	MaterialAssetStatus,
	MaterialConditionName
} from './types'

interface UseReviewColumnsOptions {
	lookups: AssetImportLookups
	errorsByRowIndex: Map<number, string[]>
	updateRow: (index: number, patch: Partial<MaterialAssetImportRow>) => void
	clearRowErrors: (index: number, keywords: string[]) => void
}

export function useReviewColumns({
	lookups,
	errorsByRowIndex,
	updateRow,
	clearRowErrors
}: UseReviewColumnsOptions) {
	const { t } = useTranslation('materials')
	const {
		materialTypeOptions,
		unitOptions,
		roomsByUnitId,
		studentsByUnitId
	} = lookups

	return useMemo<ColumnDef<MaterialAssetImportRow>[]>(() => {
		const changeMaterialType = (index: number, value: string) => {
			const id = toOptionalId(value)
			updateRow(index, { materialTypeId: id })
			if (id !== undefined) clearRowErrors(index, ['khí tài'])
		}

		// Moving a row to another unit invalidates its room and trooper,
		// which belong to the old unit.
		const changeUnit = (index: number, value: string) => {
			const id = toOptionalId(value)
			updateRow(index, {
				unitId: id,
				roomId: undefined,
				assignedTrooperId: undefined
			})
			if (id !== undefined) {
				clearRowErrors(index, ['đơn vị', 'vị trí', 'quân nhân'])
			}
		}

		const changeRoom = (index: number, value: string) => {
			updateRow(index, { roomId: toOptionalId(value) })
			clearRowErrors(index, ['vị trí'])
		}

		const changeTrooper = (index: number, value: string) => {
			updateRow(index, { assignedTrooperId: toOptionalId(value) })
			clearRowErrors(index, ['quân nhân'])
		}

		return [
			indexColumn(),
			statusColumn(errorsByRowIndex),
			{
				accessorKey: 'materialTypeId',
				header: t('importAssets.columns.materialType'),
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.materialTypeId ?? ''}
						onChange={(e) =>
							changeMaterialType(row.index, e.target.value)
						}
					>
						<option value=''>
							{t('importAssets.pickMaterialType')}
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
				accessorKey: 'serialNumber',
				header: t('importAssets.columns.serialNumber'),
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.serialNumber}
						maxLength={MAX_MATERIAL_ASSET_SERIAL_LENGTH}
						onChange={(e) =>
							updateRow(row.index, {
								serialNumber: e.target.value
							})
						}
					/>
				)
			},
			{
				accessorKey: 'unitId',
				header: t('importAssets.columns.unit'),
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
				header: t('importAssets.columns.room'),
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
				accessorKey: 'condition',
				header: t('importAssets.columns.condition'),
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
			},
			{
				accessorKey: 'assetStatus',
				header: t('importAssets.columns.status'),
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.status ?? ''}
						onChange={(e) =>
							updateRow(row.index, {
								status: (e.target.value ||
									undefined) as MaterialAssetStatus
							})
						}
					>
						<option value=''>
							{t('importAssets.defaultStatus')}
						</option>
						{materialAssetStatusOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'assignedTrooperId',
				header: t('importAssets.columns.assignedTrooper'),
				cell: ({ row }) => {
					const unitId = row.original.unitId
					const options =
						unitId !== undefined
							? (studentsByUnitId.get(unitId) ?? [])
							: []
					return (
						<select
							className={reviewInputClass}
							value={row.original.assignedTrooperId ?? ''}
							disabled={unitId === undefined}
							onChange={(e) =>
								changeTrooper(row.index, e.target.value)
							}
						>
							<option value=''>{t('shared.notAssigned')}</option>
							{options.map((s) => (
								<option key={s.id} value={s.id}>
									{studentLabel(s)}
								</option>
							))}
						</select>
					)
				}
			}
		]
	}, [
		errorsByRowIndex,
		materialTypeOptions,
		unitOptions,
		roomsByUnitId,
		studentsByUnitId,
		updateRow,
		clearRowErrors,
		t
	])
}

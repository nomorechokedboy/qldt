import { activityStatusOptions } from '@/data/activity-statuses'
import type { StudentBody } from '@/types'
import { useStore } from '@tanstack/react-form'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ReviewComboboxCell } from './review-combobox-cell'
import { ReviewDateField } from './review-date-field'
import { reviewInputClass } from './review-input-class'
import { ReviewSelectCell } from './review-select-cell'
import type { ReviewForm, TrackedErrorField } from './use-review-table-state'
import {
	TRACKED_ERROR_FIELDS,
	fieldErrorMessages
} from './use-review-table-state'

interface SelectOption {
	value: string
	label: string
}

function RowStatusCell({ form, index }: { form: ReviewForm; index: number }) {
	const { t } = useTranslation('io')
	const messages = useStore(form.store, (state) =>
		TRACKED_ERROR_FIELDS.flatMap((field) =>
			fieldErrorMessages(state.fieldMeta, index, field)
		)
	)

	return messages.length > 0 ? (
		<span
			className='flex items-center gap-1 text-destructive'
			title={messages.join('\n')}
		>
			<AlertCircle className='h-4 w-4 flex-shrink-0' />
			{t('importDialog.rowStatus.error')}
		</span>
	) : (
		<span className='flex items-center gap-1 text-green-700 dark:text-green-400'>
			<CheckCircle className='h-4 w-4 flex-shrink-0' />
			{t('importDialog.rowStatus.ok')}
		</span>
	)
}

export interface UseReviewColumnsParams {
	form: ReviewForm
	clearFieldError: (index: number, field: TrackedErrorField) => void
	unitSelectOptions: SelectOption[]
	positionComboboxOptions: { value: string; label: string; group: string }[]
	provinceSelectOptions: SelectOption[]
	wardSelectOptionsByProvinceCode: Map<string, SelectOption[]>
}

export function useReviewColumns({
	form,
	clearFieldError,
	unitSelectOptions,
	positionComboboxOptions,
	provinceSelectOptions,
	wardSelectOptionsByProvinceCode
}: UseReviewColumnsParams): ColumnDef<StudentBody>[] {
	const { t } = useTranslation('io')
	return useMemo<ColumnDef<StudentBody>[]>(
		() => [
			{
				id: 'index',
				header: '#',
				cell: ({ row }) => (
					<span className='text-muted-foreground'>
						{row.index + 1}
					</span>
				)
			},
			{
				id: 'status',
				header: t('importDialog.columns.status'),
				cell: ({ row }) => (
					<RowStatusCell form={form} index={row.index} />
				)
			},
			{
				accessorKey: 'fullName',
				header: t('importDialog.columns.fullName'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].fullName`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'studentId',
				header: t('importDialog.columns.studentId'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].studentId`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'unitId',
				header: t('importDialog.columns.unit'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].unitId`}>
						{(field) => (
							<ReviewSelectCell
								value={
									field.state.value !== undefined &&
									field.state.value !== null
										? String(field.state.value)
										: ''
								}
								onChange={(value) => {
									const id =
										value === '' ? undefined : Number(value)
									field.handleChange(id)
									if (id !== undefined)
										clearFieldError(row.index, 'unitId')
								}}
								options={unitSelectOptions}
								placeholder={t(
									'importDialog.placeholders.unit'
								)}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'positionId',
				header: t('importDialog.columns.position'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].positionId`}>
						{(field) => (
							<ReviewComboboxCell
								value={
									field.state.value !== undefined &&
									field.state.value !== null
										? String(field.state.value)
										: ''
								}
								onChange={(value) => {
									const id =
										value === '' ? undefined : Number(value)
									field.handleChange(id)
									if (id !== undefined)
										clearFieldError(row.index, 'positionId')
								}}
								options={positionComboboxOptions}
								placeholder={t(
									'importDialog.placeholders.position'
								)}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'rank',
				header: t('importDialog.columns.rank'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].rank`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'dob',
				header: t('importDialog.columns.dob'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].dob`}>
						{(field) => (
							<ReviewDateField
								value={field.state.value}
								onChange={(value) =>
									field.handleChange(value ?? '')
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'phone',
				header: t('importDialog.columns.phone'),
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].phone`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'activityStatus',
				header: t('importDialog.columns.activityStatus'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].activityStatus`}>
						{(field) => (
							<ReviewSelectCell
								value={field.state.value ?? 'serving'}
								onChange={(value) =>
									field.handleChange(
										value as StudentBody['activityStatus']
									)
								}
								options={activityStatusOptions}
								placeholder={t(
									'importDialog.placeholders.activityStatus'
								)}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'birthPlaceProvinceCode',
				id: 'birthPlaceProvinceCode',
				header: t('importDialog.columns.birthProvince'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field
						name={`rows[${row.index}].birthPlaceProvinceCode`}
					>
						{(field) => (
							<ReviewSelectCell
								value={field.state.value ?? ''}
								onChange={(value) => {
									field.handleChange(
										value === '' ? undefined : value
									)
									form.setFieldValue(
										`rows[${row.index}].birthPlaceWardCode`,
										undefined
									)
								}}
								options={provinceSelectOptions}
								placeholder={t(
									'importDialog.placeholders.province'
								)}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'birthPlaceWardCode',
				id: 'birthPlaceWardCode',
				header: t('importDialog.columns.birthWard'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field
						name={`rows[${row.index}].birthPlaceProvinceCode`}
					>
						{(provinceField) => {
							const provinceCode = provinceField.state.value
							const wardChoices = provinceCode
								? (wardSelectOptionsByProvinceCode.get(
										provinceCode
									) ?? [])
								: []
							return (
								<form.Field
									name={`rows[${row.index}].birthPlaceWardCode`}
								>
									{(field) => (
										<ReviewSelectCell
											value={field.state.value ?? ''}
											disabled={!provinceCode}
											onChange={(value) => {
												const code =
													value === ''
														? undefined
														: value
												field.handleChange(code)
												if (code !== undefined) {
													clearFieldError(
														row.index,
														'birthPlaceProvinceCode'
													)
													clearFieldError(
														row.index,
														'birthPlaceWardCode'
													)
												}
											}}
											options={wardChoices}
											placeholder={t(
												'importDialog.placeholders.ward'
											)}
										/>
									)}
								</form.Field>
							)
						}}
					</form.Field>
				)
			},
			{
				accessorKey: 'birthPlace',
				header: t('importDialog.columns.birthDetail'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].birthPlace`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'addressProvinceCode',
				id: 'addressProvinceCode',
				header: t('importDialog.columns.addressProvince'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].addressProvinceCode`}>
						{(field) => (
							<ReviewSelectCell
								value={field.state.value ?? ''}
								onChange={(value) => {
									field.handleChange(
										value === '' ? undefined : value
									)
									form.setFieldValue(
										`rows[${row.index}].addressWardCode`,
										undefined
									)
								}}
								options={provinceSelectOptions}
								placeholder={t(
									'importDialog.placeholders.province'
								)}
							/>
						)}
					</form.Field>
				)
			},
			{
				accessorKey: 'addressWardCode',
				id: 'addressWardCode',
				header: t('importDialog.columns.addressWard'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].addressProvinceCode`}>
						{(provinceField) => {
							const provinceCode = provinceField.state.value
							const wardChoices = provinceCode
								? (wardSelectOptionsByProvinceCode.get(
										provinceCode
									) ?? [])
								: []
							return (
								<form.Field
									name={`rows[${row.index}].addressWardCode`}
								>
									{(field) => (
										<ReviewSelectCell
											value={field.state.value ?? ''}
											disabled={!provinceCode}
											onChange={(value) => {
												const code =
													value === ''
														? undefined
														: value
												field.handleChange(code)
												if (code !== undefined) {
													clearFieldError(
														row.index,
														'addressProvinceCode'
													)
													clearFieldError(
														row.index,
														'addressWardCode'
													)
												}
											}}
											options={wardChoices}
											placeholder={t(
												'importDialog.placeholders.ward'
											)}
										/>
									)}
								</form.Field>
							)
						}}
					</form.Field>
				)
			},
			{
				accessorKey: 'address',
				header: t('importDialog.columns.addressDetail'),
				enableHiding: true,
				cell: ({ row }) => (
					<form.Field name={`rows[${row.index}].address`}>
						{(field) => (
							<input
								type='text'
								className={reviewInputClass}
								value={field.state.value ?? ''}
								onChange={(e) =>
									field.handleChange(e.target.value)
								}
							/>
						)}
					</form.Field>
				)
			}
		],
		[
			form,
			clearFieldError,
			unitSelectOptions,
			positionComboboxOptions,
			provinceSelectOptions,
			wardSelectOptionsByProvinceCode,
			t
		]
	)
}

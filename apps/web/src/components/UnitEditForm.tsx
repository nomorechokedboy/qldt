import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useUpdateUnits } from '@/hooks/useUpdateUnits'
import UnitSelect from '@/components/unit/select'
import useUnitOptions from '@/hooks/useUnitOptions'
import { buildUnitOptions } from '@/lib/unit-options'
import useUnitData from '@/hooks/useUnitData'
import useAuth from '@/hooks/useAuth'
import {
	isCompanyOrAboveLevel,
	isLargerUnitLevel,
	levelOptionsUnderRoot,
	rootUnitLevelOptions,
	unitLevelLabels
} from '@/data/unit-levels'
import type { Unit, UnitLevel } from '@/types'
import { getErrorMessage } from '@/lib/utils'
import UnitCommanderFields, {
	commanderValuesFromUnit,
	commanderValuesToPayload,
	SingleCommanderField,
	type CommanderFieldKey,
	type UnitCommanderValues
} from '@/components/unit-commander-fields'

const NO_PARENT = 'none'

interface UnitEditFormProps {
	unitData: Unit
	onUpdate: (updated: {
		alias: string
		name: string
		level: UnitLevel
		parentId: number | null
	}) => void
	onClose: () => void
}

export default function UnitEditForm({
	unitData,
	onUpdate,
	onClose
}: UnitEditFormProps) {
	const { t } = useTranslation('units')
	// unitData may have come from a nested list (e.g. a platoon read off its
	// company's `children`, or a squad off a platoon's), where `.parent`
	// isn't populated past the first level of nesting. Re-fetch this exact
	// unit by its own id so `.parent` is always correct regardless of how
	// deeply it was nested when the caller found it.
	const { data: freshUnit, isLoading } = useUnitData({ id: unitData.id })

	if (isLoading || freshUnit === undefined) {
		return (
			<div className='rounded-2xl shadow-xl w-full max-w-md p-6 relative'>
				<Button
					type='button'
					onClick={onClose}
					variant='ghost'
					size='icon'
					className='absolute top-3 right-3'
				>
					<X className='h-4 w-4' />
				</Button>
				<p className='text-sm text-muted-foreground'>
					{t('form.loading')}
				</p>
			</div>
		)
	}

	return (
		<UnitEditFormBody
			unitData={freshUnit}
			onUpdate={onUpdate}
			onClose={onClose}
		/>
	)
}

function UnitEditFormBody({ unitData, onUpdate, onClose }: UnitEditFormProps) {
	const { t } = useTranslation('units')
	const [alias, setAlias] = useState(unitData.alias)
	const [name, setName] = useState(unitData.name)
	const [level, setLevel] = useState<UnitLevel>(unitData.level)
	const [parentId, setParentId] = useState<string>(
		unitData.parent?.id !== undefined && unitData.parent !== null
			? String(unitData.parent.id)
			: NO_PARENT
	)
	const [commanders, setCommanders] = useState<UnitCommanderValues>(
		commanderValuesFromUnit(unitData)
	)

	const { units: allUnits, unitsById } = useUnitOptions()
	const updateUnitMutation = useUpdateUnits()
	const { user } = useAuth()

	// A unit's level and parent are fixed once created - only a super
	// admin can restructure the hierarchy afterwards (mirrors the backend
	// check in units/controller.ts#update). Non-super-admins still see the
	// current values, just as read-only text rather than editable pickers.
	const isSuperAdmin = !!user?.isSuperAdmin

	// Same ceiling as the create form: nothing can sit at or above the
	// actual root unit's level. The one exception is the root unit's own
	// edit form - it keeps its root-eligible range (company-or-above)
	// instead of being capped against itself.
	const rootUnit = allUnits?.find((u) => !u.parent)
	const isEditingRoot = rootUnit !== undefined && rootUnit.id === unitData.id
	const levelOptions = isEditingRoot
		? rootUnitLevelOptions
		: levelOptionsUnderRoot(rootUnit?.level)

	const parentOptions = allUnits.filter(
		(u) => u.id !== unitData.id && isLargerUnitLevel(u.level, level)
	)
	const parentSelectOptions = buildUnitOptions(parentOptions, { unitsById })

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const nextParentId = parentId === NO_PARENT ? null : Number(parentId)

		try {
			await updateUnitMutation.mutateAsync([
				{
					id: unitData.id,
					alias,
					name,
					level,
					parentId: nextParentId,
					...commanderValuesToPayload(commanders)
				}
			])
			toast.success(t('form.updateSuccess'))
			onUpdate({ alias, name, level, parentId: nextParentId })
			onClose()
		} catch (err) {
			console.error('Error updating unit:', err)
			toast.error(getErrorMessage(err, t('form.updateFailed')))
		}
	}

	return (
		<div className='rounded-2xl shadow-xl w-full max-w-md p-6 relative'>
			<Button
				type='button'
				onClick={onClose}
				variant='ghost'
				size='icon'
				className='absolute top-3 right-3'
			>
				<X className='h-4 w-4' />
			</Button>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div className='space-y-2'>
					<Label htmlFor='edit-unit-name'>{t('form.name')}</Label>
					<Input
						id='edit-unit-name'
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-alias'>{t('form.alias')}</Label>
					<Input
						id='edit-unit-alias'
						value={alias}
						onChange={(e) => setAlias(e.target.value)}
						required
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-level'>{t('form.level')}</Label>
					{isSuperAdmin ? (
						<Select
							value={level}
							onValueChange={(value) => {
								setLevel(value as UnitLevel)
								setParentId(NO_PARENT)
							}}
						>
							<SelectTrigger id='edit-unit-level'>
								<SelectValue
									placeholder={t('form.levelPlaceholder')}
								/>
							</SelectTrigger>
							<SelectContent>
								{levelOptions.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<>
							<Input
								id='edit-unit-level'
								value={unitLevelLabels[unitData.level]}
								disabled
								readOnly
							/>
							<p className='text-xs text-muted-foreground'>
								{t('form.levelLocked')}
							</p>
						</>
					)}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='edit-unit-parent'>{t('form.parent')}</Label>
					{isSuperAdmin ? (
						<UnitSelect
							id='edit-unit-parent'
							options={parentSelectOptions}
							value={parentId}
							onValueChange={setParentId}
							placeholder={t('form.parentPlaceholder')}
							noneOption={{
								value: NO_PARENT,
								label: t('form.noParent')
							}}
						/>
					) : (
						<>
							<Input
								id='edit-unit-parent'
								value={
									unitData.parent?.name ?? t('form.noParent')
								}
								disabled
								readOnly
							/>
							<p className='text-xs text-muted-foreground'>
								{t('form.parentLocked')}
							</p>
						</>
					)}
				</div>

				{isCompanyOrAboveLevel(level) ? (
					<UnitCommanderFields
						idPrefix='edit-unit'
						values={commanders}
						onChange={(field: CommanderFieldKey, value: string) =>
							setCommanders((prev) => ({
								...prev,
								[field]: value
							}))
						}
					/>
				) : (
					<SingleCommanderField
						idPrefix='edit-unit'
						label={
							level === 'squad'
								? t('commanders.squadCommander')
								: t('commanders.platoonCommander')
						}
						value={commanders.commanderId}
						onChange={(value) =>
							setCommanders((prev) => ({
								...prev,
								commanderId: value
							}))
						}
					/>
				)}

				<div className='flex justify-end gap-2 pt-2'>
					<Button type='button' onClick={onClose} variant='outline'>
						{t('form.cancel')}
					</Button>
					<Button
						type='submit'
						disabled={updateUnitMutation.isPending}
					>
						{updateUnitMutation.isPending
							? t('form.updating')
							: t('form.update')}
					</Button>
				</div>
			</form>
		</div>
	)
}

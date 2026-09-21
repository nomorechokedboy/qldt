import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogHeader,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/ui/dialog'
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
import { useCreateUnit } from '@/hooks/useCreateUnit'
import UnitSelect from '@/components/unit/select'
import useUnitOptions from '@/hooks/useUnitOptions'
import { buildUnitOptions } from '@/lib/unit-options'
import useAuth from '@/hooks/useAuth'
import {
	isCompanyOrAboveLevel,
	isLargerUnitLevel,
	levelOptionsUnderRoot,
	unitLevelOrder
} from '@/data/unit-levels'
import type { UnitLevel } from '@/types'
import UnitCommanderFields, {
	emptyCommanderValues,
	commanderValuesToPayload,
	SingleCommanderField,
	type UnitCommanderValues,
	type CommanderFieldKey
} from '@/components/unit-commander-fields'
import { toastApiError } from '@/lib/api-error'

const NO_PARENT = 'none'

export interface UnitFormProps {
	onSuccess?: () => void
}

export default function UnitForm({ onSuccess }: UnitFormProps) {
	const { t } = useTranslation('units')
	const [open, setOpen] = useState(false)
	const [alias, setAlias] = useState('')
	const [name, setName] = useState('')
	const [level, setLevel] = useState<UnitLevel>('battalion')
	const [parentId, setParentId] = useState<string>(NO_PARENT)
	const [commanders, setCommanders] =
		useState<UnitCommanderValues>(emptyCommanderValues)

	const { units: allUnits, unitsById } = useUnitOptions()
	const createUnitMutation = useCreateUnit()
	const { user } = useAuth()

	const isSuperAdmin = !!user?.isSuperAdmin
	// Nothing can be created above the system's actual root unit - there is
	// no parent left to attach it to (mirrors the backend's root-level check
	// in units/controller.ts#validateHierarchy). This ceiling applies to
	// every user, super admin included.
	const rootUnit = allUnits?.find((u) => !u.parent)
	// Non-super-admins are scoped to their own unit's chain of command -
	// GetUnits already only returns units in that subtree, so filtering
	// against allUnits is enough for the parent picker. The level picker
	// still needs an explicit floor: they can only stand up units below
	// their own unit's level (mirrors the backend check in units/controller.ts).
	const myUnit = allUnits?.find((u) => u.id === user?.unitId)
	const levelOptions = levelOptionsUnderRoot(rootUnit?.level).filter(
		(opt) =>
			isSuperAdmin ||
			!myUnit ||
			unitLevelOrder.indexOf(opt.value) <
				unitLevelOrder.indexOf(myUnit.level)
	)

	const parentOptions = allUnits.filter((u) =>
		isLargerUnitLevel(u.level, level)
	)
	const parentSelectOptions = buildUnitOptions(parentOptions, { unitsById })

	// Keep the selected level valid whenever the allowed set narrows (e.g.
	// once myUnit resolves for a non-super-admin).
	useEffect(() => {
		if (!levelOptions.some((opt) => opt.value === level)) {
			setLevel(levelOptions[0]?.value ?? 'company')
		}
	}, [levelOptions])

	// Non-super-admins can't create root units, so default the parent to
	// their own unit instead of leaving the (hidden) NO_PARENT selected.
	useEffect(() => {
		if (
			!isSuperAdmin &&
			myUnit &&
			!parentOptions.some((u) => String(u.id) === parentId)
		) {
			setParentId(String(myUnit.id))
		}
	}, [isSuperAdmin, myUnit, parentOptions])

	const resetForm = () => {
		setAlias('')
		setName('')
		setLevel(levelOptions[0]?.value ?? 'battalion')
		setParentId(NO_PARENT)
		setCommanders(emptyCommanderValues)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		try {
			await createUnitMutation.mutateAsync({
				alias,
				name,
				level,
				parentId: parentId === NO_PARENT ? null : Number(parentId),
				...commanderValuesToPayload(commanders)
			})
			toast.success(t('form.createSuccess'))
			onSuccess?.()
			resetForm()
			setOpen(false)
		} catch (err) {
			console.error('Error creating unit:', err)
			toastApiError(t('form.createFailed'), err)
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) resetForm()
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<Plus className='w-4 h-4 mr-2' />
					{t('form.addButton')}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-md h-auto'>
				<DialogHeader>
					<DialogTitle>{t('form.addTitle')}</DialogTitle>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div className='space-y-2'>
						<Label htmlFor='unit-name'>{t('form.name')}</Label>
						<Input
							id='unit-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='unit-alias'>{t('form.alias')}</Label>
						<Input
							id='unit-alias'
							value={alias}
							onChange={(e) => setAlias(e.target.value)}
							placeholder={t('form.aliasExample')}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='unit-level'>{t('form.level')}</Label>
						<Select
							value={level}
							onValueChange={(value) => {
								setLevel(value as UnitLevel)
								setParentId(NO_PARENT)
							}}
						>
							<SelectTrigger id='unit-level'>
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
					</div>

					<div className='space-y-2'>
						<Label htmlFor='unit-parent'>{t('form.parent')}</Label>
						<UnitSelect
							id='unit-parent'
							options={parentSelectOptions}
							value={parentId}
							onValueChange={setParentId}
							placeholder={t('form.parentPlaceholder')}
							noneOption={
								isSuperAdmin
									? {
											value: NO_PARENT,
											label: t('form.noParent')
										}
									: undefined
							}
						/>
					</div>

					{isCompanyOrAboveLevel(level) ? (
						<UnitCommanderFields
							idPrefix='unit'
							values={commanders}
							onChange={(
								field: CommanderFieldKey,
								value: string
							) =>
								setCommanders((prev) => ({
									...prev,
									[field]: value
								}))
							}
						/>
					) : (
						<SingleCommanderField
							idPrefix='unit'
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

					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline'>
								{t('form.cancelAlt')}
							</Button>
						</DialogClose>
						<Button
							type='submit'
							disabled={createUnitMutation.isPending}
						>
							{createUnitMutation.isPending
								? t('form.adding')
								: t('form.add')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

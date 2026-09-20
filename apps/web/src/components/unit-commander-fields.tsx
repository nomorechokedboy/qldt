import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import useUserData from '@/hooks/useUsers'

export const NO_COMMANDER = 'none'

export type CommanderFieldKey =
	| 'commanderId'
	| 'deputyCommanderId'
	| 'politicalCommanderId'
	| 'deputyPoliticalCommanderId'

export type UnitCommanderValues = Record<CommanderFieldKey, string>

export const emptyCommanderValues: UnitCommanderValues = {
	commanderId: NO_COMMANDER,
	deputyCommanderId: NO_COMMANDER,
	politicalCommanderId: NO_COMMANDER,
	deputyPoliticalCommanderId: NO_COMMANDER
}

export function commanderValuesFromUnit(unit: {
	commanderId?: number | null
	deputyCommanderId?: number | null
	politicalCommanderId?: number | null
	deputyPoliticalCommanderId?: number | null
}): UnitCommanderValues {
	return {
		commanderId:
			unit.commanderId != null ? String(unit.commanderId) : NO_COMMANDER,
		deputyCommanderId:
			unit.deputyCommanderId != null
				? String(unit.deputyCommanderId)
				: NO_COMMANDER,
		politicalCommanderId:
			unit.politicalCommanderId != null
				? String(unit.politicalCommanderId)
				: NO_COMMANDER,
		deputyPoliticalCommanderId:
			unit.deputyPoliticalCommanderId != null
				? String(unit.deputyPoliticalCommanderId)
				: NO_COMMANDER
	}
}

export function commanderValuesToPayload(values: UnitCommanderValues) {
	return {
		commanderId:
			values.commanderId === NO_COMMANDER
				? null
				: Number(values.commanderId),
		deputyCommanderId:
			values.deputyCommanderId === NO_COMMANDER
				? null
				: Number(values.deputyCommanderId),
		politicalCommanderId:
			values.politicalCommanderId === NO_COMMANDER
				? null
				: Number(values.politicalCommanderId),
		deputyPoliticalCommanderId:
			values.deputyPoliticalCommanderId === NO_COMMANDER
				? null
				: Number(values.deputyPoliticalCommanderId)
	}
}

const FIELDS = [
	{ key: 'commanderId', label: 'commanders.commander' },
	{ key: 'deputyCommanderId', label: 'commanders.deputyCommander' },
	{ key: 'politicalCommanderId', label: 'commanders.politicalCommander' },
	{
		key: 'deputyPoliticalCommanderId',
		label: 'commanders.deputyPoliticalCommander'
	}
] as const satisfies { key: CommanderFieldKey; label: string }[]

interface UnitCommanderFieldsProps {
	idPrefix: string
	values: UnitCommanderValues
	onChange: (field: CommanderFieldKey, value: string) => void
}

export default function UnitCommanderFields({
	idPrefix,
	values,
	onChange
}: UnitCommanderFieldsProps) {
	const { t } = useTranslation('units')
	const { data: users } = useUserData()

	return (
		<>
			{FIELDS.map(({ key, label: labelKey }) => {
				const label = t(labelKey)
				return (
					<div className='space-y-2' key={key}>
						<Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
						<Select
							value={values[key]}
							onValueChange={(value) => onChange(key, value)}
						>
							<SelectTrigger id={`${idPrefix}-${key}`}>
								<SelectValue
									placeholder={t('commanders.choose', {
										label: label.toLowerCase()
									})}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_COMMANDER}>
									{t('commanders.unassigned')}
								</SelectItem>
								{users?.map((u) => (
									<SelectItem key={u.id} value={String(u.id)}>
										{u.displayName}
										{u.rank ? ` (${u.rank})` : ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)
			})}
		</>
	)
}

interface SingleCommanderFieldProps {
	idPrefix: string
	label: string
	value: string
	onChange: (value: string) => void
}

// A standalone "commander" picker for unit levels (platoon, squad) that only
// track a single leadership role, rather than the full company+ chain of
// command covered by UnitCommanderFields.
export function SingleCommanderField({
	idPrefix,
	label,
	value,
	onChange
}: SingleCommanderFieldProps) {
	const { t } = useTranslation('units')
	const { data: users } = useUserData()

	return (
		<div className='space-y-2'>
			<Label htmlFor={`${idPrefix}-commanderId`}>{label}</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger id={`${idPrefix}-commanderId`}>
					<SelectValue
						placeholder={t('commanders.choose', {
							label: label.toLowerCase()
						})}
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={NO_COMMANDER}>
						{t('commanders.unassigned')}
					</SelectItem>
					{users?.map((u) => (
						<SelectItem key={u.id} value={String(u.id)}>
							{u.displayName}
							{u.rank ? ` (${u.rank})` : ''}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

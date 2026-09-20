import { useTranslation } from 'react-i18next'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { GroupedSelectItems } from '@/components/ui/grouped-select-items'
import { cn } from '@/lib/utils'
import type { UnitOption } from '@/lib/unit-options'

export interface UnitSelectProps {
	options: UnitOption[]
	value?: string
	onValueChange: (value: string) => void
	placeholder?: string
	id?: string
	className?: string
	disabled?: boolean
	// An extra entry pinned above the units, e.g. "no parent".
	noneOption?: { value: string; label: string }
}

// The one unit picker: units grouped under their level, labelled with
// their ancestry, valued by id.
export default function UnitSelect({
	options,
	value,
	onValueChange,
	placeholder,
	id,
	className,
	disabled,
	noneOption
}: UnitSelectProps) {
	const { t } = useTranslation('units')
	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger id={id} className={cn('w-full', className)}>
				<SelectValue
					placeholder={placeholder ?? t('select.placeholder')}
				/>
			</SelectTrigger>
			<SelectContent>
				{noneOption && (
					<>
						<SelectItem value={noneOption.value}>
							{noneOption.label}
						</SelectItem>
						{options.length > 0 && <SelectSeparator />}
					</>
				)}
				<GroupedSelectItems options={options} />
			</SelectContent>
		</Select>
	)
}

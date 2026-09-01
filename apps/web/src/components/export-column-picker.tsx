import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export interface ExportColumnOption {
	key: string
	label: string
}

export interface ExportColumnPickerProps {
	options: ExportColumnOption[]
	selected: string[]
	onChange: (keys: string[]) => void
}

export function ExportColumnPicker({
	options,
	selected,
	onChange
}: ExportColumnPickerProps) {
	function toggle(key: string, checked: boolean) {
		if (checked) {
			onChange([...selected, key])
		} else {
			onChange(selected.filter((k) => k !== key))
		}
	}

	return (
		<div className='grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-3'>
			{options.map((option) => (
				<Label
					key={option.key}
					htmlFor={`export-column-${option.key}`}
					className='flex items-center gap-2 font-normal'
				>
					<Checkbox
						id={`export-column-${option.key}`}
						checked={selected.includes(option.key)}
						onCheckedChange={(value) => toggle(option.key, !!value)}
					/>
					{option.label}
				</Label>
			))}
		</div>
	)
}

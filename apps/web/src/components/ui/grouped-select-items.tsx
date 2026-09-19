import { Fragment } from 'react'
import {
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator
} from '@/components/ui/select'

export interface GroupedSelectOption {
	label: string
	value: string
	group?: string
}

// True group-by (not consecutive-clustering): merges every item sharing
// the same group key into one bucket regardless of where it falls in the
// array, so two same-named groups that aren't adjacent never produce two
// buckets with the same React key.
function groupByField(options: GroupedSelectOption[]) {
	const groups: { key: string | undefined; items: GroupedSelectOption[] }[] =
		[]
	const bucketByKey = new Map<string | undefined, number>()
	for (const option of options) {
		const bucketIdx = bucketByKey.get(option.group)
		if (bucketIdx !== undefined) {
			groups[bucketIdx].items.push(option)
		} else {
			bucketByKey.set(option.group, groups.length)
			groups.push({ key: option.group, items: [option] })
		}
	}
	return groups
}

// Items without a `group` share one bucket headed by `ungroupedLabel`.
export function GroupedSelectItems({
	options,
	ungroupedLabel
}: {
	options: GroupedSelectOption[]
	ungroupedLabel?: string
}) {
	const groups = groupByField(options)

	return groups.map((group, idx) => (
		<Fragment key={group.key ?? '__ungrouped__'}>
			<SelectGroup>
				{(group.key ?? ungroupedLabel) !== undefined && (
					<SelectLabel>{group.key ?? ungroupedLabel}</SelectLabel>
				)}
				{group.items.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectGroup>
			{idx !== groups.length - 1 && <SelectSeparator />}
		</Fragment>
	))
}

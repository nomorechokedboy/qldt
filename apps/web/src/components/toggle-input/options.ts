import type { Option } from './types'

// True group-by (not consecutive-clustering): merges every option sharing
// the same group name into one bucket regardless of where it falls in the
// array, so two same-named groups that aren't adjacent (e.g. the same
// fallback/explicit label used by two different `level`s) never produce
// two separate buckets with the same key - which would be a duplicate
// React key on the rendered SelectGroup/CommandGroup below.
export function groupOptions(options: Option[]) {
	const groups: { group: string | undefined; options: Option[] }[] = []
	const bucketByGroup = new Map<string | undefined, number>()
	for (const option of options) {
		const bucketIdx = bucketByGroup.get(option.group)
		if (bucketIdx !== undefined) {
			groups[bucketIdx].options.push(option)
		} else {
			bucketByGroup.set(option.group, groups.length)
			groups.push({ group: option.group, options: [option] })
		}
	}
	return groups
}

// The label to show for a stored value; an unknown value shows as itself.
export function optionLabel(options: Option[], value: string) {
	return options.find((option) => option.value === value)?.label || value
}

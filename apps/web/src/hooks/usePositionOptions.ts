import { useMemo } from 'react'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import usePositionsData from '@/hooks/usePositionsData'

// Positions as select options (value is the id as a string), grouped and
// ordered from the largest unit level down.
export default function usePositionOptions() {
	const { data: positions } = usePositionsData()

	return useMemo(
		() =>
			[...(positions ?? [])]
				.sort((a, b) => {
					const levelDiff =
						unitLevelOrder.indexOf(a.level as never) -
						unitLevelOrder.indexOf(b.level as never)
					if (levelDiff !== 0) return levelDiff

					const groupDiff = (a.group ?? '').localeCompare(
						b.group ?? ''
					)
					if (groupDiff !== 0) return groupDiff

					return a.priority - b.priority
				})
				.map((p) => ({
					label: p.name,
					value: String(p.id),
					group:
						p.group ?? unitLevelLabels[p.level as never] ?? p.level
				})),
		[positions]
	)
}

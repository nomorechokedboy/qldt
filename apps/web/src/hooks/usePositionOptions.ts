import { useMemo } from 'react'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import usePositionsData from '@/hooks/usePositionsData'

// Positions as select options (value is the id as a string), grouped by the
// level of unit they belong to, smallest level first, then by priority.
// `position.group` (the HSQ / CS-BS classification) is deliberately not the
// grouping: it repeats across levels, which would merge unrelated positions
// under one heading. Every position picker uses this list so they all group
// the same way.
export default function usePositionOptions(options?: { enabled?: boolean }) {
	const { data: positions } = usePositionsData(undefined, options)

	return useMemo(
		() =>
			[...(positions ?? [])]
				.sort((a, b) => {
					const levelDiff =
						unitLevelOrder.indexOf(a.level as never) -
						unitLevelOrder.indexOf(b.level as never)
					if (levelDiff !== 0) return levelDiff

					return a.priority - b.priority
				})
				.map((p) => ({
					label: p.name,
					value: String(p.id),
					group: unitLevelLabels[p.level as never] ?? p.level
				})),
		[positions]
	)
}

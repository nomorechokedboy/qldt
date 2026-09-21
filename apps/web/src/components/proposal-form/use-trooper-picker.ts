import { useMemo, useState } from 'react'
import type { Student } from '@/types'
import normalizeForSearch from './normalize-for-search'

interface Selection<TOverride> {
	ids: Set<number>
	// Per-trooper values that replace the proposal-level ones (a missing entry
	// falls back to them). Only ever held for selected troopers.
	overrides: Map<number, TOverride>
}

const emptySelection = <TOverride>(): Selection<TOverride> => ({
	ids: new Set(),
	overrides: new Map()
})

// Which troopers a proposal covers, and any per-trooper overrides, among the
// `candidates` the form offers. Selection state is replaced, never mutated in
// place, so a re-render always sees a new reference and rapid successive
// toggles each build on the previous one.
export default function useTrooperPicker<TOverride extends object>(
	candidates: Student[]
) {
	const [selection, setSelection] =
		useState<Selection<TOverride>>(emptySelection)
	const [search, setSearch] = useState('')
	const [onlySelected, setOnlySelected] = useState(false)

	// The name search and the "only selected" toggle narrow what's rendered,
	// not what's selectable - a trooper picked before a search (or under a
	// different query) stays selected even while filtered out of view.
	const visible = useMemo(() => {
		const query = normalizeForSearch(search.trim())
		return candidates.filter(
			(s) =>
				(!onlySelected || selection.ids.has(s.id)) &&
				(!query || normalizeForSearch(s.fullName ?? '').includes(query))
		)
	}, [candidates, search, onlySelected, selection.ids])

	const update = (
		change: (ids: Set<number>, overrides: Map<number, TOverride>) => void
	) =>
		setSelection((prev) => {
			const next = {
				ids: new Set(prev.ids),
				overrides: new Map(prev.overrides)
			}
			change(next.ids, next.overrides)
			return next
		})

	// A count comparison alone would misreport "all selected" if the selection
	// ever diverges from the current roster (e.g. the roster changes while the
	// sheet is open) but still happens to match its size - checking actual
	// membership avoids that.
	const allVisibleSelected =
		visible.length > 0 && visible.every((s) => selection.ids.has(s.id))
	const someVisibleSelected = visible.some((s) => selection.ids.has(s.id))

	return {
		selectedIds: selection.ids,
		overrides: selection.overrides as ReadonlyMap<number, TOverride>,
		search,
		setSearch,
		onlySelected,
		setOnlySelected,
		visible,
		allVisibleSelected,
		someVisibleSelected,

		toggle: (id: number) =>
			update((ids, overrides) => {
				if (ids.has(id)) {
					ids.delete(id)
					overrides.delete(id)
				} else {
					ids.add(id)
				}
			}),

		// Scoped to `visible` (not every candidate) so "select all" under an
		// active search only affects the troopers actually shown - matching
		// filtered multi-select elsewhere (e.g. Gmail), and avoiding a search
		// wiping out selections made under a different query.
		toggleAllVisible: (value: boolean) =>
			update((ids, overrides) => {
				for (const s of visible) {
					if (value) {
						ids.add(s.id)
					} else {
						ids.delete(s.id)
						overrides.delete(s.id)
					}
				}
			}),

		setOverride: (id: number, patch: TOverride) =>
			update((_, overrides) => {
				overrides.set(id, { ...overrides.get(id), ...patch })
			}),

		// Opens (or discards) a trooper's own values.
		setCustomized: (id: number, customized: boolean) =>
			update((_, overrides) => {
				if (customized)
					overrides.set(id, overrides.get(id) ?? ({} as TOverride))
				else overrides.delete(id)
			}),

		clearOverrides: () =>
			setSelection((prev) => ({ ...prev, overrides: new Map() })),

		// Drops every trooper (and their overrides) not in `allowed`, for when a
		// header choice narrows who is eligible - otherwise a hidden trooper
		// could stay checked and get submitted anyway.
		retainOnly: (allowed: ReadonlySet<number>) =>
			update((ids, overrides) => {
				for (const id of [...ids]) if (!allowed.has(id)) ids.delete(id)
				for (const id of [...overrides.keys()])
					if (!allowed.has(id)) overrides.delete(id)
			}),

		reset: () => {
			setSelection(emptySelection())
			setSearch('')
			setOnlySelected(false)
		}
	}
}

export type TrooperPicker<TOverride extends object> = ReturnType<
	typeof useTrooperPicker<TOverride>
>

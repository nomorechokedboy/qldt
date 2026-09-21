import { useNavigate } from '@tanstack/react-router'
import useAuth from '@/hooks/useAuth'
import {
	currentPeriod,
	formatPeriod,
	parsePeriod,
	type StatsPeriod
} from '@/lib/stats-period'
import { Route } from '@/routes/thong-ke-doanh-trai'
import type { Unit } from '@/types'

// Which unit and period the dashboard shows. Both live in the URL so a link
// carries the view; without them the user's own unit (or the root unit) and
// the current month are shown.
export default function useStatsSelection(
	units: Pick<Unit, 'id' | 'parent'>[]
) {
	const navigate = useNavigate({ from: Route.fullPath })
	const { unit: unitParam, period: periodParam } = Route.useSearch()
	const { user } = useAuth()

	const rootUnit = units.find((u) => !u.parent)
	const selectedUnitId = unitParam ?? user?.unit?.id ?? rootUnit?.id
	const period = parsePeriod(periodParam) ?? currentPeriod('month')

	const selectUnit = (id: string) => {
		navigate({ search: (prev) => ({ ...prev, unit: Number(id) }) })
	}

	// replace: every pick is written to the URL so the view can be shared, but
	// stepping through months shouldn't leave a history entry per click.
	const selectPeriod = (next: StatsPeriod) => {
		navigate({
			search: (prev) => ({ ...prev, period: formatPeriod(next) }),
			replace: true
		})
	}

	return { selectedUnitId, period, selectUnit, selectPeriod }
}

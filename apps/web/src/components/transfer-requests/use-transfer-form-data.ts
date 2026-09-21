import { useMemo } from 'react'
import {
	collectUnitScope,
	studentsInScope
} from '@/components/proposal-form/use-unit-troopers'
import useMaterialAssetsData from '@/hooks/useMaterialAssetsData'
import useMaterialStocksData from '@/hooks/useMaterialStocksData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useStudentData from '@/hooks/useStudents'
import useTransferDestinationUnits from '@/hooks/useTransferDestinationUnits'
import useTransferEligibleApprovers from '@/hooks/useTransferEligibleApprovers'
import useUnitOptions from '@/hooks/useUnitOptions'
import { buildUnitOptions } from '@/lib/unit-options'

// Everything the transfer form reads: the unit and approver choices, and what
// the source unit has that can be moved. Nothing is fetched until the sheet is
// open, and the source's resources only once a source is chosen.
export default function useTransferFormData({
	open,
	sourceUnitId,
	destinationUnitId
}: {
	open: boolean
	sourceUnitId: string
	destinationUnitId: string
}) {
	// The source unit must be Company level or larger (matches the backend
	// constraint), scoped to the units the current user can access.
	const {
		units,
		unitsById,
		options: sourceUnitOptions
	} = useUnitOptions({ enabled: open, minLevel: 'company' })
	const { data: rooms } = useRoomsData(undefined, { enabled: open })
	const { data: materialTypes } = useMaterialTypesData({ enabled: open })
	const { data: students } = useStudentData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: materialAssets } = useMaterialAssetsData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: materialStocks } = useMaterialStocksData(undefined, {
		enabled: open && !!sourceUnitId
	})
	const { data: destinationUnits } = useTransferDestinationUnits({
		enabled: open
	})
	const { data: eligibleApprovers } = useTransferEligibleApprovers(
		sourceUnitId && destinationUnitId
			? {
					sourceUnitId: Number(sourceUnitId),
					destinationUnitId: Number(destinationUnitId)
				}
			: null,
		{ enabled: open }
	)

	// A transfer request may move troopers/materials belonging to the
	// selected source unit or any of its subordinate (descendant) units, not
	// only items registered directly on the unit itself (matches the
	// backend's unitAndDescendantIds scope).
	const sourceScopeUnitIds = useMemo(
		() =>
			sourceUnitId && units
				? collectUnitScope(units, Number(sourceUnitId))
				: new Set<number>(),
		[units, sourceUnitId]
	)

	const sourceUnitStudents = useMemo(
		() => studentsInScope(students, sourceScopeUnitIds),
		[students, sourceScopeUnitIds]
	)

	const sourceUnitAssets = useMemo(
		() =>
			(materialAssets ?? []).filter((a) =>
				sourceScopeUnitIds.has(a.unitId)
			),
		[materialAssets, sourceScopeUnitIds]
	)

	const sourceUnitStocks = useMemo(
		() =>
			(materialStocks ?? []).filter((s) =>
				sourceScopeUnitIds.has(s.unitId)
			),
		[materialStocks, sourceScopeUnitIds]
	)

	const destinationRooms = useMemo(
		() =>
			destinationUnitId
				? (rooms ?? []).filter(
						(r) => r.unitId === Number(destinationUnitId)
					)
				: [],
		[rooms, destinationUnitId]
	)

	// Destination unit is not restricted to the requester's own command
	// chain, so it's sourced from the dedicated org-wide endpoint rather
	// than the scoped `units` list above. Units outside the caller's scope
	// have no known ancestry, so they are labelled by name alone.
	const destinationUnitOptions = useMemo(
		() =>
			buildUnitOptions(
				(destinationUnits ?? []).filter(
					(u) => String(u.id) !== sourceUnitId
				),
				{ unitsById }
			),
		[destinationUnits, sourceUnitId, unitsById]
	)

	const materialTypeName = (id: number) =>
		materialTypes?.find((type) => type.id === id)?.name ?? `#${id}`

	return {
		sourceUnitOptions,
		destinationUnitOptions,
		destinationRooms,
		eligibleApprovers: eligibleApprovers ?? [],
		sourceUnitStudents,
		sourceUnitAssets,
		sourceUnitStocks,
		materialTypeName
	}
}

export type TransferFormData = ReturnType<typeof useTransferFormData>

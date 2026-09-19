import { AppError } from '../errors'
import roomRepo from '../facilities/rooms-repo'
import studentRepo from '../students/repo'

export interface UnitScopedRefs {
	unitId: number
	roomId?: number | null
	assignedTrooperId?: number | null
}

// A material row belongs to exactly one unit: that unit must be one the
// caller may act on, and the room it sits in and the trooper it is assigned
// to must belong to that same unit. Otherwise a bulk import could plant data
// in somebody else's unit.
export async function assertRefsInUnitScope(
	rows: UnitScopedRefs[],
	validUnitIds: number[]
): Promise<void> {
	const allowed = new Set(validUnitIds)

	if (rows.some((r) => !allowed.has(r.unitId))) {
		throw AppError.handleAppErr(
			AppError.unauthorized('You are not authorized to use this unitId')
		)
	}

	const roomIds = uniqueIds(rows.map((r) => r.roomId))
	if (roomIds.length > 0) {
		const rooms = await roomRepo
			.findByIds(roomIds)
			.catch(AppError.handleAppErr)
		const roomUnitById = new Map(rooms.map((r) => [r.id, r.unitId]))
		for (const row of rows) {
			if (row.roomId === undefined || row.roomId === null) continue

			const roomUnitId = roomUnitById.get(row.roomId)
			if (roomUnitId === undefined) {
				throw AppError.handleAppErr(
					AppError.invalidArgument('Room does not exist')
				)
			}
			if (roomUnitId !== row.unitId) {
				throw AppError.handleAppErr(
					AppError.unauthorized(
						"The room does not belong to the row's unit"
					)
				)
			}
		}
	}

	const trooperIds = uniqueIds(rows.map((r) => r.assignedTrooperId))
	if (trooperIds.length > 0) {
		const troopers = await studentRepo
			.find({ ids: trooperIds })
			.catch(AppError.handleAppErr)
		const trooperUnitById = new Map(troopers.map((s) => [s.id, s.unit?.id]))
		for (const row of rows) {
			if (
				row.assignedTrooperId === undefined ||
				row.assignedTrooperId === null
			) {
				continue
			}

			if (!trooperUnitById.has(row.assignedTrooperId)) {
				throw AppError.handleAppErr(
					AppError.invalidArgument('Assigned trooper does not exist')
				)
			}
			if (trooperUnitById.get(row.assignedTrooperId) !== row.unitId) {
				throw AppError.handleAppErr(
					AppError.unauthorized(
						"The trooper does not belong to the row's unit"
					)
				)
			}
		}
	}
}

const REF_FIELDS = ['unitId', 'roomId', 'assignedTrooperId'] as const

// The rows an update would leave behind, for the ones that touch the unit,
// room or trooper. Fields the payload leaves out keep their stored value, so
// moving a row to another unit while it keeps its old room is caught too.
export function refsAfterUpdate(
	updates: { id: number; updatePayload: Record<string, unknown> }[],
	existing: (UnitScopedRefs & { id: number })[]
): UnitScopedRefs[] {
	const existingById = new Map(existing.map((e) => [e.id, e]))

	return updates.flatMap(({ id, updatePayload }) => {
		const current = existingById.get(id)
		if (
			current === undefined ||
			!REF_FIELDS.some((f) => f in updatePayload)
		) {
			return []
		}

		return [
			{
				unitId: (updatePayload.unitId as number) ?? current.unitId,
				roomId:
					'roomId' in updatePayload
						? (updatePayload.roomId as number | null)
						: current.roomId,
				assignedTrooperId:
					'assignedTrooperId' in updatePayload
						? (updatePayload.assignedTrooperId as number | null)
						: current.assignedTrooperId
			}
		]
	})
}

function uniqueIds(ids: Array<number | null | undefined>): number[] {
	return [
		...new Set(
			ids.filter((id): id is number => id !== undefined && id !== null)
		)
	]
}

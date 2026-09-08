import { readFile } from 'fs/promises'
import path from 'path'
import dayjs from 'dayjs'
import { createReport } from 'docx-templates'
import { AppError } from '../errors'
import commanderDigestRepo from './repo'
import { buildDigestNarrative } from './narrative'
import unitRepo from '../units/repo'

const TEMPLATE_FILE = 'commander-digest-templ.docx'

// Merge fields available in the .docx template as {fieldName}:
//   unitName, weekOf, totalStudents, buildingsCount, roomsCount,
//   pendingApprovalsCount, damagedAssetsCount, needMaintenanceAssetsCount,
//   birthdaysThisWeekCount, recentChangesCount, narrative
export async function buildCommanderDigestExport(
	id: number,
	recipientId: number
): Promise<Uint8Array> {
	const unit = await unitRepo.getOne({ id })
	if (unit === undefined) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(`Unit not found: ${id}`)
		)
	}

	const snapshot = await commanderDigestRepo.gatherUnitSnapshot(unit)
	const pendingApprovals =
		await commanderDigestRepo.gatherPendingApprovals(recipientId)
	const { message } = await buildDigestNarrative(snapshot, pendingApprovals)

	const templateData = {
		unitName: snapshot.unit.name,
		weekOf: dayjs().format('DD/MM/YYYY'),
		totalStudents: snapshot.totalStudents,
		buildingsCount: snapshot.buildingsCount,
		roomsCount: snapshot.roomsCount,
		pendingApprovalsCount: pendingApprovals.length,
		damagedAssetsCount: snapshot.damagedAssets.length,
		needMaintenanceAssetsCount: snapshot.needMaintenanceAssets.length,
		birthdaysThisWeekCount: snapshot.thisWeekBirthdayStudents.length,
		recentChangesCount: snapshot.recentChanges.length,
		narrative: message
	}

	const template = await readFile(path.join('./templates', TEMPLATE_FILE))
	return createReport({
		template,
		data: templateData,
		cmdDelimiter: ['{', '}']
	})
}

import { readFile } from 'fs/promises'
import path from 'path'
import dayjs from 'dayjs'
import { createReport } from 'docx-templates'
import { AppError } from '../errors'
import { TransferRequest } from '../schema/transfer-requests'
import transferRequestRepo from './repo'

const TEMPLATE_FILE = 'transfer-handover-templ.docx'

// TransferRequest.sourceUnit/destinationUnit are typed as the shared `Unit`
// (schema/units.ts), which doesn't model the `commander` relation - it's an
// extra `with` clause added to this feature's own WITH_DETAILS (see repo.ts)
// specifically for this export, so it's typed locally instead of widening
// the shared Unit type for every other consumer.
type UnitWithCommander = NonNullable<TransferRequest['destinationUnit']> & {
	commander?: {
		displayName: string
		rank?: string | null
		position?: string | null
	} | null
}

const CONDITION_LABELS: Record<string, string> = {
	good: '',
	fair: 'Tình trạng: khá',
	needs_maintenance: 'Cần bảo dưỡng',
	damaged: 'Hư hỏng'
}

interface HandoverItem {
	stt: number
	name: string
	quantity: string
	serials: string
	note: string
}

interface HandoverPerson {
	name: string
	rank: string
	position: string
}

function unitFullName(
	unit: { name: string; parent?: { name: string } | null } | undefined
): string {
	if (unit === undefined) return ''
	return unit.parent ? `${unit.name}/${unit.parent.name}` : unit.name
}

function personFromUser(
	user:
		| {
				displayName: string
				rank?: string | null
				position?: string | null
		  }
		| null
		| undefined
): HandoverPerson {
	return {
		name: user?.displayName ?? '',
		rank: user?.rank ?? '',
		position: user?.position ?? ''
	}
}

// Assets are individually tracked by serial number - group them by material
// type so e.g. 20 separately-tracked AK rifles collapse into one "Súng AK"
// row listing all 20 serials, matching how the paper handover report
// records a weapon handover. Stocks have no individual identity, so they're
// grouped by material type + condition with a summed quantity instead.
// Only itemStatus 'approved' items are included - a mixed request can have
// partially-failed items (e.g. one asset already reassigned elsewhere) that
// were never actually handed over.
function buildItems(tr: TransferRequest): HandoverItem[] {
	const items: HandoverItem[] = []

	const assetGroups = new Map<number, { name: string; serials: string[] }>()
	for (const item of tr.materialAssetItems ?? []) {
		if (item.itemStatus !== 'approved') continue
		const asset = item.materialAsset
		if (asset === undefined) continue

		const typeId = asset.materialType?.id ?? 0
		const group = assetGroups.get(typeId) ?? {
			name: asset.materialType?.name ?? `#${typeId}`,
			serials: []
		}
		group.serials.push(asset.serialNumber)
		assetGroups.set(typeId, group)
	}
	for (const group of assetGroups.values()) {
		items.push({
			stt: items.length + 1,
			name: group.name,
			quantity: `${group.serials.length} khẩu`,
			serials: group.serials.join(', '),
			note: ''
		})
	}

	const stockGroups = new Map<
		string,
		{ name: string; condition: string; quantity: number; unit: string }
	>()
	for (const item of tr.materialStockItems ?? []) {
		if (item.itemStatus !== 'approved') continue

		const key = `${item.materialType?.id ?? 'na'}:${item.condition}`
		const group = stockGroups.get(key) ?? {
			name: item.materialType?.name ?? 'Vật tư',
			condition: item.condition,
			quantity: 0,
			unit: item.materialType?.unitOfMeasure ?? ''
		}
		group.quantity += item.quantity
		stockGroups.set(key, group)
	}
	for (const group of stockGroups.values()) {
		items.push({
			stt: items.length + 1,
			name: group.name,
			quantity: `${group.quantity}${group.unit ? ` ${group.unit}` : ''}`,
			serials: '',
			note: CONDITION_LABELS[group.condition] ?? group.condition
		})
	}

	return items
}

function itemsSummary(items: HandoverItem[]): string {
	return items.map((i) => `${i.quantity} ${i.name}`).join(', ')
}

export async function buildHandoverReport(
	id: number,
	city: string
): Promise<Uint8Array> {
	const tr = await transferRequestRepo.getOne(id)
	if (tr === undefined) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(`Transfer request not found: ${id}`)
		)
	}

	if (tr.status !== 'approved') {
		throw AppError.handleAppErr(
			AppError.invalidArgument(
				'A handover report can only be exported for an approved transfer request'
			)
		)
	}

	const items = buildItems(tr)
	if (items.length === 0) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(
				'This transfer request has no approved material items to hand over'
			)
		)
	}

	const decidedAt = dayjs(tr.decidedAt ?? tr.updatedAt)
	const giao = personFromUser(tr.requestedBy)
	const nhan = personFromUser(
		(tr.destinationUnit as UnitWithCommander | undefined)?.commander
	)

	const sourceUnitName = tr.sourceUnit?.name ?? ''
	const destinationUnitName = tr.destinationUnit?.name ?? ''
	const parentUnitName = tr.sourceUnit?.parent?.name ?? sourceUnitName

	const templateData = {
		parentUnitName,
		sourceUnitName,
		destinationUnitName,
		sourceUnitFullName: unitFullName(tr.sourceUnit),
		destinationUnitFullName: unitFullName(tr.destinationUnit),
		itemsSummary: itemsSummary(items),
		city,
		day: decidedAt.format('DD'),
		month: decidedAt.format('MM'),
		year: decidedAt.format('YYYY'),
		hour: decidedAt.format('HH'),
		minute: decidedAt.format('mm'),
		location: `Phòng giao ban ${sourceUnitName}/${parentUnitName}`,
		giaoName: giao.name,
		giaoRank: giao.rank,
		giaoPosition: giao.position,
		nhanName: nhan.name,
		nhanRank: nhan.rank,
		nhanPosition: nhan.position,
		items
	}

	const template = await readFile(path.join('./templates', TEMPLATE_FILE))

	return createReport({
		template,
		data: templateData,
		cmdDelimiter: ['{', '}']
	})
}

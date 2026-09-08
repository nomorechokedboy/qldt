import log from 'encore.dev/log'
import { UnitDigestSnapshot } from './repo'
import { TransferRequest } from '../schema/transfer-requests'
import { appConfig } from '../configs'

interface DigestNarrative {
	title: string
	message: string
}

const SYSTEM_PROMPT = `You are drafting a short weekly summary for a unit commander.
You will be given ONLY pre-computed numbers - never invent, estimate, or infer any fact or number not explicitly present in the data.
If a count is 0, say so plainly instead of omitting it.
Write 2-4 sentences, plain language, no markdown, no headers.`

function fallbackMessage(
	snapshot: UnitDigestSnapshot,
	pendingApprovals: TransferRequest[]
): string {
	const parts = [
		`${snapshot.totalStudents} troopers, ${snapshot.buildingsCount} buildings, ${snapshot.roomsCount} rooms.`
	]
	if (pendingApprovals.length > 0) {
		parts.push(
			`${pendingApprovals.length} transfer request(s) awaiting your approval.`
		)
	}
	const issues =
		snapshot.damagedAssets.length + snapshot.needMaintenanceAssets.length
	if (issues > 0) {
		parts.push(
			`${snapshot.damagedAssets.length} damaged and ${snapshot.needMaintenanceAssets.length} needing maintenance.`
		)
	}
	if (snapshot.thisWeekBirthdayStudents.length > 0) {
		parts.push(
			`${snapshot.thisWeekBirthdayStudents.length} birthday(s) this week.`
		)
	}
	if (snapshot.recentChanges.length > 0) {
		parts.push(
			`${snapshot.recentChanges.length} change(s) recorded in the last 7 days.`
		)
	}
	return parts.join(' ')
}

// Only the fields the model is allowed to talk about - deliberately not the
// full snapshot, so it can't reach for a field we didn't intend to surface.
function buildDataPayload(
	snapshot: UnitDigestSnapshot,
	pendingApprovals: TransferRequest[]
) {
	return {
		unitName: snapshot.unit.name,
		totalStudents: snapshot.totalStudents,
		buildingsCount: snapshot.buildingsCount,
		roomsCount: snapshot.roomsCount,
		pendingApprovalsCount: pendingApprovals.length,
		damagedAssetsCount: snapshot.damagedAssets.length,
		needMaintenanceAssetsCount: snapshot.needMaintenanceAssets.length,
		birthdaysThisWeekCount: snapshot.thisWeekBirthdayStudents.length,
		recentChangesCount: snapshot.recentChanges.length
	}
}

export async function buildDigestNarrative(
	snapshot: UnitDigestSnapshot,
	pendingApprovals: TransferRequest[]
): Promise<DigestNarrative> {
	const title = `Weekly digest — ${snapshot.unit.name}`
	const fallback = fallbackMessage(snapshot, pendingApprovals)
	const LLMUrl = appConfig.LLM_URL
	const LLMModel = appConfig.LLM_MODEL

	if (!LLMUrl) {
		log.warn(
			'CommanderDigest narrative: LLM Url not configured, using fallback'
		)
		return { title, message: fallback }
	}

	try {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 30000)

		log.info('buildDigestNarrative.Starting request to LLM server')
		const res = await fetch(`${LLMUrl}/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: LLMModel,
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{
						role: 'user',
						content: JSON.stringify(
							buildDataPayload(snapshot, pendingApprovals)
						)
					}
				],
				temperature: 0.2,
				max_tokens: 200
			}),
			signal: controller.signal
		}).finally(() => clearTimeout(timeout))

		if (!res.ok) throw new Error(`LLM response returned ${res.status}`)

		const data = await res.json()
		const text: string | undefined = data?.choices?.[0]?.message?.content
		if (!text?.trim()) throw new Error('Empty completion')

		return { title, message: text.trim() }
	} catch (err) {
		log.error(
			'CommanderDigest narrative generation failed, using fallback',
			{ err }
		)
		return { title, message: fallback }
	}
}

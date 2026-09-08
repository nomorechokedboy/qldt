import { api, APIError } from 'encore.dev/api'
import { APICallMeta, currentRequest } from 'encore.dev'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import commanderDigestController from './controller'
import { buildCommanderDigestExport } from './export'
import unitRepo from '../units/repo'
import { AppError } from '../errors'

// Triggered externally (k8s CronJob hitting this over the internal
// network), same convention as GET /students/cron - no `auth: true`.
// Not gated by a shared secret; see note in configs/index.ts if you want
// to add one later, same as suggested for /students/cron.
export const CommanderDigestCron = api(
	{ expose: false, method: 'GET', path: '/commander-digest/cron' },
	async (): Promise<{ ok: true }> => {
		log.info('CommanderDigestCron triggered')
		await commanderDigestController.runWeeklyDigest()
		log.info('CommanderDigestCron complete')
		return { ok: true }
	}
)

// On-demand archival copy for the "download this week's digest" button.
// recipientId is always the CALLER's own id - never taken from the
// request - so one commander can't pull another's pending-approval count
// by hitting a different alias.
export const ExportCommanderDigest = api.raw(
	{
		auth: true,
		expose: false,
		method: 'GET',
		path: '/commander-digest/:alias/export'
	},
	async (req, resp) => {
		try {
			// api.raw doesn't parse path params for you - pull alias out
			// of the URL, same as any other raw handler in this codebase.
			const url = new URL(req.url ?? '', 'http://internal')
			const parts = url.pathname.split('/').filter(Boolean)
			const rawId = decodeURIComponent(parts[1] ?? '')
			const id = parseInt(rawId)
			if (!id) {
				throw APIError.invalidArgument('unit alias is required')
			}

			const callMeta = currentRequest() as APICallMeta
			const validUnitIds = callMeta.middlewareData?.validUnitIds || []
			const recipientId = Number(getAuthData()!.userID)

			const unit = await unitRepo.getOne({ id })
			if (unit === undefined) {
				throw APIError.invalidArgument(`Unit not found: ${id}`)
			}
			if (!validUnitIds.includes(unit.id)) {
				throw APIError.permissionDenied(
					"You don't have permission to view the digest for this unit"
				)
			}

			const buffer = await buildCommanderDigestExport(id, recipientId)

			resp.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
			)
			resp.writeHead(200, { Connection: 'close' })
			return resp.end(buffer)
		} catch (err) {
			log.error('CommanderDigest export error', { err })

			if (err instanceof APIError) {
				throw err
			}
			throw APIError.internal('Internal error exporting commander digest')
		}
	}
)

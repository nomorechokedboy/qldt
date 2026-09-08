import commanderDigestRepo from './repo'
import { buildDigestNarrative } from './narrative'
import notificationController from '../notifications/controller'
import { AppError } from '../errors'
import { Unit } from '../schema/units'
import { logger } from '../logger/encore-logger'

class controller {
	async runWeeklyDigest(): Promise<void> {
		const units = await commanderDigestRepo.getDigestUnits()

		for (const unit of units) {
			try {
				await this.sendUnitDigest(unit)
			} catch (err) {
				// One unit failing (bad data, LLM timeout) must not block
				// the rest of the weekly run.
				logger.error(
					'CommanderDigestController.runWeeklyDigest failed for unit',
					{
						unitId: unit.id,
						err
					}
				)
			}
		}
	}

	private async sendUnitDigest(unit: Unit): Promise<void> {
		const recipientIds = commanderDigestRepo.getRecipientIds(unit)
		if (recipientIds.length === 0) return

		const snapshot = await commanderDigestRepo.gatherUnitSnapshot(unit)

		const params = await Promise.all(
			recipientIds.map(async (recipientId) => {
				const pendingApprovals =
					await commanderDigestRepo.gatherPendingApprovals(
						recipientId
					)
				const { title, message } = await buildDigestNarrative(
					snapshot,
					pendingApprovals
				)
				return {
					notificationType: 'commanderDigest' as const,
					title,
					message,
					recipientId
				}
			})
		)

		await notificationController.create(params).catch(AppError.handleAppErr)
	}
}

const commanderDigestController = new controller()

export default commanderDigestController

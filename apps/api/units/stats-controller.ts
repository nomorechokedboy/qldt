import log from 'encore.dev/log'
import { AppError } from '../errors'
import materialAssetRepo from '../materials/material-assets-repo'
import materialStockRepo from '../materials/material-stocks-repo'
import { MaterialAsset } from '../schema/material-assets'
import { MaterialStock } from '../schema/material-stocks'
import { Student } from '../schema/student'
import { Unit } from '../schema/units'
import studentRepo from '../students/repo'
import unitRepo from './repo'
import unitStatsRepo, { UnitStatsSummary } from './stats-repo'

class controller {
	private async getUnitOrThrow(alias: string): Promise<Unit> {
		const unit = await unitRepo.getOne({ alias })
		if (unit === undefined) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(`Unit not found: ${alias}`)
			)
		}
		return unit
	}

	private async validateAccess(
		unitId: number,
		validUnitIds: number[]
	): Promise<void> {
		if (!validUnitIds.includes(unitId)) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to view stats for this unit"
				)
			)
		}
	}

	async getStats(
		alias: string,
		validUnitIds: number[]
	): Promise<{ unit: Unit } & UnitStatsSummary> {
		log.trace('UnitStatsController.getStats', { alias })

		const unit = await this.getUnitOrThrow(alias)
		await this.validateAccess(unit.id, validUnitIds)

		const descendantUnitIds = await unitStatsRepo.findDescendantUnitIds(
			unit.id
		)
		const classIds = await unitStatsRepo.classIdsForUnits(descendantUnitIds)

		const [
			totalStudents,
			buildingsCount,
			roomsCount,
			unitCounts,
			materialStockSummary,
			materialAssetSummary
		] = await Promise.all([
			unitStatsRepo.countStudents(descendantUnitIds, classIds),
			unitStatsRepo.countBuildings(descendantUnitIds),
			unitStatsRepo.countRooms(descendantUnitIds),
			unitStatsRepo.unitCountsByLevel(descendantUnitIds, unit.id),
			unitStatsRepo.materialStockSummary(descendantUnitIds),
			unitStatsRepo.materialAssetSummary(descendantUnitIds)
		])

		return {
			unit,
			totalStudents,
			buildingsCount,
			roomsCount,
			unitCounts,
			materialStockSummary,
			materialAssetSummary
		}
	}

	async getStudents(
		alias: string,
		validUnitIds: number[]
	): Promise<Student[]> {
		const unit = await this.getUnitOrThrow(alias)
		await this.validateAccess(unit.id, validUnitIds)

		const descendantUnitIds = await unitStatsRepo.findDescendantUnitIds(
			unit.id
		)
		const classIds = await unitStatsRepo.classIdsForUnits(descendantUnitIds)

		return studentRepo
			.find({ unitIds: descendantUnitIds, classIds })
			.catch(AppError.handleAppErr)
	}

	async getMaterialStocks(
		alias: string,
		validUnitIds: number[]
	): Promise<MaterialStock[]> {
		const unit = await this.getUnitOrThrow(alias)
		await this.validateAccess(unit.id, validUnitIds)

		const descendantUnitIds = await unitStatsRepo.findDescendantUnitIds(
			unit.id
		)

		return materialStockRepo
			.find({ unitIds: descendantUnitIds })
			.catch(AppError.handleAppErr)
	}

	async getMaterialAssets(
		alias: string,
		validUnitIds: number[]
	): Promise<MaterialAsset[]> {
		const unit = await this.getUnitOrThrow(alias)
		await this.validateAccess(unit.id, validUnitIds)

		const descendantUnitIds = await unitStatsRepo.findDescendantUnitIds(
			unit.id
		)

		return materialAssetRepo
			.find({ unitIds: descendantUnitIds })
			.catch(AppError.handleAppErr)
	}
}

const unitStatsController = new controller()

export default unitStatsController

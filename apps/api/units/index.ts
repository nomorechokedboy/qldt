import {
	Unit,
	UnitDB,
	UnitFilter,
	UnitLevelName,
	UnitParams,
	UnitQuery,
	UnitRelations,
	UpdateUnitMap
} from '../schema/units'
import { UnitStatsSummary } from './stats-repo'

export interface Repository {
	create(params: UnitParams[]): Promise<UnitDB[]>
	delete(units: UnitDB[]): Promise<UnitDB[]>
	update(params: UpdateUnitMap): Promise<UnitDB[]>
	find(query?: UnitQuery): Promise<Unit[]>
	findOne(
		filter: UnitFilter,
		opts?: { with?: UnitRelations }
	): Promise<Unit | undefined>
	findAncestorChain(unitId: number): Promise<UnitDB[]>
}

export interface UnitStatsRepository {
	findDescendantUnitIds(rootId: number): Promise<number[]>

	unitCountsByLevel(
		descendantUnitIds: number[],
		excludeId: number
	): Promise<Partial<Record<UnitLevelName, number>>>

	countStudents(unitIds: number[]): Promise<number>

	countBuildings(unitIds: number[]): Promise<number>

	countRooms(unitIds: number[]): Promise<number>

	materialStockSummary(
		unitIds: number[]
	): Promise<UnitStatsSummary['materialStockSummary']>

	materialAssetSummary(
		unitIds: number[]
	): Promise<UnitStatsSummary['materialAssetSummary']>

	troopSummary(unitIds: number[]): Promise<UnitStatsSummary['troopSummary']>
}

import {
	Unit,
	UnitDB,
	UnitLevelName,
	UnitParams,
	UnitQuery,
	UpdateUnitMap
} from '../schema/units'

export interface Repository {
	create(params: UnitParams[]): Promise<UnitDB[]>
	delete(units: UnitDB[]): Promise<UnitDB[]>
	update(params: UpdateUnitMap): Promise<UnitDB[]>
	find(query: UnitQuery): Promise<Unit[]>
	findAll(): Promise<Unit[]>
	findOne(params: {
		alias: string
		level: UnitLevelName
	}): Promise<Unit | undefined>
	findByIds(ids: number[]): Promise<UnitDB[]>
	findById(
		id: number,
		opts?: {
			with: { children?: boolean; classes?: boolean; parent?: boolean }
		}
	): Promise<UnitDB | undefined>
	getOne(params: Partial<UnitDB>): Promise<Unit | undefined>
	findRoot(): Promise<UnitDB | undefined>
}

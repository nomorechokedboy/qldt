import { PositionDB, PositionParam } from '../schema/positions'

export type PositionQuery = {
	level?: string
	ids?: number[]
}

export type UpdatePositionMap = {
	id: number
	updatePayload: Partial<{
		level: string
		code: string
		name: string
		priority: number
		group: string | null
	}>
}[]

export interface Repository {
	create(params: PositionParam[]): Promise<PositionDB[]>
	update(params: UpdatePositionMap): Promise<PositionDB[]>
	delete(positions: PositionDB[]): Promise<PositionDB[]>
	find(query: PositionQuery): Promise<PositionDB[]>
	findByIds(ids: number[]): Promise<PositionDB[]>
	findByLevel(level: string): Promise<PositionDB[]>
}

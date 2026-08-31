import {
	Building,
	BuildingDB,
	BuildingParams,
	BuildingQuery,
	UpdateBuildingMap
} from '../schema/buildings'
import {
	Room,
	RoomDB,
	RoomParams,
	RoomQuery,
	UpdateRoomMap
} from '../schema/rooms'

export interface BuildingRepository {
	create(params: BuildingParams[]): Promise<BuildingDB[]>
	update(params: UpdateBuildingMap): Promise<BuildingDB[]>
	delete(buildings: BuildingDB[]): Promise<BuildingDB[]>
	find(query: BuildingQuery): Promise<Building[]>
	findByIds(ids: number[]): Promise<BuildingDB[]>
	getOne(params: Partial<BuildingDB>): Promise<Building | undefined>
}

export interface RoomRepository {
	create(params: RoomParams[]): Promise<RoomDB[]>
	update(params: UpdateRoomMap): Promise<RoomDB[]>
	delete(rooms: RoomDB[]): Promise<RoomDB[]>
	find(query: RoomQuery): Promise<Room[]>
	findByIds(ids: number[]): Promise<RoomDB[]>
	getOne(params: Partial<RoomDB>): Promise<Room | undefined>
}

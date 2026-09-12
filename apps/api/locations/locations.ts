import { api, Query } from 'encore.dev/api'
import locationsController from './controller'
import { Province, Ward } from '.'

interface GetProvincesResponse {
	data: Province[]
}

export const GetProvinces = api(
	{ auth: true, expose: true, method: 'GET', path: '/provinces' },
	async (): Promise<GetProvincesResponse> => {
		return { data: locationsController.findProvinces() }
	}
)

export interface GetWardsQuery {
	provinceCode?: Query<string>
}

interface GetWardsResponse {
	data: Ward[]
}

export const GetWards = api(
	{ auth: true, expose: true, method: 'GET', path: '/wards' },
	async (q: GetWardsQuery): Promise<GetWardsResponse> => {
		return { data: locationsController.findWards(q) }
	}
)

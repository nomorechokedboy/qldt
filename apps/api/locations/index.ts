export type Province = {
	code: string
	name: string
	slug: string
	type: string
	nameWithType: string
}

export type Ward = {
	code: string
	name: string
	slug: string
	type: string
	nameWithType: string
	path: string
	pathWithType: string
	provinceCode: string
}

export type WardQuery = {
	provinceCode?: string
}

export interface Repository {
	findProvinces(): Province[]
	findWards(query: WardQuery): Ward[]
}

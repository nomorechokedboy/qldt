import provincesData from './data/province.json'
import wardsData from './data/ward.json'
import { Province, Repository, Ward, WardQuery } from '.'

type RawProvince = {
	name: string
	slug: string
	type: string
	name_with_type: string
	code: string
}

type RawWard = {
	name: string
	slug: string
	type: string
	name_with_type: string
	path: string
	path_with_type: string
	code: string
	parent_code: string
}

function normalizeProvince(raw: RawProvince): Province {
	return {
		code: raw.code,
		name: raw.name,
		slug: raw.slug,
		type: raw.type,
		nameWithType: raw.name_with_type
	}
}

function normalizeWard(raw: RawWard): Ward {
	return {
		code: raw.code,
		name: raw.name,
		slug: raw.slug,
		type: raw.type,
		nameWithType: raw.name_with_type,
		path: raw.path,
		pathWithType: raw.path_with_type,
		provinceCode: raw.parent_code
	}
}

const provinces: Province[] = Object.values(
	provincesData as unknown as Record<string, RawProvince>
).map(normalizeProvince)

const wards: Ward[] = Object.values(
	wardsData as unknown as Record<string, RawWard>
).map(normalizeWard)

const wardsByProvinceCode = new Map<string, Ward[]>()
for (const ward of wards) {
	const list = wardsByProvinceCode.get(ward.provinceCode) ?? []
	list.push(ward)
	wardsByProvinceCode.set(ward.provinceCode, list)
}

class LocationsInMemoryRepo implements Repository {
	findProvinces(): Province[] {
		return provinces
	}

	findWards(query: WardQuery): Ward[] {
		if (query.provinceCode === undefined) {
			return wards
		}

		return wardsByProvinceCode.get(query.provinceCode) ?? []
	}
}

const locationsRepo = new LocationsInMemoryRepo()

export default locationsRepo

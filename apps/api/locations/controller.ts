import { Province, Repository, Ward, WardQuery } from '.'
import locationsRepo from './repo'

class controller {
	constructor(private readonly repo: Repository) {}

	findProvinces(): Province[] {
		return this.repo.findProvinces()
	}

	findWards(query: WardQuery): Ward[] {
		return this.repo.findWards(query)
	}
}

const locationsController = new controller(locationsRepo)

export default locationsController

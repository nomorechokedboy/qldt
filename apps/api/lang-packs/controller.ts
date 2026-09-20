import log from 'encore.dev/log'
import { Repository } from '.'
import { AppError } from '../errors'
import { LangPackData } from '../schema/lang-packs'
import langPackRepo from './repo'
import { parseLanguage, validateLangPack } from './validate'

export interface LangPackActor {
	isSuperAdmin: boolean
	userId?: number
}

function requireSuperAdmin(actor: LangPackActor) {
	if (!actor.isSuperAdmin) {
		throw AppError.permissionDenied(
			'Chỉ quản trị viên cấp cao mới được thay đổi gói ngôn ngữ'
		)
	}
}

class Controller {
	constructor(private readonly repo: Repository) {}

	// Public: the login page needs the packs before anyone is authenticated.
	find() {
		return this.repo.findAll().catch(AppError.handleAppErr)
	}

	async replace(
		language: string,
		input: unknown,
		actor: LangPackActor
	): Promise<{ previous?: LangPackData; current: LangPackData }> {
		log.trace('LangPackController.replace', { language })

		try {
			requireSuperAdmin(actor)
			const lang = parseLanguage(language)
			const current = validateLangPack(input)
			const previous = await this.repo.findOne(lang)

			await this.repo.upsert(lang, current, actor.userId)

			return { previous, current }
		} catch (err) {
			return AppError.handleAppErr(err)
		}
	}

	async remove(
		language: string,
		actor: LangPackActor
	): Promise<{ previous?: LangPackData }> {
		log.trace('LangPackController.remove', { language })

		try {
			requireSuperAdmin(actor)
			const lang = parseLanguage(language)
			const previous = await this.repo.findOne(lang)

			await this.repo.delete(lang)

			return { previous }
		} catch (err) {
			return AppError.handleAppErr(err)
		}
	}
}

const langPackController = new Controller(langPackRepo)

export default langPackController

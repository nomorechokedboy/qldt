import { eq } from 'drizzle-orm'
import log from 'encore.dev/log'
import { Repository } from '.'
import orm, { DrizzleDatabase } from '../database'
import { langPacks } from '../schema/lang-packs'
import { handleDatabaseErr } from '../utils'
import { LangPackLanguage } from './validate'

class sqliteRepo implements Repository {
	constructor(private readonly db: DrizzleDatabase) {}

	async findAll() {
		const rows = await this.db
			.select()
			.from(langPacks)
			.catch(handleDatabaseErr)

		return Object.fromEntries(rows.map((r) => [r.language, r.pack]))
	}

	async findOne(language: LangPackLanguage) {
		const [row] = await this.db
			.select()
			.from(langPacks)
			.where(eq(langPacks.language, language))
			.catch(handleDatabaseErr)

		return row?.pack
	}

	async upsert(
		language: LangPackLanguage,
		pack: Parameters<Repository['upsert']>[1],
		updatedByUserId?: number
	) {
		log.info('LangPackRepo.upsert', { language })

		await this.db
			.insert(langPacks)
			.values({ language, pack, updatedByUserId })
			.onConflictDoUpdate({
				target: langPacks.language,
				set: { pack, updatedByUserId }
			})
			.catch(handleDatabaseErr)
	}

	async delete(language: LangPackLanguage) {
		log.info('LangPackRepo.delete', { language })

		await this.db
			.delete(langPacks)
			.where(eq(langPacks.language, language))
			.catch(handleDatabaseErr)
	}
}

const langPackRepo = new sqliteRepo(orm)

export default langPackRepo

import { LangPackData } from '../schema/lang-packs'
import { LangPackLanguage } from './validate'

export interface Repository {
	findAll(): Promise<Partial<Record<LangPackLanguage, LangPackData>>>
	upsert(
		language: LangPackLanguage,
		pack: LangPackData,
		updatedByUserId?: number
	): Promise<void>
	findOne(language: LangPackLanguage): Promise<LangPackData | undefined>
	delete(language: LangPackLanguage): Promise<void>
}

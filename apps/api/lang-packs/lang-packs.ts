import { api } from 'encore.dev/api'
import { getAuthData } from '~encore/auth'
import { setAuditContext } from '../middleware/audit'
import langPackController from './controller'

interface GetLangPacksResponse {
	// language -> { namespace -> { key -> string } }
	packs: Record<string, Record<string, unknown>>
}

// Public on purpose: the login page renders before anyone is authenticated
// and must already show the customised strings.
export const GetLangPacks = api(
	{ expose: true, method: 'GET', path: '/lang-packs' },
	async (): Promise<GetLangPacksResponse> => {
		const packs = await langPackController.find()
		return { packs }
	}
)

interface SetLangPackRequest {
	language: string
	pack: Record<string, unknown>
}

interface SetLangPackResponse {
	language: string
}

export const SetLangPack = api(
	{ auth: true, expose: true, method: 'PUT', path: '/lang-packs/:language' },
	async ({
		language,
		pack
	}: SetLangPackRequest): Promise<SetLangPackResponse> => {
		const authData = getAuthData()!
		const { previous, current } = await langPackController.replace(
			language,
			pack,
			{
				isSuperAdmin: authData.isSuperAdmin,
				userId: Number(authData.userID)
			}
		)

		setAuditContext({
			resourceIds: [language],
			previousValue: previous,
			newValue: current
		})

		return { language }
	}
)

export const DeleteLangPack = api(
	{
		auth: true,
		expose: true,
		method: 'DELETE',
		path: '/lang-packs/:language'
	},
	async ({
		language
	}: {
		language: string
	}): Promise<SetLangPackResponse> => {
		const authData = getAuthData()!
		const { previous } = await langPackController.remove(language, {
			isSuperAdmin: authData.isSuperAdmin,
			userId: Number(authData.userID)
		})

		setAuditContext({ resourceIds: [language], previousValue: previous })

		return { language }
	}
)

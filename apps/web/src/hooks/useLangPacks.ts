import { DeleteLangPack, GetLangPacks, SetLangPack } from '@/api'
import { applyLangPacks, type LangPackData } from '@/i18n/lang-packs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const LANG_PACKS_QUERY_KEY = ['lang-packs'] as const

// Packs are merged into i18n as part of the fetch itself rather than in a
// component effect: react-i18next re-subscribes to the store on every render,
// so an effect that applies them can fire while a consumer is unsubscribed and
// that consumer would miss the update.
async function fetchAndApplyLangPacks() {
	const packs = await GetLangPacks()
	applyLangPacks(packs as Partial<Record<string, LangPackData>>)
	return packs
}

// The packs are public so they can be applied before login too. A failure
// (API down, first boot) silently leaves the built-in text in place.
// Mount once near the root so every page shows the customised text.
export function useLangPacks() {
	return useQuery({
		queryKey: LANG_PACKS_QUERY_KEY,
		queryFn: fetchAndApplyLangPacks,
		staleTime: 5 * 60 * 1000,
		retry: false,
		refetchOnWindowFocus: false
	})
}

export function useLangPackMutations() {
	const queryClient = useQueryClient()
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: LANG_PACKS_QUERY_KEY })

	const save = useMutation({
		mutationFn: ({
			language,
			pack
		}: {
			language: string
			pack: LangPackData
		}) => SetLangPack(language, pack),
		onSuccess: refresh
	})

	const reset = useMutation({
		mutationFn: (language: string) => DeleteLangPack(language),
		onSuccess: refresh
	})

	return { save, reset }
}

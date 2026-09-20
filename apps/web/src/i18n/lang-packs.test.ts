import { afterEach, describe, expect, it } from 'vitest'
import i18n, { resources } from '.'
import {
	analyzeLangPack,
	applyLangPacks,
	buildLangPackTemplate,
	LangPackFileError
} from './lang-packs'

afterEach(() => applyLangPacks({}))

describe('applying language packs', () => {
	it('overrides only the strings in the pack and keeps the rest', () => {
		applyLangPacks({ vi: { common: { actions: { refresh: 'Tải lại' } } } })

		expect(i18n.t('common:actions.refresh')).toBe('Tải lại')
		expect(i18n.t('nav:items.home')).toBe('Trang chủ')
	})

	it('applies a pack only to its own language', async () => {
		applyLangPacks({ en: { common: { actions: { refresh: 'Reload' } } } })

		expect(i18n.t('common:actions.refresh')).toBe('Làm mới')
		await i18n.changeLanguage('en')
		expect(i18n.t('common:actions.refresh')).toBe('Reload')
		await i18n.changeLanguage('vi')
	})

	it('restores the built-in text once the pack is gone', () => {
		applyLangPacks({ vi: { common: { actions: { refresh: 'Tải lại' } } } })
		applyLangPacks({})

		expect(i18n.t('common:actions.refresh')).toBe('Làm mới')
	})

	it('swaps one pack for another without leaving the old strings behind', () => {
		applyLangPacks({ vi: { common: { actions: { refresh: 'Tải lại' } } } })
		applyLangPacks({ vi: { nav: { items: { home: 'Nhà' } } } })

		expect(i18n.t('common:actions.refresh')).toBe('Làm mới')
		expect(i18n.t('nav:items.home')).toBe('Nhà')
	})

	it('ignores stored keys the catalog does not have or that break its shape', () => {
		applyLangPacks({
			vi: {
				common: {
					actions: 'not an object',
					nonsense: { deep: 'x' }
				},
				unknownNamespace: { a: 'b' }
			} as never
		})

		expect(i18n.t('common:actions.refresh')).toBe('Làm mới')
		expect(i18n.exists('common:nonsense.deep')).toBe(false)
	})

	it('never alters the built-in catalog', () => {
		const before = JSON.stringify(resources)

		applyLangPacks({ vi: { common: { actions: { refresh: 'Tải lại' } } } })

		expect(JSON.stringify(resources)).toBe(before)
	})
})

describe('analyzing an uploaded pack', () => {
	it('keeps known strings and reports the unknown keys it dropped', () => {
		const result = analyzeLangPack(
			{
				common: { actions: { refresh: 'Tải lại' }, missing: 'x' },
				ghost: { a: 'b' }
			},
			'vi'
		)

		expect(result.pack).toEqual({
			common: { actions: { refresh: 'Tải lại' } }
		})
		expect(result.applied).toBe(1)
		expect(result.ignored.sort()).toEqual(['common.missing', 'ghost'])
	})

	it('flags strings whose placeholders differ from the original', () => {
		const original = i18n.t('langPacks:result.applied', { count: 3 })
		expect(original).toContain('3')

		const result = analyzeLangPack(
			{ langPacks: { result: { applied: 'Xong' } } },
			'vi'
		)

		expect(result.placeholderMismatches).toEqual([
			'langPacks.result.applied'
		])
		expect(result.applied).toBe(1)
	})

	it.each([
		['a non-object file', ['x']],
		['a non-string value', { common: { actions: { refresh: 3 } } }],
		['a namespace that is not an object', { common: 'x' }],
		['a file with nothing that matches', { ghost: { a: 'b' } }]
	])('rejects %s', (_label, input) => {
		expect(() => analyzeLangPack(input, 'vi')).toThrow(LangPackFileError)
	})
})

describe('the downloadable template', () => {
	it('is the full built-in catalog and passes its own analysis', () => {
		const template = JSON.parse(buildLangPackTemplate('en'))

		expect(Object.keys(template).sort()).toEqual(
			Object.keys(resources.en).sort()
		)
		expect(analyzeLangPack(template, 'en').ignored).toEqual([])
	})
})

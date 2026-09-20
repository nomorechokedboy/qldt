import { describe, expect, it } from 'vitest'
import { resources } from '.'

function keyPaths(value: unknown, prefix = ''): string[] {
	if (typeof value !== 'object' || value === null) return [prefix]
	return Object.entries(value).flatMap(([key, child]) =>
		keyPaths(child, prefix ? `${prefix}.${key}` : key)
	)
}

describe('translation catalogs', () => {
	it('gives English every message Vietnamese has, and nothing more', () => {
		for (const ns of Object.keys(
			resources.vi
		) as (keyof typeof resources.vi)[]) {
			expect(keyPaths(resources.en[ns]).sort(), ns).toEqual(
				keyPaths(resources.vi[ns]).sort()
			)
		}
	})

	it('leaves no message empty', () => {
		for (const lang of ['vi', 'en'] as const) {
			for (const [ns, catalog] of Object.entries(resources[lang])) {
				const empty = keyPaths(catalog).filter((path) => {
					const text = path
						.split('.')
						.reduce<any>((node, key) => node?.[key], catalog)
					return text === ''
				})
				expect(empty, `${lang}/${ns}`).toEqual([])
			}
		}
	})
})

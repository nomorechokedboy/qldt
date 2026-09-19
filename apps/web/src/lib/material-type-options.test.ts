import { describe, expect, it } from 'vitest'
import { buildMaterialTypeOptions } from './material-type-options'

describe('buildMaterialTypeOptions', () => {
	it('keeps the plain name when it is unique', () => {
		expect(
			buildMaterialTypeOptions([
				{ id: 1, name: 'AK', unitOfMeasure: 'khẩu' },
				{ id: 2, name: 'Chiếu', unitOfMeasure: 'cái' }
			])
		).toEqual([
			{ id: 1, label: 'AK' },
			{ id: 2, label: 'Chiếu' }
		])
	})

	it('tells apart types that share a name by their unit of measure', () => {
		const options = buildMaterialTypeOptions([
			{ id: 1, name: 'Chiếu', unitOfMeasure: 'cái' },
			{ id: 2, name: 'Chiếu', unitOfMeasure: 'bộ' }
		])

		expect(options.map((o) => o.label)).toEqual([
			'Chiếu (cái)',
			'Chiếu (bộ)'
		])
		expect(new Set(options.map((o) => o.label)).size).toBe(2)
	})

	it('treats names that differ only by case or spacing as shared', () => {
		const labels = buildMaterialTypeOptions([
			{ id: 1, name: 'Chiếu', unitOfMeasure: 'cái' },
			{ id: 2, name: ' chiếu ', unitOfMeasure: 'bộ' }
		]).map((o) => o.label.trim().toLowerCase())

		expect(new Set(labels).size).toBe(2)
	})
})

import type { locations } from '@/api/client'
import usePositionOptions from '@/hooks/usePositionOptions'
import useProvinces from '@/hooks/useProvinces'
import useUnitOptions from '@/hooks/useUnitOptions'
import useWards from '@/hooks/useWards'
import { useMemo } from 'react'
import type { ParseImportFileParams } from './parse-import-file'

type SelectOption = { value: string; label: string }

const normalize = (label: string) => label.trim().toLowerCase()

function groupWardsByProvince(wards: locations.Ward[]) {
	const map = new Map<string, locations.Ward[]>()
	for (const w of wards) {
		const list = map.get(w.provinceCode) ?? []
		list.push(w)
		map.set(w.provinceCode, list)
	}
	return map
}

// Everything the dialog needs to know about the reference data (units,
// positions, provinces, wards): the raw lists for building the downloadable
// template, the name -> id/code maps for resolving an uploaded file, and the
// {value,label} option lists for the review table's dropdowns. All of it is
// only fetched while the dialog is open.
export function useImportLookups(enabled: boolean) {
	const { options: unitOptions } = useUnitOptions({ enabled })
	const { data: provinces = [] } = useProvinces({ enabled })
	// Unfiltered - the whole ward list is needed up front to build the
	// per-province cascading dropdown sheet and the name->code lookup used
	// when parsing the uploaded file back.
	const { data: wards = [] } = useWards(undefined, { enabled })

	// Grouped by unit level like every other position picker, so the review
	// table's searchable combobox can group and filter instead of forcing a
	// scroll through every position of every level.
	const positionComboboxOptions = usePositionOptions({ enabled })

	// The dropdown in the downloaded template is a flat list, so the level is
	// folded into each label.
	const positionOptions = useMemo(
		() =>
			positionComboboxOptions.map((o) => ({
				id: Number(o.value),
				label: `${o.group} - ${o.label}`
			})),
		[positionComboboxOptions]
	)

	// wards grouped by provinceCode, in a stable order - used both to build
	// the per-province ward columns/named ranges in the template and as the
	// basis for the ward name lookup below.
	const wardsByProvinceCode = useMemo(
		() => groupWardsByProvince(wards),
		[wards]
	)

	// Human-readable dropdown choices (lowercased, trimmed) back to the
	// numeric/coded foreign keys the API takes.
	const parseLookups = useMemo<Omit<ParseImportFileParams, 'data'>>(() => {
		const unitLabelToId = new Map(
			unitOptions.map((o) => [normalize(o.label), o.id])
		)
		const positionLabelToId = new Map(
			positionOptions.map((o) => [normalize(o.label), o.id])
		)
		const provinceNameToCode = new Map(
			provinces.map((p) => [normalize(p.nameWithType), p.code])
		)
		// Ward names aren't globally unique, so resolution must be scoped to
		// the row's already-resolved province.
		const wardNameToCodeByProvince = new Map(
			[...wardsByProvinceCode].map(([provinceCode, provinceWards]) => [
				provinceCode,
				new Map(
					provinceWards.map((w) => [
						normalize(w.nameWithType),
						w.code
					])
				)
			])
		)

		return {
			unitLabelToId,
			positionLabelToId,
			provinceNameToCode,
			wardNameToCodeByProvince
		}
	}, [unitOptions, positionOptions, provinces, wardsByProvinceCode])

	// Hoisted out of the column cells: every ReviewSelectCell used to re-map
	// its `options` array (unitOptions/provinces/wards -> {value, label})
	// from scratch on EVERY row on EVERY render, since cell renderers run
	// per-row per-render. With hundreds of units/rows that's hundreds of
	// thousands of object allocations on every keystroke or selection, which
	// is what made picking an option feel like it locked up the tab. Building
	// each option list once here and reusing the same array reference also
	// lets ReviewSelectCell's internal filteredOptions memo actually memoize
	// instead of recomputing on every render.
	const unitSelectOptions = useMemo<SelectOption[]>(
		() => unitOptions.map((o) => ({ value: String(o.id), label: o.label })),
		[unitOptions]
	)
	const provinceSelectOptions = useMemo<SelectOption[]>(
		() => provinces.map((p) => ({ value: p.code, label: p.nameWithType })),
		[provinces]
	)
	const wardSelectOptionsByProvinceCode = useMemo(
		() =>
			new Map<string, SelectOption[]>(
				[...wardsByProvinceCode].map(([code, provinceWards]) => [
					code,
					provinceWards.map((w) => ({
						value: w.code,
						label: w.nameWithType
					}))
				])
			),
		[wardsByProvinceCode]
	)

	return {
		templateData: {
			provinces,
			wardsByProvinceCode,
			unitOptions,
			positionOptions
		},
		parseLookups,
		selectOptions: {
			unitSelectOptions,
			positionComboboxOptions,
			provinceSelectOptions,
			wardSelectOptionsByProvinceCode
		}
	}
}

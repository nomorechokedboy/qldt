import { useMemo } from 'react'
import { useStore } from '@tanstack/react-form'
import useProvinces from '@/hooks/useProvinces'
import useWards from '@/hooks/useWards'

// Renders the province/ward combobox pair plus the narrowed detail text
// field for one place ("birthPlace" = quê quán, "address" = trú quán) of a
// student. Shared by the create wizard (personal-step.tsx) and the edit
// form (StudentEditForm.tsx) since both use the same useAppForm()-produced
// `form`, so `form.AppField`/`field.Combobox` behave identically in either
// place.
export default function PlacePickerFields({
	form,
	prefix,
	label
}: {
	form: any
	prefix: 'birthPlace' | 'address'
	label: string
}) {
	const provinceField = `${prefix}ProvinceCode`
	const wardField = `${prefix}WardCode`

	const { data: provinces = [] } = useProvinces()
	const provinceCode = useStore(
		form.store,
		(state: any) => state.values[provinceField]
	) as string | undefined
	const { data: wards = [] } = useWards(provinceCode || undefined)

	const provinceOptions = useMemo(
		() => provinces.map((p) => ({ value: p.code, label: p.nameWithType })),
		[provinces]
	)
	const wardOptions = useMemo(
		() => wards.map((w) => ({ value: w.code, label: w.nameWithType })),
		[wards]
	)

	return (
		<>
			<form.AppField name={provinceField}>
				{(field: any) => (
					<field.Combobox
						label={`Tỉnh/Thành (${label})`}
						values={provinceOptions}
						placeholder='Chọn tỉnh/thành'
						onChange={() => form.setFieldValue(wardField, '')}
					/>
				)}
			</form.AppField>

			<form.AppField name={wardField}>
				{(field: any) => (
					<field.Combobox
						label={`Phường/Xã (${label})`}
						values={wardOptions}
						placeholder={
							provinceCode
								? 'Chọn phường/xã'
								: 'Chọn tỉnh/thành trước'
						}
					/>
				)}
			</form.AppField>

			<form.AppField name={prefix}>
				{(field: any) => (
					<field.TextField label={`Số nhà, đường (${label})`} />
				)}
			</form.AppField>
		</>
	)
}

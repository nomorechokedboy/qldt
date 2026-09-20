import type { materials } from '@/api/client'
import i18n from '@/i18n'

type MaterialCategory = materials.MaterialTypeBody['category']
type AssetStatus = 'in_service' | 'damaged' | 'lost' | 'retired'
type MaterialCondition = 'good' | 'fair' | 'needs_maintenance' | 'damaged'

const categoryKeys: MaterialCategory[] = [
	'furniture',
	'equipment',
	'weapon',
	'vehicle'
]
const assetStatusKeys: AssetStatus[] = [
	'in_service',
	'damaged',
	'lost',
	'retired'
]
const conditionKeys: MaterialCondition[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

// Each label is a getter so it follows the active language at read time.
function labelsBy<K extends string>(
	keys: readonly K[],
	translate: (key: K) => string
): Record<K, string> {
	const labels = {} as Record<K, string>
	for (const key of keys) {
		Object.defineProperty(labels, key, {
			enumerable: true,
			get: () => translate(key)
		})
	}
	return labels
}

function optionsOf<K extends string>(labels: Record<K, string>) {
	return (Object.keys(labels) as K[]).map((value) => ({
		value,
		get label() {
			return labels[value]
		}
	}))
}

export const materialCategoryLabels = labelsBy(categoryKeys, (key) =>
	i18n.t(`materials:categories.${key}`)
)

export const materialCategoryOptions = optionsOf(materialCategoryLabels)

export const materialAssetStatusLabels: Record<string, string> = labelsBy(
	assetStatusKeys,
	(key) => i18n.t(`materials:assetStatus.${key}`)
)

export const materialAssetStatusOptions = optionsOf(materialAssetStatusLabels)

export const materialConditionLabels: Record<string, string> = labelsBy(
	conditionKeys,
	(key) => i18n.t(`materials:condition.${key}`)
)

export const materialConditionOptions = optionsOf(materialConditionLabels)

// Spreadsheet import templates, lookups and exports are a file-format
// contract, so their status/condition words stay Vietnamese whatever the UI
// language is.
const viMaterials = () => i18n.getFixedT('vi', 'materials')

export const materialAssetStatusLabelsVi: Record<string, string> = labelsBy(
	assetStatusKeys,
	(key) => viMaterials()(`assetStatus.${key}`)
)

export const materialAssetStatusOptionsVi = optionsOf(
	materialAssetStatusLabelsVi
)

export const materialConditionLabelsVi: Record<string, string> = labelsBy(
	conditionKeys,
	(key) => viMaterials()(`condition.${key}`)
)

export const materialConditionOptionsVi = optionsOf(materialConditionLabelsVi)

export const materialConditionColors = {
	damaged: 'bg-red-50 text-red-700',
	fair: 'bg-blue-50 text-blue-700',
	good: 'bg-green-50 text-green-700',
	needs_maintenance: 'bg-yellow-50 text-yellow-700'
}

import type { materials } from '@/api/client'

type MaterialCategory = materials.MaterialTypeBody['category']

export const materialCategoryLabels: Record<MaterialCategory, string> = {
	furniture: 'Đồ nội thất',
	equipment: 'Trang thiết bị',
	weapon: 'Vũ khí',
	vehicle: 'Phương tiện'
}

export const materialCategoryOptions = (
	Object.keys(materialCategoryLabels) as MaterialCategory[]
).map((value) => ({
	value,
	label: materialCategoryLabels[value]
}))

export const materialAssetStatusLabels: Record<string, string> = {
	in_service: 'Đang sử dụng',
	damaged: 'Hư hỏng',
	lost: 'Mất',
	retired: 'Đã thanh lý'
}

export const materialAssetStatusOptions = Object.entries(
	materialAssetStatusLabels
).map(([value, label]) => ({ value, label }))

export const materialConditionLabels: Record<string, string> = {
	good: 'Tốt',
	fair: 'Khá',
	needs_maintenance: 'Cần bảo dưỡng',
	damaged: 'Hư hỏng'
}

export const materialConditionOptions = Object.entries(
	materialConditionLabels
).map(([value, label]) => ({ value, label }))

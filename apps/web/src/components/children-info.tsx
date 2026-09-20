import { useTranslation } from 'react-i18next'
import DynamicPersonList from '@/components/dynamic-person-list'

export interface ChildrenInfoProps {
	form: any
}

export default function ChildrenInfo({ form }: ChildrenInfoProps) {
	const { t } = useTranslation('student')

	return (
		<DynamicPersonList
			form={form}
			fieldName='childrenInfos'
			config={{
				title: (index) => t('people.childTitle', { n: index + 1 }),
				addButtonText: t('people.addChild'),
				fullNameLabel: t('fields.childName'),
				fullNamePlaceholder: t('people.childPlaceholder')
			}}
		/>
	)
}

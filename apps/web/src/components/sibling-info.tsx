import { useTranslation } from 'react-i18next'
import DynamicPersonList from './dynamic-person-list'

export interface SiblingInfoProps {
	form: any
}

export default function SiblingInfo({ form }: SiblingInfoProps) {
	const { t } = useTranslation('student')

	return (
		<DynamicPersonList
			form={form}
			fieldName='siblings'
			config={{
				title: (index) => t('people.siblingTitle', { n: index + 1 }),
				addButtonText: t('people.addSibling'),
				fullNameLabel: t('fields.siblingName'),
				fullNamePlaceholder: t('people.siblingPlaceholder')
			}}
		/>
	)
}

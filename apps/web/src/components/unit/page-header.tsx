import { useTranslation } from 'react-i18next'

interface UnitPageHeaderProps {
	title?: string
}

export default function UnitPageHeader({ title }: UnitPageHeaderProps) {
	const { t } = useTranslation('units')
	return (
		<div className='flex items-center justify-between space-y-2'>
			<div>
				<h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
				<p className='text-muted-foreground'>
					{t('pageHeader.subtitle')}
				</p>
			</div>
		</div>
	)
}

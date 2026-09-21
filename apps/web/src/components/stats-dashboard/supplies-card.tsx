import { Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { units } from '@/api/client'
import SectionCard from './section-card'

// What the unit currently holds, per kind of supply.
export default function SuppliesCard({
	materialStockSummary
}: {
	materialStockSummary: units.GetUnitStatsResponse['materialStockSummary']
}) {
	const { t } = useTranslation('units')

	return (
		<SectionCard icon={Package} title={t('dashboard.supplies')}>
			{materialStockSummary.length === 0 ? (
				<p className='text-muted-foreground'>
					{t('dashboard.noSupplies')}
				</p>
			) : (
				<ul className='space-y-2'>
					{materialStockSummary.map((item) => (
						<li
							key={item.materialTypeId}
							className='flex items-center justify-between border-b pb-2 last:border-0'
						>
							<span>{item.materialTypeName}</span>
							<span className='font-semibold'>
								{item.totalQuantity}
							</span>
						</li>
					))}
				</ul>
			)}
		</SectionCard>
	)
}

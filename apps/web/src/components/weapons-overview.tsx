import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import type { units } from '@/api/client'

interface Props {
	summary: units.WeaponSummary
	// The unit the figures are for; its own holdings are labelled as direct.
	unitId: number
}

export default function WeaponsOverview({ summary, unitId }: Props) {
	const { t } = useTranslation('units')

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Shield className='h-5 w-5' />
					{t('dashboard.weapons')}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{summary.byType.length === 0 ? (
					<p className='text-muted-foreground'>
						{t('dashboard.noWeapons')}
					</p>
				) : (
					<>
						<div className='space-y-2'>
							<h3 className='font-medium'>
								{t('dashboard.weaponsByType')}
							</h3>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('dashboard.weaponType')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponTotal')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponInService')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponDamaged')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponLost')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponRetired')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponAssigned')}
										</TableHead>
										<TableHead className='text-right'>
											{t('dashboard.weaponHeldByUnit')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{summary.byType.map((row) => (
										<TableRow key={row.materialTypeId}>
											<TableCell>
												{row.materialTypeName}
											</TableCell>
											<TableCell className='text-right font-semibold'>
												{row.total}
											</TableCell>
											<TableCell className='text-right'>
												{row.inService}
											</TableCell>
											<TableCell className='text-right'>
												{row.damaged}
											</TableCell>
											<TableCell className='text-right'>
												{row.lost}
											</TableCell>
											<TableCell className='text-right'>
												{row.retired}
											</TableCell>
											<TableCell className='text-right'>
												{row.assigned}
											</TableCell>
											<TableCell className='text-right'>
												{row.heldByUnit}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{summary.byUnit.length > 0 && (
							<div className='space-y-2'>
								<h3 className='font-medium'>
									{t('dashboard.weaponsByUnit')}
								</h3>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												{t('dashboard.weaponUnit')}
											</TableHead>
											<TableHead className='text-right'>
												{t('dashboard.weaponTotal')}
											</TableHead>
											<TableHead className='text-right'>
												{t('dashboard.weaponInService')}
											</TableHead>
											<TableHead className='text-right'>
												{t('dashboard.weaponAssigned')}
											</TableHead>
											<TableHead className='text-right'>
												{t(
													'dashboard.weaponHeldByUnit'
												)}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{summary.byUnit.map((row) => (
											<TableRow key={row.unitId}>
												<TableCell>
													{row.unitId === unitId
														? t(
																'dashboard.weaponHeldDirectly',
																{
																	name: row.unitName
																}
															)
														: row.unitName}
												</TableCell>
												<TableCell className='text-right font-semibold'>
													{row.total}
												</TableCell>
												<TableCell className='text-right'>
													{row.inService}
												</TableCell>
												<TableCell className='text-right'>
													{row.assigned}
												</TableCell>
												<TableCell className='text-right'>
													{row.heldByUnit}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}

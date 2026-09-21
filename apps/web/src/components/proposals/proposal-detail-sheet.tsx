import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import { formatDbTimestamp } from '@/lib/utils'
import type { ProposalAdapter, ProposalRow } from './proposal-adapter'
import { itemStatusLabel, STATUS_BADGE_VARIANT, statusLabel } from './status'

export default function ProposalDetailSheet<TRow extends ProposalRow>({
	adapter,
	proposal,
	onClose
}: {
	adapter: ProposalAdapter<TRow>
	proposal: TRow | null
	onClose: () => void
}) {
	const { t } = useTranslation('proposals')
	// Reading `troopers` through the generic row only yields the shared
	// ProposalTrooper; the adapter's renderers want the kind's own item type.
	const troopers = proposal?.troopers as
		| NonNullable<TRow['troopers']>
		| undefined

	return (
		<Sheet open={proposal !== null} onOpenChange={(o) => !o && onClose()}>
			<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
				<SheetHeader>
					<SheetTitle>{t(`${adapter.kind}.detailTitle`)}</SheetTitle>
				</SheetHeader>
				{proposal && (
					<div className='space-y-4 px-4 pb-4'>
						<div className='grid grid-cols-2 gap-2 text-sm'>
							<span className='text-muted-foreground'>
								{t('common.unit')}
							</span>
							<span>{proposal.unit?.name ?? '—'}</span>
							{adapter.renderTarget(proposal, t)}
							<span className='text-muted-foreground'>
								{t('common.requestedBy')}
							</span>
							<span>
								{proposal.requestedBy?.displayName ?? '—'}
							</span>
							<span className='text-muted-foreground'>
								{t('common.approver')}
							</span>
							<span>{proposal.approver?.displayName ?? '—'}</span>
							<span className='text-muted-foreground'>
								{t('status.label')}
							</span>
							<span>
								<Badge
									variant={
										STATUS_BADGE_VARIANT[proposal.status] ??
										'secondary'
									}
								>
									{statusLabel(t, proposal.status)}
								</Badge>
							</span>
							{adapter.renderDates(proposal, t)}
							{proposal.note && (
								<>
									<span className='text-muted-foreground'>
										{t('common.note')}
									</span>
									<span>{proposal.note}</span>
								</>
							)}
							{proposal.rejectionReason && (
								<>
									<span className='text-muted-foreground'>
										{t('common.rejectionReason')}
									</span>
									<span>{proposal.rejectionReason}</span>
								</>
							)}
						</div>

						{!!troopers?.length && (
							<div>
								<h4 className='mb-1 text-sm font-medium'>
									{t('common.troopers')}
								</h4>
								<ul className='space-y-1 text-sm'>
									{troopers.map((trooper) => (
										<li
											key={trooper.id}
											className='flex flex-col gap-1 rounded-md border p-2'
										>
											<div className='flex items-center justify-between'>
												<span>
													{trooper.student
														?.fullName ??
														`#${trooper.id}`}
												</span>
												<span className='flex items-center gap-2'>
													<Badge variant='outline'>
														{itemStatusLabel(
															t,
															trooper.itemStatus
														)}
													</Badge>
													{trooper.failureReason && (
														<span className='text-xs text-destructive'>
															{
																trooper.failureReason
															}
														</span>
													)}
												</span>
											</div>
											<div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
												{adapter.renderTrooperMeta(
													proposal,
													trooper,
													t
												)}
												{trooper.appliedAt && (
													<span>
														{t(
															'common.itemAppliedAt',
															{
																date: formatDbTimestamp(
																	trooper.appliedAt
																)
															}
														)}
													</span>
												)}
												{adapter.renderTrooperEnd?.(
													trooper,
													t
												)}
											</div>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

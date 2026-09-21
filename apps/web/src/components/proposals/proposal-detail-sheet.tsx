import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import { formatDbTimestamp } from '@/lib/utils'
import { DetailRow, ItemRow, ItemSection } from './detail-parts'
import type { ProposalAdapter, ProposalRow } from './proposal-adapter'
import { STATUS_BADGE_VARIANT, statusLabel } from './status'

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
							{adapter.renderLead(proposal, t)}
							<DetailRow
								label={t(
									adapter.requestedByKey ??
										'common.requestedBy'
								)}
							>
								{proposal.requestedBy?.displayName ?? '—'}
							</DetailRow>
							<DetailRow label={t('common.approver')}>
								{proposal.approver?.displayName ?? '—'}
							</DetailRow>
							<DetailRow label={t('status.label')}>
								<Badge
									variant={
										STATUS_BADGE_VARIANT[proposal.status] ??
										'secondary'
									}
								>
									{statusLabel(t, proposal.status)}
								</Badge>
							</DetailRow>
							{adapter.renderDates?.(proposal, t)}
							{proposal.note && (
								<DetailRow label={t('common.note')}>
									{proposal.note}
								</DetailRow>
							)}
							{proposal.rejectionReason && (
								<DetailRow label={t('common.rejectionReason')}>
									{proposal.rejectionReason}
								</DetailRow>
							)}
						</div>

						{!!troopers?.length && (
							<ItemSection title={t('common.troopers')}>
								{troopers.map((trooper) => (
									<ItemRow
										key={trooper.id}
										label={
											trooper.student?.fullName ??
											`#${trooper.id}`
										}
										itemStatus={trooper.itemStatus}
										failureReason={trooper.failureReason}
									>
										<TrooperDetails
											adapter={adapter}
											proposal={proposal}
											trooper={trooper}
										/>
									</ItemRow>
								))}
							</ItemSection>
						)}

						{adapter.renderExtraSections?.(proposal, t)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

// The second line of a trooper: what the kind says about them, and when it
// was applied. Nothing (not even an empty line) when there is nothing to say.
function TrooperDetails<TRow extends ProposalRow>({
	adapter,
	proposal,
	trooper
}: {
	adapter: ProposalAdapter<TRow>
	proposal: TRow
	trooper: NonNullable<TRow['troopers']>[number]
}) {
	const { t } = useTranslation('proposals')
	const meta = adapter.renderTrooperMeta?.(proposal, trooper, t)
	const end = adapter.renderTrooperEnd?.(trooper, t)
	if (!meta && !trooper.appliedAt && !end) return null

	return (
		<div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
			{meta}
			{trooper.appliedAt && (
				<span>
					{t('common.itemAppliedAt', {
						date: formatDbTimestamp(trooper.appliedAt)
					})}
				</span>
			)}
			{end}
		</div>
	)
}

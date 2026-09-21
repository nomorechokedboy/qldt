import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Student } from '@/types'
import normalizeForSearch from './normalize-for-search'
import TrooperOverridePopover from './trooper-override-popover'
import type { TrooperPicker } from './use-trooper-picker'

interface TrooperPickerListProps<TOverride extends object> {
	hasUnit: boolean
	// Everyone in the chosen unit's scope, versus the subset that may be picked.
	unitTroopers: Student[]
	candidates: Student[]
	picker: TrooperPicker<TOverride>
	// Why someone in the unit cannot be picked; they are listed, greyed out,
	// under the ones who can.
	ineligibleReason?: (student: Student) => string | undefined
	// Shown when the unit has troopers but none of them may be picked.
	noCandidatesMessage?: string
	// A dismissible heads-up, e.g. that a header change dropped some picks.
	notice?: { message: string; onDismiss: () => void }
	formatLabel?: (student: Student) => string
	// Whether a selected trooper may switch to values of their own.
	canCustomize?: boolean
	customizeLabel: string
	useSharedLabel: string
	// A short description of a trooper's own values, or undefined when they
	// have none set.
	summarizeOverride: (override: TOverride) => string | undefined
	// The editor for a trooper's own values.
	renderOverride: (
		student: Student,
		override: TOverride | undefined
	) => ReactNode
}

// The trooper checklist every proposal form ends with: a count, a name
// search, select-all, and one row per trooper with an optional per-trooper
// override editor.
export default function TrooperPickerList<TOverride extends object>({
	hasUnit,
	unitTroopers,
	candidates,
	picker,
	ineligibleReason,
	noCandidatesMessage,
	notice,
	formatLabel = (s) => s.fullName ?? '',
	canCustomize = true,
	customizeLabel,
	useSharedLabel,
	summarizeOverride,
	renderOverride
}: TrooperPickerListProps<TOverride>) {
	const { t } = useTranslation('proposals')
	const { visible, search, setSearch, onlySelected, setOnlySelected } = picker

	const ineligible = useMemo(() => {
		const pickable = new Set(candidates.map((s) => s.id))
		const query = normalizeForSearch(search.trim())
		return unitTroopers.filter(
			(s) =>
				!pickable.has(s.id) &&
				(!query || normalizeForSearch(s.fullName ?? '').includes(query))
		)
	}, [unitTroopers, candidates, search])

	return (
		<div className='flex min-h-0 flex-1 flex-col gap-2'>
			<div className='flex items-center justify-between gap-2'>
				<Label>{t('common.troopers')}</Label>
				{candidates.length > 0 && (
					<span className='text-xs text-muted-foreground'>
						{t('common.selectedCount', {
							selected: picker.selectedIds.size,
							total: candidates.length
						})}
					</span>
				)}
			</div>
			{!hasUnit ? (
				<p className='py-6 text-center text-sm text-muted-foreground'>
					{t('common.pickUnitForTroopers')}
				</p>
			) : (
				<>
					{candidates.length > 0 && (
						<div className='flex items-center gap-3'>
							<div className='relative flex-1'>
								<Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder={t('common.searchTrooper')}
									className='pl-8 pr-8'
								/>
								{search && (
									<button
										type='button'
										onClick={() => setSearch('')}
										className='absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground'
									>
										<X className='size-4' />
										<span className='sr-only'>
											{t('common.clearSearch')}
										</span>
									</button>
								)}
							</div>
							<Label
								htmlFor='proposalTrooperOnlySelected'
								className='shrink-0 gap-2 text-xs font-normal'
							>
								<Checkbox
									id='proposalTrooperOnlySelected'
									checked={onlySelected}
									onCheckedChange={(v) =>
										setOnlySelected(!!v)
									}
								/>
								{t('common.onlySelected')}
							</Label>
						</div>
					)}
					{notice && (
						<output className='flex items-start justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs'>
							<span>{notice.message}</span>
							<button
								type='button'
								onClick={notice.onDismiss}
								className='text-muted-foreground hover:text-foreground'
							>
								<X className='size-3.5' />
								<span className='sr-only'>
									{t('common.dismiss')}
								</span>
							</button>
						</output>
					)}
					{/* Radix wraps the content in a `display: table` div that grows to its
					widest row; as a block it is bounded by the list, so long names
					truncate instead of scrolling the list sideways. */}
					<ScrollArea className='min-h-32 flex-1 rounded-md border p-2 [&_[data-radix-scroll-area-viewport]>div]:!block'>
						{unitTroopers.length === 0 && (
							<p className='p-2 text-sm text-muted-foreground'>
								{t('common.noTroopersInUnit')}
							</p>
						)}
						{unitTroopers.length !== 0 &&
							candidates.length === 0 &&
							noCandidatesMessage && (
								<p className='p-2 text-sm text-muted-foreground'>
									{noCandidatesMessage}
								</p>
							)}
						{candidates.length !== 0 &&
							visible.length === 0 &&
							(onlySelected && !search ? (
								<p className='p-4 text-center text-sm text-muted-foreground'>
									{t('common.noneSelectedYet')}
								</p>
							) : (
								<div className='flex flex-col items-center gap-2 p-4 text-center'>
									<p className='text-sm text-muted-foreground'>
										{t('common.noSearchMatch', {
											query: search
										})}
									</p>
									<Button
										type='button'
										variant='link'
										size='sm'
										className='h-auto p-0 text-xs'
										onClick={() => setSearch('')}
									>
										{t('common.clearSearch')}
									</Button>
								</div>
							))}

						{visible.length !== 0 && (
							<Label
								htmlFor='proposalTrooperCheckAll'
								className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
							>
								<Checkbox
									checked={
										picker.allVisibleSelected ||
										(picker.someVisibleSelected &&
											'indeterminate')
									}
									onCheckedChange={(value) =>
										picker.toggleAllVisible(!!value)
									}
									id='proposalTrooperCheckAll'
								/>
								{t('common.selectAll')}
								{visible.length !== candidates.length &&
									` ${t('common.shownCount', { count: visible.length })}`}
							</Label>
						)}
						{visible.map((s) => {
							const isSelected = picker.selectedIds.has(s.id)
							const override = picker.overrides.get(s.id)
							return (
								<div
									key={s.id}
									className='flex items-center gap-2 rounded-md p-2 hover:bg-muted'
								>
									<Label
										className='min-w-0 flex-1 gap-2'
										htmlFor={`trooperID-${s.id}`}
									>
										<Checkbox
											id={`trooperID-${s.id}`}
											checked={isSelected}
											onCheckedChange={() =>
												picker.toggle(s.id)
											}
										/>
										<span className='truncate text-sm'>
											{formatLabel(s)}
										</span>
									</Label>
									{isSelected && canCustomize && (
										<TrooperOverridePopover
											name={formatLabel(s)}
											summary={
												override
													? summarizeOverride(
															override
														)
													: undefined
											}
											customizeLabel={customizeLabel}
											useSharedLabel={useSharedLabel}
											onUseShared={() =>
												picker.setCustomized(
													s.id,
													false
												)
											}
										>
											{renderOverride(s, override)}
										</TrooperOverridePopover>
									)}
								</div>
							)
						})}

						{ineligible.length !== 0 && (
							<div className='mt-2 border-t pt-2'>
								<p className='px-2 pb-1 text-xs text-muted-foreground'>
									{t('common.ineligibleHeading', {
										count: ineligible.length
									})}
								</p>
								{ineligible.map((s) => (
									<div
										key={s.id}
										className='flex items-center gap-2 rounded-md p-2 text-muted-foreground'
									>
										<Checkbox disabled checked={false} />
										<span className='min-w-0 flex-1'>
											<span className='block truncate text-sm'>
												{formatLabel(s)}
											</span>
											{ineligibleReason?.(s) && (
												<span className='block text-xs'>
													{ineligibleReason(s)}
												</span>
											)}
										</span>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</>
			)}
		</div>
	)
}

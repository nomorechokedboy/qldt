import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Student } from '@/types'
import type { TrooperPicker } from './use-trooper-picker'

interface TrooperPickerListProps<TOverride extends object> {
	hasUnit: boolean
	// Everyone in the chosen unit's scope, versus the subset that may be picked.
	unitTroopers: Student[]
	candidates: Student[]
	picker: TrooperPicker<TOverride>
	// Shown when the unit has troopers but none of them may be picked.
	noCandidatesMessage?: string
	formatLabel?: (student: Student) => string
	// Whether a selected trooper may switch to values of their own.
	canCustomize?: boolean
	customizeLabel: string
	useSharedLabel: string
	// The editor for a customised trooper's own values.
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
	noCandidatesMessage,
	formatLabel = (s) => s.fullName ?? '',
	canCustomize = true,
	customizeLabel,
	useSharedLabel,
	renderOverride
}: TrooperPickerListProps<TOverride>) {
	const { t } = useTranslation('proposals')
	const { visible, search, setSearch } = picker

	return (
		<div className='flex min-h-0 flex-1 flex-col space-y-2'>
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
						<div className='relative'>
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
					)}
					<ScrollArea className='min-h-32 flex-1 rounded-md border p-2'>
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
						{candidates.length !== 0 && visible.length === 0 && (
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
						)}

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
							const hasOverride = picker.overrides.has(s.id)
							return (
								<div
									key={s.id}
									className='rounded-md p-2 hover:bg-muted'
								>
									<Label
										className='flex items-center gap-2'
										htmlFor={`trooperID-${s.id}`}
									>
										<Checkbox
											id={`trooperID-${s.id}`}
											checked={isSelected}
											onCheckedChange={() =>
												picker.toggle(s.id)
											}
										/>
										<span className='flex-1 text-sm'>
											{formatLabel(s)}
										</span>
										{isSelected && canCustomize && (
											<Button
												type='button'
												variant='link'
												size='sm'
												className='h-auto p-0 text-xs'
												onClick={() =>
													picker.setCustomized(
														s.id,
														!hasOverride
													)
												}
											>
												{hasOverride
													? useSharedLabel
													: customizeLabel}
											</Button>
										)}
									</Label>
									{isSelected &&
										hasOverride &&
										renderOverride(
											s,
											picker.overrides.get(s.id)
										)}
								</div>
							)
						})}
					</ScrollArea>
				</>
			)}
		</div>
	)
}

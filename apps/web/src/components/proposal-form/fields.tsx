import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import UnitSelect from '@/components/unit/select'
import type { UnitOption } from '@/lib/unit-options'
import ProposalDateField from './date-field'

// The header fields every proposal form shares. Each owns its label and
// wording, so a form only wires up its value.

export function UnitField({
	options,
	value,
	onValueChange
}: {
	options: UnitOption[]
	value: string
	onValueChange: (value: string) => void
}) {
	const { t } = useTranslation('proposals')

	return (
		<div className='space-y-2'>
			<Label>{t('common.unit')}</Label>
			<UnitSelect
				options={options}
				value={value}
				onValueChange={onValueChange}
			/>
		</div>
	)
}

// The people who may approve for the chosen unit, so nothing can be picked
// until a unit is.
export function ApproverField({
	value,
	onValueChange,
	hasUnit,
	approvers
}: {
	value: string
	onValueChange: (value: string) => void
	hasUnit: boolean
	approvers: { id: number; displayName: string }[] | undefined
}) {
	const { t } = useTranslation('proposals')
	const list = approvers ?? []

	return (
		<div className='space-y-2'>
			<Label>{t('common.approver')}</Label>
			<Select
				value={value}
				onValueChange={onValueChange}
				disabled={!hasUnit}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder={t('common.pickApprover')} />
				</SelectTrigger>
				<SelectContent>
					{list.map((u) => (
						<SelectItem key={u.id} value={String(u.id)}>
							{u.displayName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<p className='text-xs text-muted-foreground'>
				{!hasUnit
					? t('common.approverNeedsUnit')
					: list.length === 0
						? t('common.approverNone')
						: t('common.approverHint')}
			</p>
		</div>
	)
}

export function EffectiveDateField({
	value,
	onChange
}: {
	value: string | undefined
	onChange: (value: string | undefined) => void
}) {
	const { t } = useTranslation('proposals')

	return (
		<div className='space-y-2'>
			<Label>{t('common.effectiveDate')}</Label>
			<ProposalDateField
				value={value}
				onChange={onChange}
				placeholder={t('common.pickEffectiveDate')}
			/>
		</div>
	)
}

export function NoteField({
	value,
	onChange
}: {
	value: string
	onChange: (value: string) => void
}) {
	const { t } = useTranslation('proposals')

	return (
		<div className='space-y-2'>
			<Label>{t('common.noteOptional')}</Label>
			<Textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	)
}

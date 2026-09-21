import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	changePeriodKind,
	type PeriodKind,
	type StatsPeriod
} from '@/lib/stats-period'

const YEARS_BACK = 5
const periodKinds: PeriodKind[] = ['month', 'quarter', 'year']

interface Props {
	value: StatsPeriod
	onChange: (period: StatsPeriod) => void
}

export default function StatsPeriodSelector({ value, onChange }: Props) {
	const { t } = useTranslation('units')
	const thisYear = dayjs().year()
	// A shared link can point outside the usual window; keep that year in the
	// list so the select shows it rather than an empty value.
	const years = Array.from(
		new Set([
			...Array.from({ length: YEARS_BACK + 1 }, (_, i) => thisYear - i),
			value.year
		])
	).sort((a, b) => b - a)
	const indexes =
		value.kind === 'month'
			? Array.from({ length: 12 }, (_, i) => i + 1)
			: value.kind === 'quarter'
				? [1, 2, 3, 4]
				: []

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<Tabs
				value={value.kind}
				onValueChange={(kind) =>
					onChange(changePeriodKind(value, kind as PeriodKind))
				}
			>
				<TabsList>
					{periodKinds.map((kind) => (
						<TabsTrigger key={kind} value={kind}>
							{t(`dashboard.period.${kind}`)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{indexes.length > 0 && (
				<Select
					value={String(value.index)}
					onValueChange={(index) =>
						onChange({ ...value, index: Number(index) })
					}
				>
					<SelectTrigger
						className='w-32'
						aria-label={t('dashboard.period.periodLabel')}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{indexes.map((index) => (
							<SelectItem key={index} value={String(index)}>
								{t(`dashboard.period.${value.kind}`)} {index}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			<Select
				value={String(value.year)}
				onValueChange={(year) =>
					onChange({ ...value, year: Number(year) })
				}
			>
				<SelectTrigger
					className='w-28'
					aria-label={t('dashboard.period.yearLabel')}
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{years.map((year) => (
						<SelectItem key={year} value={String(year)}>
							{year}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PositionForm from '@/components/position-form'
import { buildPositionColumns } from '@/components/position-table/columns'
import { DataTable } from '@/components/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { levelsUpToRoot, unitLevelLabels } from '@/data/unit-levels'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import usePositionsData from '@/hooks/usePositionsData'
import useUnitOptions from '@/hooks/useUnitOptions'
import type { UnitLevel } from '@/types'

// Tabs follow the system's root unit: its own level and every level below
// it. Level values are what the API stores; labels come from the unit
// level catalog.
export default function PositionCatalog() {
	const { t } = useTranslation('admin')
	const { units, isLoading } = useUnitOptions()
	const [selected, setSelected] = useState<UnitLevel>()

	const rootUnit = units.find((u) => !u.parent)
	const levels = levelsUpToRoot(rootUnit?.level)
	// The chosen tab may fall outside the levels once the root is known, so
	// fall back to the largest level that exists (battalion when the root is
	// higher, which is where the page used to open).
	const level =
		selected && levels.includes(selected)
			? selected
			: levels.includes('battalion')
				? 'battalion'
				: levels[levels.length - 1]

	return (
		<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>
					{t('positions.title')}
				</h2>
			</div>
			{!isLoading && (
				<Tabs
					value={level}
					onValueChange={(value) => setSelected(value as UnitLevel)}
				>
					<TabsList>
						{levels.map((l) => (
							<TabsTrigger key={l} value={l}>
								{unitLevelLabels[l]}
							</TabsTrigger>
						))}
					</TabsList>
					{levels.map((l) => (
						<TabsContent key={l} value={l}>
							<PositionLevelTable level={l} />
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	)
}

function PositionLevelTable({ level }: { level: string }) {
	const { t } = useTranslation('admin')
	const { data: positions, refetch } = usePositionsData(
		{ level },
		{ enabled: true }
	)
	const { createSearchConfig } = useDataTableToolbarConfig()

	const searchConfig = [
		createSearchConfig('name', t('positions.searchPlaceholder'))
	]

	const sorted = [...(positions ?? [])].sort(
		(a, b) => a.priority - b.priority
	)

	return (
		<DataTable
			placeholder={t('positions.empty')}
			columns={buildPositionColumns(() => refetch())}
			data={sorted}
			onRefresh={() => refetch()}
			toolbarProps={{
				rightSection: (
					<PositionForm level={level} onSuccess={() => refetch()} />
				),
				searchConfig
			}}
		/>
	)
}

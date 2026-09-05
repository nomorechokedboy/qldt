import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import PositionForm from '@/components/position-form'
import { buildPositionColumns } from '@/components/position-table/columns'
import { DataTable } from '@/components/data-table'
import usePositionsData from '@/hooks/usePositionsData'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/chuc-vu')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<PositionCatalog />
		</ProtectedRoute>
	)
}

const LEVELS = [
	{ value: 'squad', label: 'Tiểu đội' },
	{ value: 'platoon', label: 'Trung đội' },
	{ value: 'company', label: 'Đại đội' },
	{ value: 'battalion', label: 'Tiểu đoàn' },
	{ value: 'regiment', label: 'Trung đoàn' },
	{ value: 'brigade', label: 'Lữ đoàn' },
	{ value: 'division', label: 'Sư đoàn' }
] as const

function PositionCatalog() {
	const [level, setLevel] = useState<string>('battalion')

	return (
		<div className='hidden h-full flex-1 flex-col space-y-8 p-8 md:flex'>
			<div className='flex items-center justify-between space-y-2'>
				<h2 className='text-2xl font-bold tracking-tight'>Chức vụ</h2>
			</div>
			<Tabs value={level} onValueChange={setLevel}>
				<TabsList>
					{LEVELS.map((l) => (
						<TabsTrigger key={l.value} value={l.value}>
							{l.label}
						</TabsTrigger>
					))}
				</TabsList>
				{LEVELS.map((l) => (
					<TabsContent key={l.value} value={l.value}>
						<PositionLevelTable level={l.value} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	)
}

function PositionLevelTable({ level }: { level: string }) {
	const { data: positions, refetch } = usePositionsData(
		{ level },
		{ enabled: true }
	)
	const { createSearchConfig } = useDataTableToolbarConfig()

	const searchConfig = [
		createSearchConfig('name', 'Tìm kiếm theo tên chức vụ...')
	]

	const sorted = [...(positions ?? [])].sort(
		(a, b) => a.priority - b.priority
	)

	return (
		<DataTable
			placeholder='Chưa có chức vụ nào'
			columns={buildPositionColumns(() => refetch())}
			data={sorted}
			toolbarProps={{
				rightSection: (
					<PositionForm level={level} onSuccess={() => refetch()} />
				),
				searchConfig
			}}
		/>
	)
}

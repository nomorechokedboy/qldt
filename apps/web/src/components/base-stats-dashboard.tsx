import {
	Building2,
	DoorOpen,
	Package,
	Shield,
	Target,
	Users
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	XAxis,
	YAxis
} from 'recharts'
import { Route } from '@/routes/thong-ke-doanh-trai'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent
} from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TableSkeleton from '@/components/table-skeleton'
import UnitRollupTables from '@/components/unit-rollup-tables'
import useAuth from '@/hooks/useAuth'
import useUnitStats from '@/hooks/useUnitStats'
import useProvinces from '@/hooks/useProvinces'
import {
	COLORS as POLITICS_CHART_COLORS,
	PieChartCard,
	politicalOrgNameMapping
} from '@/components/politics-quality-report/charts-section'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import UnitSelect from '@/components/unit/select'
import useUnitOptions from '@/hooks/useUnitOptions'
import { materialAssetStatusLabels } from '@/data/material-categories'
import { GetPoliticsQualityReport } from '@/api'
import { transformPoliticsQualityData } from '@/lib/utils'
import type { units } from '@/api/client'

const TROOP_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function BaseStatsDashboard() {
	const navigate = useNavigate({ from: Route.fullPath })
	const { unit: unitIdParam } = Route.useSearch()
	const { user } = useAuth()
	const {
		units,
		unitsById,
		options: unitOptions,
		isLoading: isLoadingUnits
	} = useUnitOptions({ minLevel: 'platoon' })

	const rootUnit = units.find((u) => !u.parent)
	const selectedUnitId = unitIdParam ?? user?.unit?.id ?? rootUnit?.id

	const { data: stats, isLoading: isLoadingStats } =
		useUnitStats(selectedUnitId)

	const selectedUnit = units.find((u) => u.id === selectedUnitId)
	const { data: politicsQualityData, isLoading: isLoadingPoliticsQuality } =
		useQuery({
			enabled: selectedUnit !== undefined,
			queryKey: ['politics-quality-report', selectedUnit?.id],
			queryFn: () => GetPoliticsQualityReport([selectedUnit!.id])
		})
	const transformedData = transformPoliticsQualityData(politicsQualityData)
	const politicsReport = transformedData[0]?.politicsQualityReport

	const { data: provinces = [] } = useProvinces()
	const provinceNameMap: Record<string, string> = {
		unknown: 'Chưa xác định',
		...Object.fromEntries(provinces.map((p) => [p.code, p.nameWithType]))
	}

	const showRollupTabs = stats !== undefined && stats.unit.level !== 'squad'

	if (isLoadingUnits) {
		return <TableSkeleton />
	}

	const handleUnitChange = (id: string) => {
		navigate({ search: (prev) => ({ ...prev, unit: Number(id) }) })
	}

	const kpiCards = [
		{
			label: 'Tổng quân số',
			value: stats?.totalStudents ?? 0,
			icon: Users,
			color: 'text-blue-600',
			valueColor: 'text-foreground'
		},
		{
			label: 'Nhà/khu nhà',
			value: stats?.buildingsCount ?? 0,
			icon: Building2,
			color: 'text-green-600',
			valueColor: 'text-foreground'
		},
		{
			label: 'Phòng',
			value: stats?.roomsCount ?? 0,
			icon: DoorOpen,
			color: 'text-amber-600',
			valueColor: 'text-foreground'
		}
	]

	const troopSummaryCards = [
		{
			label: 'SQ',
			value: stats?.troopSummary.sq ?? 0,
			color: TROOP_CHART_COLORS[0]
		},
		{
			label: 'QNCN',
			value: stats?.troopSummary.qncn ?? 0,
			color: TROOP_CHART_COLORS[1]
		},
		{
			label: 'HSQ',
			value: stats?.troopSummary.hsq ?? 0,
			color: TROOP_CHART_COLORS[2]
		},
		{
			label: 'CS (BS)',
			value: stats?.troopSummary.bs ?? 0,
			color: TROOP_CHART_COLORS[3]
		}
	]
	const troopChartData = troopSummaryCards.filter(({ value }) => value > 0)

	const unitCountChartData = unitLevelOrder
		.filter((level) => stats?.unitCounts[level] !== undefined)
		.map((level, idx) => ({
			level,
			label: unitLevelLabels[level],
			value: stats?.unitCounts[level] ?? 0,
			color: TROOP_CHART_COLORS[idx % TROOP_CHART_COLORS.length]
		}))

	const buildPoliticsPieData = (
		record: Record<string, number> | undefined,
		labelMap?: Record<string, string>
	) =>
		Object.entries(record ?? {}).map(([name, value], idx) => ({
			name: labelMap?.[name] ?? name,
			value,
			color: POLITICS_CHART_COLORS[idx % POLITICS_CHART_COLORS.length]
		}))

	const ethnicData = buildPoliticsPieData(politicsReport?.ethnic)
	const religionData = buildPoliticsPieData(politicsReport?.religion)
	const educationData = buildPoliticsPieData(politicsReport?.educationLevel)
	const politicalOrgData = buildPoliticsPieData(
		politicsReport?.politicalOrg,
		politicalOrgNameMapping
	)
	const originPlaceData = buildPoliticsPieData(
		politicsReport?.birthPlaceProvince,
		provinceNameMap
	)
	const hasPoliticsData =
		ethnicData.length > 0 ||
		religionData.length > 0 ||
		educationData.length > 0 ||
		politicalOrgData.length > 0 ||
		originPlaceData.length > 0

	const overviewContent = stats !== undefined && (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				{kpiCards.map(
					({ label, value, icon: Icon, color, valueColor }) => (
						<Card key={label}>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									{label}
								</CardTitle>
								<Icon className={`h-5 w-5 ${color}`} />
							</CardHeader>
							<CardContent>
								<div
									className={`text-2xl font-bold ${valueColor}`}
								>
									{value}
								</div>
								<p className='text-xs text-muted-foreground'>
									{stats.unit.name}
									{' và đơn vị trực thuộc'}
								</p>
							</CardContent>
						</Card>
					)
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='h-5 w-5' />
						Cơ cấu đơn vị trực thuộc
					</CardTitle>
				</CardHeader>
				<CardContent>
					{unitCountChartData.length === 0 ? (
						<p className='text-muted-foreground'>
							Đơn vị này không có đơn vị trực thuộc nào.
						</p>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
							<ChartContainer
								config={{
									value: { label: 'Số lượng' }
								}}
								className='h-[260px] w-full'
							>
								<ResponsiveContainer width='100%' height='100%'>
									<BarChart data={unitCountChartData}>
										<CartesianGrid strokeDasharray='3 3' />
										<XAxis
											dataKey='label'
											interval={0}
											tick={{ fontSize: 11 }}
											angle={
												unitCountChartData.length > 4
													? -30
													: 0
											}
											textAnchor={
												unitCountChartData.length > 4
													? 'end'
													: 'middle'
											}
											height={
												unitCountChartData.length > 4
													? 50
													: 30
											}
										/>
										<YAxis
											allowDecimals={false}
											width={32}
										/>
										<ChartTooltip
											content={<ChartTooltipContent />}
										/>
										<Bar
											dataKey='value'
											radius={[4, 4, 0, 0]}
										>
											{unitCountChartData.map((entry) => (
												<Cell
													key={entry.level}
													fill={entry.color}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</ChartContainer>

							<div className='grid grid-cols-2 gap-3 content-start max-h-[260px] overflow-y-auto pr-1'>
								{unitCountChartData.map(
									({ level, label, value, color }) => (
										<div
											key={level}
											className='rounded-lg border p-3 text-center'
										>
											<div
												className='text-xl font-bold'
												style={{ color }}
											>
												{value}
											</div>
											<div className='text-xs text-muted-foreground'>
												{label}
											</div>
										</div>
									)
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						Cơ cấu quân số
					</CardTitle>
				</CardHeader>
				<CardContent>
					{troopChartData.length === 0 ? (
						<p className='text-muted-foreground'>
							Chưa có dữ liệu quân số.
						</p>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
							<ChartContainer
								config={{
									value: { label: 'Số lượng' }
								}}
								className='h-[260px] w-full'
							>
								<ResponsiveContainer width='100%' height='100%'>
									<PieChart>
										<Pie
											data={troopChartData}
											cx='50%'
											cy='50%'
											labelLine={false}
											label={({ name, percent }) =>
												`${name} ${(percent * 100).toFixed(0)}%`
											}
											outerRadius={80}
											dataKey='value'
											nameKey='label'
										>
											{troopChartData.map((entry) => (
												<Cell
													key={entry.label}
													fill={entry.color}
												/>
											))}
										</Pie>
										<ChartTooltip
											content={<ChartTooltipContent />}
										/>
									</PieChart>
								</ResponsiveContainer>
							</ChartContainer>

							<div className='grid grid-cols-2 gap-4'>
								{troopSummaryCards.map(
									({ label, value, color }) => (
										<div
											key={label}
											className='rounded-lg border p-4 text-center'
										>
											<div
												className='text-2xl font-bold'
												style={{ color }}
											>
												{value}
											</div>
											<div className='text-xs text-muted-foreground'>
												{label}
											</div>
										</div>
									)
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Target className='h-5 w-5' />
						Thống kê quân số
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingPoliticsQuality ? (
						<TableSkeleton />
					) : !hasPoliticsData ? (
						<p className='text-muted-foreground'>
							Chưa có dữ liệu thống kê quân số.
						</p>
					) : (
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
							<PieChartCard
								data={educationData}
								title='Trình độ văn hóa'
							/>
							<PieChartCard data={ethnicData} title='Dân tộc' />
							<PieChartCard
								data={religionData}
								title='Tôn giáo'
							/>
							<PieChartCard
								data={politicalOrgData}
								title='Đoàn/Đảng'
							/>
							<PieChartCard
								data={originPlaceData}
								title='Quê quán (Tỉnh/Thành)'
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Package className='h-5 w-5' />
							Vật tư sinh hoạt
						</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.materialStockSummary.length === 0 ? (
							<p className='text-muted-foreground'>
								Chưa có vật tư sinh hoạt nào.
							</p>
						) : (
							<ul className='space-y-2'>
								{stats.materialStockSummary.map((item) => (
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Shield className='h-5 w-5' />
							Vũ khí/trang bị
						</CardTitle>
					</CardHeader>
					<CardContent>
						{stats.materialAssetSummary.length === 0 ? (
							<p className='text-muted-foreground'>
								Chưa có vũ khí/trang bị nào.
							</p>
						) : (
							<ul className='space-y-2'>
								{stats.materialAssetSummary.map((item) => (
									<li
										key={item.status}
										className='flex items-center justify-between border-b pb-2 last:border-0'
									>
										<span>
											{materialAssetStatusLabels[
												item.status
											] ?? item.status}
										</span>
										<span className='font-semibold'>
											{item.count}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)

	return (
		<div className='container mx-auto p-6 space-y-6'>
			<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>
						Thống kê đơn vị
					</h2>
					<p className='text-muted-foreground'>
						Tổng hợp quân số, cơ sở vật chất và vũ khí/trang bị của
						đơn vị và toàn bộ đơn vị trực thuộc.
					</p>
				</div>

				<UnitSelect
					options={unitOptions}
					value={
						selectedUnitId === undefined
							? undefined
							: String(selectedUnitId)
					}
					onValueChange={handleUnitChange}
					className='md:w-[280px]'
				/>
			</div>

			{selectedUnitId === undefined && (
				<p className='text-muted-foreground'>
					Bạn chưa được phân công đơn vị nào để xem thống kê.
				</p>
			)}

			{selectedUnitId !== undefined && isLoadingStats && (
				<TableSkeleton />
			)}

			{stats !== undefined &&
				(showRollupTabs ? (
					<Tabs defaultValue='overview'>
						<TabsList>
							<TabsTrigger value='overview'>
								Tổng quan
							</TabsTrigger>
							<TabsTrigger value='details'>Chi tiết</TabsTrigger>
						</TabsList>

						<TabsContent value='overview'>
							{overviewContent}
						</TabsContent>

						<TabsContent value='details'>
							<UnitRollupTables
								unitId={stats.unit.id}
								unit={selectedUnit}
								unitsById={unitsById}
							/>
						</TabsContent>
					</Tabs>
				) : (
					overviewContent
				))}
		</div>
	)
}

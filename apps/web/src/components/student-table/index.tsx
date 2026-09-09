import { EduLevelOptions } from '@/components/data-table/data/data'
import { EhtnicOptions } from '@/data/ethnicities'
import useActionColumn from '@/hooks/useActionColumn'
import useDataTableToolbarConfig from '@/hooks/useDataTableToolbarConfig'
import {
	type FacetedFilterConfig,
	type Student,
	type TemplType,
	type UnitLevel,
	defaultStudentColumnVisibility
} from '@/types'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { ArrowDownToLine, RefreshCw, Settings, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { DataTable } from '../data-table'
import { ExportStudentDataDialog } from '../export-student-data-dialog'
import { ExportStudentDataDynamicDialog } from '../export-student-data-dynamic-dialog'
import { ExportTemplateManager } from '../export-template-manager'
import { ExportUnitRosterExtractDialog } from '../export-unit-roster-extract-dialog'
import { ImportStudentsDialog } from '../import-students-dialog'
import StudentForm from '../student-form'
import TableSkeleton from '../table-skeleton'
import { Button } from '../ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { columnsWithoutAction } from './columns'

interface StudentTableProps {
	// Data. The caller owns the fetch (useStudentData, useUnitTroopersData,
	// etc.) so there is exactly one source of truth for what's on screen.
	data: Student[]
	isLoading?: boolean
	refetch: () => Promise<QueryObserverResult<Student[], unknown>>

	// Columns and filters. Defaults reproduce the plain single-table pages
	// (rank/previousUnit/ethnic/educationLevel/status facets, no action column).
	columns?: ColumnDef<Student>[]
	facetedFilters?: Array<FacetedFilterConfig>

	// Simple export: filename + templType opens ExportStudentDataDialog.
	filename?: string
	templType?: TemplType

	// Rich export: exportConfig opens the template-manager dropdown with
	// file export and (when unitRoster is set) roster export. Takes
	// precedence over the simple filename/templType export.
	exportConfig?: {
		filename: string
		disabled?: boolean
		defaultExportValues?: {
			underUnitName?: string
			unitName?: string
		}
		unitRoster?: { alias: string; level: UnitLevel }
	}

	// UI configuration
	enableCreation?: boolean
	showRefreshButton?: boolean
	columnVisibility?: VisibilityState
	placeholder?: string
	leftSection?: ReactNode

	// Custom toolbar sections
	leftToolbarSection?: ReactNode
	rightToolbarSection?: ReactNode

	// Event handlers
	onRefresh?: () => void
	onCreateSuccess?: () => void
	onDeleteRows?: (
		ids: number[]
	) => Promise<QueryObserverResult<Student[], unknown>>
	onConfirmRows?: (
		ids: number[],
		status: 'pending' | 'confirmed'
	) => Promise<QueryObserverResult<Student[], unknown>>
}

export default function StudentTable({
	data,
	isLoading = false,
	refetch,
	columns,
	facetedFilters,
	filename,
	templType = 'StudentInfoTempl',
	exportConfig,
	enableCreation = false,
	showRefreshButton = false,
	columnVisibility = defaultStudentColumnVisibility,
	placeholder,
	leftSection,
	leftToolbarSection,
	rightToolbarSection,
	onRefresh,
	onCreateSuccess,
	onDeleteRows,
	onConfirmRows
}: StudentTableProps) {
	const { createFacetedFilter } = useDataTableToolbarConfig()
	const actionColumn = useActionColumn(handleRefreshStudents)
	const [exportFileOpen, setExportFileOpen] = useState(false)
	const [exportRosterOpen, setExportRosterOpen] = useState(false)
	const [importOpen, setImportOpen] = useState(false)

	if (isLoading) {
		return <TableSkeleton />
	}

	const handleFormSuccess = () => {
		refetch()
		onCreateSuccess?.()
	}

	const handleImportSuccess = () => {
		refetch()
		onCreateSuccess?.()
	}

	const handleRefresh = () => {
		refetch()
		onRefresh?.()
	}

	function handleRefreshStudents() {
		return refetch()
	}

	// Callers that don't need custom columns get the plain data set with no
	// row-actions column. Callers that supply their own columns keep full
	// control; we only append the action column when they haven't already
	// included one, so a caller-provided actions column is never duplicated.
	const resolvedColumns = columns ?? columnsWithoutAction
	const hasActionsColumn = resolvedColumns.some((c) => c.id === 'actions')
	const finalColumns = hasActionsColumn
		? resolvedColumns
		: [...resolvedColumns, actionColumn]

	// Callers that don't need custom filters get the same default facets
	// the plain single-table pages have always shown.
	let resolvedFacetedFilters = facetedFilters
	if (resolvedFacetedFilters === undefined) {
		const militaryRankSet = new Set(
			data.filter((s) => !!s.rank).map((s) => s.rank as string)
		)
		const militaryRankOptions = Array.from(militaryRankSet).map((rank) => ({
			label: rank,
			value: rank
		}))

		const previousUnitSet = new Set(
			data
				.filter((s) => !!s.previousUnit)
				.map((s) => s.previousUnit as string)
		)
		const previousUnitOptions = Array.from(previousUnitSet).map((pu) => ({
			label: pu,
			value: pu
		}))

		const statusOptions = [
			{ label: 'Chưa xác nhận', value: 'pending' },
			{ label: 'Đã xác nhận', value: 'confirmed' }
		]

		resolvedFacetedFilters = [
			createFacetedFilter('rank', 'Cấp bậc', militaryRankOptions),
			createFacetedFilter(
				'previousUnit',
				'Đơn vị cũ',
				previousUnitOptions
			),
			createFacetedFilter('ethnic', 'Dân tộc', EhtnicOptions),
			createFacetedFilter(
				'educationLevel',
				'Trình độ học vấn',
				EduLevelOptions
			),
			createFacetedFilter('status', 'Trạng thái', statusOptions)
		]
	}

	// Build right toolbar section
	const rightSection = (
		<>
			{leftToolbarSection}
			{enableCreation && <StudentForm onSuccess={handleFormSuccess} />}
			{enableCreation && (
				<Button variant='outline' onClick={() => setImportOpen(true)}>
					<Upload />
					Import danh sách
				</Button>
			)}
			{showRefreshButton && (
				<Button onClick={handleRefresh}>
					<RefreshCw />
				</Button>
			)}
			{rightToolbarSection}
		</>
	)

	return (
		<div>
			{enableCreation && (
				<ImportStudentsDialog
					isOpen={importOpen}
					onClose={() => setImportOpen(false)}
					onSuccess={handleImportSuccess}
				/>
			)}
			<DataTable
				data={data}
				columns={finalColumns}
				defaultColumnVisibility={columnVisibility}
				placeholder={placeholder}
				toolbarProps={{
					leftSection,
					rightSection,
					facetedFilters: resolvedFacetedFilters
				}}
				onDeleteRows={onDeleteRows}
				onConfirmRows={onConfirmRows}
				getRowId={(originalRow) => {
					return originalRow.id.toString()
				}}
				withDynamicColsData={false}
				renderToolbarActions={
					exportConfig?.disabled === true
						? undefined
						: ({ exportHook }) => {
								if (exportConfig) {
									return (
										<>
											<ExportTemplateManager resourceType='students'>
												<Button variant='outline'>
													<Settings />
													Quản lý mẫu
												</Button>
											</ExportTemplateManager>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button>
														<ArrowDownToLine />
														Xuất dữ liệu
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													<DropdownMenuItem
														onSelect={() =>
															setExportRosterOpen(
																true
															)
														}
													>
														Xuất danh sách biên chế
													</DropdownMenuItem>
													<DropdownMenuItem
														onSelect={() =>
															setExportFileOpen(
																true
															)
														}
													>
														Xuất file
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
											<ExportStudentDataDynamicDialog
												open={exportFileOpen}
												onOpenChange={setExportFileOpen}
												data={
													exportHook.exportableData
														.data as unknown as Student[]
												}
												defaultFilename={
													exportConfig.filename
												}
												defaultValues={
													exportConfig.defaultExportValues
												}
											/>
											{exportConfig.unitRoster && (
												<ExportUnitRosterExtractDialog
													open={exportRosterOpen}
													onOpenChange={
														setExportRosterOpen
													}
													unitAlias={
														exportConfig.unitRoster
															.alias
													}
													unitLevel={
														exportConfig.unitRoster
															.level
													}
													defaultFilename={`bien-che-${exportConfig.filename}`}
													defaultValues={
														exportConfig.defaultExportValues
													}
												/>
											)}
										</>
									)
								}

								if (filename !== undefined) {
									return (
										<ExportStudentDataDialog
											data={
												exportHook.exportableData.data
											}
											defaultFilename={filename}
											templType={templType}
										>
											<Button>
												<ArrowDownToLine />
												Xuất file
											</Button>
										</ExportStudentDataDialog>
									)
								}

								return null
							}
				}
			/>
		</div>
	)
}

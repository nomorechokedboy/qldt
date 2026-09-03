import useActionColumn from '@/hooks/useActionColumn'
import useStudentData from '@/hooks/useStudents'
import {
	type FacetedFilterConfig,
	type Student,
	type StudentQueryParams,
	type TemplType,
	defaultStudentColumnVisibility
} from '@/types'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { ArrowDownToLine, RefreshCw, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { DataTable } from '../data-table'
import { ExportStudentDataDynamicDialog } from '../export-student-data-dynamic-dialog'
import { ExportTemplateManager } from '../export-template-manager'
import { ExportUnitRosterExtractDialog } from '../export-unit-roster-extract-dialog'
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
	// Core data params
	params: StudentQueryParams

	// Required: Columns and filters from parent
	columns: ColumnDef<Student>[]
	facetedFilters?: Array<FacetedFilterConfig>

	// Export configuration
	exportConfig?: {
		filename: string
		disabled?: boolean
		defaultExportValues?: {
			underUnitName?: string
			unitName?: string
		}
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
	templType?: TemplType
}

export default function StudentTable({
	params,
	columns,
	facetedFilters = [],
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
	const {
		data: students = [],
		isLoading: isLoadingStudents,
		refetch: refetchStudent
	} = useStudentData(params)
	const actionColumn = useActionColumn(handleRefreshStudents)
	const [exportFileOpen, setExportFileOpen] = useState(false)
	const [exportRosterOpen, setExportRosterOpen] = useState(false)

	if (isLoadingStudents) {
		return <TableSkeleton />
	}

	const handleFormSuccess = () => {
		refetchStudent()
		onCreateSuccess?.()
	}

	const handleRefresh = () => {
		refetchStudent()
		onRefresh?.()
	}

	function handleRefreshStudents() {
		return refetchStudent()
	}

	// Build right toolbar section
	const rightSection = (
		<>
			{leftToolbarSection}
			{enableCreation && <StudentForm onSuccess={handleFormSuccess} />}
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
			<DataTable
				data={students}
				columns={[...columnsWithoutAction, actionColumn]}
				defaultColumnVisibility={columnVisibility}
				placeholder={placeholder}
				toolbarProps={{
					leftSection,
					rightSection,
					facetedFilters
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
						: ({ exportHook }) =>
								exportConfig ? (
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
														setExportFileOpen(true)
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
										{params.unitAlias !== undefined &&
											params.unitLevel !== undefined && (
												<ExportUnitRosterExtractDialog
													open={exportRosterOpen}
													onOpenChange={
														setExportRosterOpen
													}
													unitAlias={params.unitAlias}
													unitLevel={params.unitLevel}
													defaultFilename={`bien-che-${exportConfig.filename}`}
													defaultValues={
														exportConfig.defaultExportValues
													}
												/>
											)}
									</>
								) : null
				}
			/>
		</div>
	)
}

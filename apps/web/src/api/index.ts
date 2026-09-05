import { appFetcher } from '@/lib/axios'
import { ApiUrl } from '@/lib/const'
import {
	type AppNotification,
	type AppNotificationQuery,
	type AssignRoleRequest,
	type DeleteStudentsBody,
	type ExportData,
	type ExportMaterialAssetsData,
	type ExportMaterialStocksData,
	type ExportPoliticsQualityReport,
	type ExportResourceType,
	type ExportStudentDataDynamicData,
	type ExportUnitRosterExtractData,
	type GetUnitQuery,
	type GetUserRolesResponse,
	type InitAdminRequest,
	type InitRootUnitBody,
	type IsInitRootUnitResponse,
	type MarkAsReadNotificationParams,
	Permission,
	Role,
	type Student,
	type StudentBody,
	type Unit,
	type UnitBody,
	type UnitLevel,
	type UpdateRoleBody,
	type UpdateStudentsBody,
	type UpdateUnitBody,
	type UpdateUserBody,
	type UserBody
} from '@/types'
import Client, {
	type audit_logs,
	type auth,
	type export_templates,
	type facilities,
	type materials,
	type positions,
	type students,
	type transfer_requests,
	type units
} from './client'

export const requestClient = new Client(ApiUrl, {
	fetcher: appFetcher
})

export function CreateStudent(body: StudentBody) {
	return requestClient.students
		.CreateStudent(body ?? {})
		.then((resp) => resp.data)
}

// export function CreateStudent, body: StudentBody[])
export function CreateStudents(body: StudentBody[]) {
	return requestClient.students
		.CreateStudents({ data: body ?? [] })
		.then((resp) => resp.data)
}

export function GetStudents(
	params?: students.GetStudentsQuery
): Promise<Student[]> {
	return requestClient.students
		.GetStudents(params ?? {})
		.then((resp) => resp.data.map((s) => ({ ...s }) as unknown as Student))
}

export function DeleteStudents(params: DeleteStudentsBody) {
	return requestClient.students.DeleteStudents(params).then((resp) => resp)
}

export function UpdateStudents(params: UpdateStudentsBody) {
	return requestClient.students.UpdateStudents(params).then((resp) => resp)
}

export function UpdateStudentStatus(studentIds: number[]) {
	return requestClient.students
		.updateStudentStatus({ studentIds, status: 'confirmed' })
		.then((resp) => resp)
}

export function GetNotifications(
	params?: AppNotificationQuery
): Promise<AppNotification[]> {
	return requestClient.notifications
		.GetNotifications({ page: params?.page, pageSize: params?.pageSize })
		.then((resp) => resp.data)
}

export function MarkAsRead(params: MarkAsReadNotificationParams) {
	return requestClient.notifications.MarkAsRead(params)
}

export function GetStudentByLevel(level: UnitLevel): Promise<Unit[]> {
	return requestClient.students
		.GetStudents({ unitLevel: level })
		.then((resp) => resp.data)
}

export function GetUnits(params?: GetUnitQuery) {
	return requestClient.units.GetUnits(params ?? {}).then((resp) => resp.data)
}

export function CreateUnit(body: UnitBody) {
	return requestClient.units
		.CreateUnit({ data: [body] })
		.then((resp) => resp.data)
}

export function IsInitRootUnit(): Promise<IsInitRootUnitResponse> {
	return requestClient.units.IsInitRootUnit().then((resp) => ({
		initialized: resp.data,
		rootUnitId: resp.rootUnitId
	}))
}

export function InitRootUnit(body: InitRootUnitBody) {
	return requestClient.units.InitRootUnit(body).then((resp) => resp.data)
}

export function DeleteUnits(ids: number[]) {
	return requestClient.units.DeleteUnits({ ids }).then((resp) => resp)
}

export function UpdateUnits(body: UpdateUnitBody) {
	return requestClient.units.UpdateUnits(body).then((resp) => resp)
}

export function GetUnit({
	alias,
	...params
}: units.GetUnitRequest & { alias: string }) {
	return requestClient.units.GetUnit(alias, params).then((resp) => resp.data)
}

export function GetUnitStats(alias: string) {
	return requestClient.units.GetUnitStats(alias)
}

export function GetUnitStatsStudents(alias: string) {
	return requestClient.units
		.GetUnitStatsStudents(alias)
		.then((resp) => resp.data)
}

export function GetUnitStatsMaterialStocks(alias: string) {
	return requestClient.units
		.GetUnitStatsMaterialStocks(alias)
		.then((resp) => resp.data)
}

export function GetUnitStatsMaterialAssets(alias: string) {
	return requestClient.units
		.GetUnitStatsMaterialAssets(alias)
		.then((resp) => resp.data)
}

export function GetUnreadNotificationsCount(): Promise<number> {
	return requestClient.notifications
		.GetUnreadCount()
		.then((resp) => resp.data.count)
}

export function ExportTableData(data: ExportData) {
	return requestClient.students.ExportStudentData(
		'POST',
		JSON.stringify(data)
	)
}

export function ExportPoliticsQualityData(data: ExportPoliticsQualityReport) {
	return requestClient.students.ExportPoliticsQualityReport(
		'POST',
		JSON.stringify(data)
	)
}

export function GetPoliticsQualityReport(unitIds: number[]) {
	return requestClient.students.GetPoliticsQualityReport({ unitIds })
}

export function CreateUser(body: UserBody) {
	return requestClient.users.CreateUser(body).then((resp) => resp.data)
}

export function UpdateUser(body: UpdateUserBody) {
	return requestClient.users.UpdateUser(body).then((resp) => resp.data)
}

export function Login(req: auth.LoginRequest) {
	return requestClient.auth.Login(req)
}

export function RefreshToken(token: string) {
	return requestClient.auth.RefreshToken({ token })
}

export function DeleteUsers(ids: number[]) {
	return requestClient.users.DeleteUsers({ ids })
}

export function GetUserInfo() {
	return requestClient.auth.GetUserInfo().then((resp) => ({
		...resp.data,
		permissions: resp.permissions,
		isSuperAdmin: resp.isSuperAdmin
	}))
}

export function ChangePassword(params: {
	prevPassword: string
	password: string
}) {
	return requestClient.auth.ChangeUserPassword(params)
}

export function UnlockLogin(username: string) {
	return requestClient.auth.UnlockLogin({ username })
}

export function GetLockedLoginUsernames() {
	return requestClient.auth
		.GetLockedLoginUsernames()
		.then((resp) => resp.usernames)
}

export function GetUsers() {
	return requestClient.users.GetUsers().then((resp) => resp.data)
}

export function UploadFiles(body: BodyInit) {
	return requestClient.media
		.UploadFiles('POST', body)
		.then((resp) => resp.json() as Promise<{ data: { uris: string[] } }>)
		.then((resp) => resp.data)
}

export function IsInitAdmin() {
	return requestClient.users.IsInitAdmin().then((resp) => resp.data)
}

export function ExportMaterialAssets(data: ExportMaterialAssetsData) {
	return requestClient.materials.ExportMaterialAssets(
		'POST',
		JSON.stringify(data)
	)
}

export function ExportMaterialStocks(data: ExportMaterialStocksData) {
	return requestClient.materials.ExportMaterialStocks(
		'POST',
		JSON.stringify(data)
	)
}

export function ExportStudentDataDynamic(data: ExportStudentDataDynamicData) {
	return requestClient.students.ExportStudentDataDynamic(
		'POST',
		JSON.stringify(data)
	)
}

export function ExportUnitRosterExtract(data: ExportUnitRosterExtractData) {
	return requestClient.students.ExportUnitRosterExtract(
		'POST',
		JSON.stringify(data)
	)
}

export function ListExportTemplates(resourceType: ExportResourceType) {
	return requestClient.export_templates
		.GetExportTemplates({ resourceType })
		.then((resp) => resp.data)
}

export function UploadExportTemplate(body: BodyInit) {
	return requestClient.export_templates
		.UploadExportTemplate('POST', body)
		.then(
			(resp) =>
				resp.json() as Promise<{
					data: export_templates.ExportTemplateResponse
				}>
		)
		.then((resp) => resp.data)
}

export function DeleteExportTemplate(id: number) {
	return requestClient.export_templates.DeleteExportTemplate(id)
}

export function DownloadExampleExportTemplate(
	resourceType?: ExportResourceType
) {
	return requestClient.export_templates.DownloadExampleExportTemplate(
		resourceType
	)
}

export function InitAdmin(req: InitAdminRequest) {
	return requestClient.users.InitAdmin(req)
}

export function GetRoles() {
	return requestClient.roles
		.GetRoles()
		.then((resp) => resp.data)
		.then((roles) => roles.map(Role.From))
}

export function CreateRole(body: {
	name: string
	description?: string
	permissionIds?: number[]
}) {
	return requestClient.roles.CreateRole(body)
}

export function DeleteRole(ids: number[]) {
	return requestClient.roles.DeleteRoles({ ids })
}

export function UpdateRole({
	permissionIds,
	description,
	id,
	name
}: UpdateRoleBody) {
	return requestClient.roles.UpdateRole(id, {
		name,
		description,
		permissionIds
	})
}

export function GetPermissions() {
	return requestClient.permissions
		.GetPermissions()
		.then((resp) => resp.data)
		.then((perms) => perms.map(Permission.From))
}

export function CreatePermission(body: {
	actionId: number
	resourceId: number
}) {
	return requestClient.permissions.CreatePermission(body)
}

export function AssignRolesToUser(body: AssignRoleRequest) {
	return requestClient.user_roles.AssignRolesToUser(body)
}

export function GetUserRoles(userId: number) {
	return requestClient.user_roles.GetUserRoles(userId)
}

// Buildings

export function GetBuildings() {
	return requestClient.facilities.GetBuildings().then((resp) => resp.data)
}

export function CreateBuilding(body: facilities.BuildingBody) {
	return requestClient.facilities
		.CreateBuilding({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdateBuildings(body: facilities.UpdateBuildingBody) {
	return requestClient.facilities.UpdateBuildings(body)
}

export function DeleteBuildings(ids: number[]) {
	return requestClient.facilities.DeleteBuildings({ ids })
}

// Rooms

export function GetAuditLogs(params?: audit_logs.GetAuditLogsQuery) {
	return requestClient.audit_logs.GetAuditLogs(params ?? {})
}

export function GetRooms(params?: facilities.GetRoomsQuery) {
	return requestClient.facilities
		.GetRooms(params ?? {})
		.then((resp) => resp.data)
}

export function CreateRoom(body: facilities.RoomBody) {
	return requestClient.facilities
		.CreateRoom({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdateRooms(body: facilities.UpdateRoomBody) {
	return requestClient.facilities.UpdateRooms(body)
}

export function DeleteRooms(ids: number[]) {
	return requestClient.facilities.DeleteRooms({ ids })
}

// Material types

export function GetMaterialTypes() {
	return requestClient.materials
		.GetMaterialTypes({})
		.then((resp) => resp.data)
}

export function CreateMaterialType(body: materials.MaterialTypeBody) {
	return requestClient.materials
		.CreateMaterialType({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdateMaterialTypes(body: materials.UpdateMaterialTypeBody) {
	return requestClient.materials.UpdateMaterialTypes(body)
}

export function DeleteMaterialTypes(ids: number[]) {
	return requestClient.materials.DeleteMaterialTypes({ ids })
}

// Positions

export function GetPositions(params?: positions.GetPositionsQuery) {
	return requestClient.positions
		.GetPositions(params ?? {})
		.then((resp) => resp.data)
}

export function CreatePosition(body: positions.PositionBody) {
	return requestClient.positions
		.CreatePositions({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdatePositions(body: positions.UpdatePositionBody) {
	return requestClient.positions.UpdatePositions(body)
}

export function DeletePositions(ids: number[]) {
	return requestClient.positions.DeletePositions({ ids })
}

// Material stocks

export function GetMaterialStocks(params?: materials.GetMaterialStocksQuery) {
	return requestClient.materials
		.GetMaterialStocks(params ?? {})
		.then((resp) => resp.data)
}

export function AddMaterialStock(body: materials.MaterialStockBody) {
	return requestClient.materials
		.AddMaterialStock({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdateMaterialStocks(
	data: materials.UpdateMaterialStockBody['data']
) {
	return requestClient.materials.UpdateMaterialStocks({ data })
}

export function DeleteMaterialStocks(ids: number[]) {
	return requestClient.materials.DeleteMaterialStocks({ ids })
}

// Material assets

export function GetMaterialAssets(params?: materials.GetMaterialAssetsQuery) {
	return requestClient.materials
		.GetMaterialAssets(params ?? {})
		.then((resp) => resp.data)
}

export function CreateMaterialAsset(body: materials.MaterialAssetBody) {
	return requestClient.materials
		.CreateMaterialAsset({ data: [body] })
		.then((resp) => resp.data)
}

export function UpdateMaterialAssets(
	data: materials.UpdateMaterialAssetBody['data']
) {
	return requestClient.materials.UpdateMaterialAssets({ data })
}

export function DeleteMaterialAssets(ids: number[]) {
	return requestClient.materials.DeleteMaterialAssets({ ids })
}

export function GetMaterialAssetEvents(assetId: number) {
	return requestClient.materials
		.GetMaterialAssetEvents(assetId)
		.then((resp) => resp.data)
}

// Transfer requests

export function GetTransferRequests(
	params?: transfer_requests.GetTransferRequestsQuery
) {
	return requestClient.transfer_requests
		.GetTransferRequests(params ?? {})
		.then((resp) => resp.data)
}

export function GetTransferDestinationUnits() {
	return requestClient.transfer_requests
		.GetTransferDestinationUnits()
		.then((resp) => resp.data)
}

export function GetTransferEligibleApprovers(
	params: transfer_requests.GetTransferEligibleApproversQuery
) {
	return requestClient.transfer_requests
		.GetTransferEligibleApprovers(params)
		.then((resp) => resp.data)
}

export function GetTransferRequest(id: number) {
	return requestClient.transfer_requests
		.GetTransferRequest(id)
		.then((resp) => resp.data)
}

export function CreateTransferRequest(
	body: transfer_requests.CreateTransferRequestBody
) {
	return requestClient.transfer_requests
		.CreateTransferRequest(body)
		.then((resp) => resp.data)
}

export function ApproveTransferRequest(id: number) {
	return requestClient.transfer_requests
		.ApproveTransferRequest(id)
		.then((resp) => resp.data)
}

export function RejectTransferRequest(id: number, reason: string) {
	return requestClient.transfer_requests
		.RejectTransferRequest(id, { reason })
		.then((resp) => resp.data)
}

export function CancelTransferRequest(id: number) {
	return requestClient.transfer_requests
		.CancelTransferRequest(id)
		.then((resp) => resp.data)
}

export function ExportTransferRequestHandover(id: number) {
	return requestClient.transfer_requests.ExportTransferRequestHandover(
		'GET',
		String(id)
	)
}

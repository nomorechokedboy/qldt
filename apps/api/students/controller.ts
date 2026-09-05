import { AppError } from '../errors'
import {
	StudentDB,
	StudentParam,
	Student,
	UpdateStudentMap,
	Month,
	Quarter,
	StudentCronJobEvent,
	BirthdayThisWeek,
	BirthdayThisMonth,
	CpvOfficialThisMonth,
	CpvOfficialThisQuarter,
	CpvOfficialThisWeek,
	BirthdayThisQuarter,
	StudentCronEvent,
	ExcelTemplateData,
	TemplateType
} from '../schema/student'
import { Repository } from './index'
import { Repository as UnitRepository } from '../units'
import studentRepo from './repo'
import {
	ExportStudentDataDynamicRequest,
	ExportStudentDataRequest,
	ExportUnitRosterExtractRequest,
	GetStudentsQuery
} from './students'
import {
	deriveColumns,
	normalizeRawForDocx,
	normalizeRowForDocx
} from '../export/docx-utils'
import {
	buildRosterRows,
	buildRosterSummary,
	RosterPosition,
	RosterStudent,
	RosterUnitNode
} from '../export/roster-utils'
import exportTemplateController from '../export-templates/controller'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import positionRepo from '../positions/repo'
import { UnitLevelName } from '../schema/units'
import log from 'encore.dev/log'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js'
import path from 'path'
import { createReport } from 'docx-templates'
import { APIError } from 'encore.dev/api'
import { readFile } from 'fs/promises'
import { createImageInjector, ImageProvider } from './img-provider'
import { ObjectStorageImageAdapter } from './minio-img-provider'
import { getAuthData } from '~encore/auth'

dayjs.extend(quarterOfYear)

export class Controller {
	private templateMap: Record<TemplateType, string> = {
		CpvTempl: 'cpv-templ.docx',
		HcyuTempl: 'hcyu-templ.docx',
		StudentInfoTempl: 'student-info-templ.docx',
		StudentWithAdversityTempl: 'student-with-adversity-templ.docx',
		StudentEnrollmentFormTempl: 'student-enrollment-form-templ.docx'
	}

	constructor(
		private readonly repo: Repository,
		private readonly unitRepo: UnitRepository,
		private readonly imageStorage: ImageProvider
	) {}

	// Trung đội trưởng ('bt', priority 0) and the various Tiểu/khẩu đội
	// trưởng codes (priority 1-2) are one-of-a-kind roles: a platoon has
	// exactly one commander, and each squad has exactly one leader. Regular
	// soldier positions (priority 3+) have no such limit. Both are scoped by
	// unitId - a squad is itself a unit, so no separate scope is needed.
	private async validateUniqueLeaderPositions(
		entries: Array<{
			id?: number
			position?: string | null
			unitId?: number | null
		}>,
		existingById?: Map<number, Student>
	): Promise<void> {
		const changing = entries.filter(
			(e) => e.position !== undefined && e.position !== null
		)
		if (changing.length === 0) return

		const normalizeCode = (code: string) => code.trim().toLowerCase()

		const platoonPositions = await positionRepo.find({ level: 'platoon' })
		const leaderPositionsByCode = new Map(
			platoonPositions
				.filter((p) => p.priority <= 2)
				.map((p) => [normalizeCode(p.code), p])
		)

		type ScopedEntry = (typeof changing)[number] & {
			scopeId: number
			positionName: string
		}
		const scoped: ScopedEntry[] = []

		for (const e of changing) {
			const leaderPos = leaderPositionsByCode.get(
				normalizeCode(e.position!)
			)
			if (leaderPos === undefined) continue

			const existing =
				e.id !== undefined ? existingById?.get(e.id) : undefined
			const unitId =
				e.unitId !== undefined ? e.unitId : existing?.unit?.id

			if (unitId != null) {
				scoped.push({
					...e,
					scopeId: unitId,
					positionName: leaderPos.name
				})
			}
		}
		if (scoped.length === 0) return

		// Conflicts within this same batch.
		const seen = new Map<string, ScopedEntry>()
		for (const e of scoped) {
			const key = `${e.scopeId}:${normalizeCode(e.position!)}`
			if (seen.has(key)) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`${e.positionName} chỉ được chỉ định cho một quân nhân duy nhất`
					)
				)
			}
			seen.set(key, e)
		}

		// Conflicts against existing DB state.
		const unitIds = Array.from(new Set(scoped.map((e) => e.scopeId)))
		const holders =
			unitIds.length > 0 ? await this.repo.find({ unitIds }) : []

		for (const e of scoped) {
			const conflict = holders.find(
				(s) =>
					s.id !== e.id &&
					s.position != null &&
					normalizeCode(s.position) === normalizeCode(e.position!) &&
					s.unit?.id === e.scopeId
			)
			if (conflict !== undefined) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`${e.positionName} đã được chỉ định cho quân nhân khác: ${conflict.fullName}`
					)
				)
			}
		}
	}

	// `position` is a derived, read-only mirror of the selected positionId's
	// `code` (see schema/student.ts) - callers only ever submit positionId,
	// never free-form position text. Deriving `code` (not `name`) keeps this
	// compatible with the existing code-based matching in
	// validateUniqueLeaderPositions and roster-utils.ts's export sorting.
	private async resolvePositionText<
		T extends { positionId?: number | null; position?: string | null }
	>(entries: T[]): Promise<void> {
		const ids = Array.from(
			new Set(
				entries
					.map((e) => e.positionId)
					.filter(
						(id): id is number => id !== undefined && id !== null
					)
			)
		)
		if (ids.length === 0) return

		const found = await positionRepo.find({ ids })
		const byId = new Map(found.map((p) => [p.id, p]))

		for (const e of entries) {
			if (e.positionId === undefined || e.positionId === null) continue

			const position = byId.get(e.positionId)
			if (position === undefined) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						`positionId ${e.positionId} không tồn tại`
					)
				)
			}
			e.position = position.code
		}
	}

	async create(
		params: StudentParam[],
		unitIds: number[]
	): Promise<StudentDB[]> {
		const hasUnit = params.every(
			(p) => p.unitId !== undefined && p.unitId !== null
		)
		if (hasUnit === false) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('A student must belong to a unitId')
			)
		}

		const checkUnitIds = params.every((p) => unitIds.includes(p.unitId!))
		if (checkUnitIds === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'You are not authorized create with this unitId'
				)
			)
		}

		await this.resolvePositionText(params)
		await this.validateUniqueLeaderPositions(params)

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async delete(studentsTodelete: StudentDB[], validUnitIds: number[]) {
		const ids = studentsTodelete.map((student) => student.id)
		const students = await this.repo.find({ ids })
		const hasPermission = students.every((student) =>
			validUnitIds.includes(student.unit!.id)
		)
		if (!hasPermission) {
			throw AppError.handleAppErr(
				AppError.permissionDenied(
					"You don't have permission Delete student!"
				)
			)
		}

		return this.repo.delete(studentsTodelete).catch(AppError.handleAppErr)
	}

	async find(
		{ unitAlias, unitLevel, ...q }: GetStudentsQuery,
		validUnitIds: number[]
	): Promise<Student[]> {
		const isUnitAliasExist = unitAlias !== undefined
		const isUnitLevelExist = unitLevel !== undefined
		const isUnitQueryParamsValid = isUnitAliasExist && isUnitLevelExist

		if (
			(isUnitAliasExist && !isUnitLevelExist) ||
			(!isUnitAliasExist && isUnitLevelExist)
		) {
			throw AppError.invalidArgument('missing unitAlias or unitLevel')
		}

		if (isUnitQueryParamsValid) {
			const u = await this.unitRepo
				.findOne({ alias: unitAlias, level: unitLevel })
				.catch(AppError.handleAppErr)
			if (u === undefined) {
				throw AppError.handleAppErr(
					AppError.notFound(
						`unit with alias: ${unitAlias} and level: ${unitLevel} not found`
					)
				)
			}

			const unitIds = await unitStatsRepo.findDescendantUnitIds(u.id)
			log.trace('studentRepo.find unit case ids', {
				unitIds,
				query: q
			})

			const isAuthorized = unitIds.every((id) =>
				validUnitIds.includes(id)
			)

			if (isAuthorized === false) {
				AppError.handleAppErr(
					AppError.unauthorized(
						"You don't have permission to read one of those studentId"
					)
				)
			}

			return this.repo
				.find({ ...q, unitIds })
				.catch(AppError.handleAppErr)
		}

		return this.repo
			.find({
				...q,
				unitIds: validUnitIds.length !== 0 ? validUnitIds : undefined
			})
			.catch(AppError.handleAppErr)
	}

	async update(
		params: StudentDB[],
		validUnitIds: number[]
	): Promise<StudentDB[]> {
		const ids = params.map((s) => s.id)
		const isIdsEmpty = ids.length === 0
		const isIdsValid = !ids || isIdsEmpty
		if (isIdsValid) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No record IDs provided')
			)
		}
		// unitId is only present in the payload when the caller is
		// (re)assigning the student's unit; an update that leaves it
		// untouched is authorized by the existing record instead.
		const existingById = new Map(
			(await this.repo.find({ ids })).map((s) => [s.id, s])
		)
		const checkOwnership = params.every((p) => {
			if (p.unitId !== undefined && p.unitId !== null) {
				return validUnitIds.includes(p.unitId)
			}

			const existing = existingById.get(p.id)
			if (existing === undefined) {
				return false
			}
			return validUnitIds.includes(existing.unit!.id)
		})
		if (checkOwnership === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission update this student"
				)
			)
		}

		await this.resolvePositionText(params)
		await this.validateUniqueLeaderPositions(params, existingById)

		const updateMap: UpdateStudentMap = params.map(
			({ id, ...updatePayload }) => {
				const cleanupPayload = Object.fromEntries(
					Object.entries(updatePayload).filter(
						([_, value]) => value !== undefined
					)
				)

				const isUpdatePayloadEmpty =
					Object.keys(cleanupPayload).length === 0
				if (isUpdatePayloadEmpty) {
					throw AppError.handleAppErr(
						AppError.invalidArgument(
							`No update data provided At least one field must be provided to update record with id: ${id}`
						)
					)
				}

				return { id, updatePayload: cleanupPayload }
			}
		)
		return this.repo.update(updateMap).catch(AppError.handleAppErr)
	}

	async updateStatus(
		ids: number[],
		status: 'pending' | 'confirmed',
		validUnitIds: number[]
	): Promise<StudentDB[]> {
		log.info('StudentController.updateStatus params: ', {
			ids,
			status,
			validUnitIds
		})

		if (!ids || ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No student IDs provided')
			)
		}

		// get students to check their unitIds
		const students = await this.repo
			.find({ ids })
			.catch(AppError.handleAppErr)

		if (students.length === 0) {
			throw AppError.handleAppErr(
				AppError.notFound('No students found with provided IDs')
			)
		}

		// auth check
		const checkUnitIds = students.every((student) =>
			validUnitIds.includes(student.unit!.id)
		)

		if (!checkUnitIds) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission to update status of these students"
				)
			)
		}

		// update status
		return this.repo.updateStatus(ids, status).catch(AppError.handleAppErr)
	}

	getStudentsByCronEvent(params: {
		event: StudentCronEvent
	}): Promise<Array<Student>> {
		let cronEvent: StudentCronJobEvent
		const thisMonth = dayjs().format('MM') as Month
		const thisQuarter = `Q${dayjs().quarter()}` as Quarter

		switch (params.event) {
			case 'birthdayThisWeek':
				cronEvent = new BirthdayThisWeek()
				break
			case 'birthdayThisMonth':
				cronEvent = new BirthdayThisMonth(thisMonth)
				break
			case 'birthdayThisQuarter':
				cronEvent = new BirthdayThisQuarter(thisQuarter)
				break
			case 'cpvOfficialThisWeek':
				cronEvent = new CpvOfficialThisWeek()
				break
			case 'cpvOfficialThisMonth':
				cronEvent = new CpvOfficialThisMonth(thisMonth)
				break
			case 'cpvOfficialThisQuarter':
				cronEvent = new CpvOfficialThisQuarter(thisQuarter)
				break
			default:
				throw AppError.handleAppErr(
					AppError.invalidArgument(`Invalid event: ${params.event}`)
				)
		}

		return this.repo.find(cronEvent.getQueryParams())
	}

	async politicsQualityReport(unitIds: number[], validUnitIds: number[]) {
		const isValidUnitIds = unitIds.every((unitId) =>
			validUnitIds.includes(unitId)
		)
		if (isValidUnitIds === false) {
			AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission on those unitIds"
				)
			)
		}

		const units = await this.unitRepo.find({
			ids: unitIds
		})
		if (units.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Invalid unitIds')
			)
		}

		const descendantIdsPerUnit = await Promise.all(
			units.map((u) => unitStatsRepo.findDescendantUnitIds(u.id))
		)
		const descendantUnits = await this.unitRepo.findByIds(
			Array.from(new Set(descendantIdsPerUnit.flat()))
		)
		const squadIds = descendantUnits
			.filter((u) => u.level === 'squad')
			.map((u) => u.id)

		const educationLevelMap = {
			'7/12': 'Cấp II',
			'8/12': 'Cấp II',
			'9/12': 'Cấp II',
			'10/12': 'Cấp III',
			'11/12': 'Cấp III',
			'12/12': 'Cấp III',
			'Cao đẳng': 'TC-CĐ-ĐH',
			'Đại học': 'TC-CĐ-ĐH',
			'Trung cấp': 'TC-CĐ-ĐH',
			'Sau đại học': 'Sau ĐH'
		}
		const data: Record<number, Record<string, any>> = {}
		const rows = await this.repo.politicsQualityReport(squadIds)
		for (const { count, value, unitId, category } of rows) {
			if (!data[unitId]) {
				data[unitId] = {}
			}

			if (category === 'unitId') {
				data[unitId].total = count
			} else {
				if (!data[unitId][category]) {
					data[unitId][category] = {}
				}

				const educationLevelMapKey = String(
					value
				) as keyof typeof educationLevelMap

				if (educationLevelMap[educationLevelMapKey] !== undefined) {
					const valueLabel = educationLevelMap[educationLevelMapKey]
					if (
						data[unitId][category][valueLabel] === undefined ||
						data[unitId][category][valueLabel] === null
					) {
						data[unitId][category][valueLabel] = 0
					}

					data[unitId][category][valueLabel] += count
				} else {
					data[unitId][category][String(value)] = count
				}
			}
		}

		return { data, units }
	}

	getTemplate(templateType: TemplateType): Promise<Buffer> {
		if (this.templateMap[templateType] === undefined || '') {
			throw AppError.invalidArgument('Invalid template file')
		}

		const templateFile = this.templateMap[templateType]
		const templatePath = path.join('./templates', templateFile)
		return readFile(templatePath)
	}

	async handleExportStudentData(
		req: ExportStudentDataRequest
	): Promise<Uint8Array> {
		try {
			log.info('ExportStudentData starting')
			const {
				city,
				data,
				date,
				underUnitName,
				unitName,
				commanderPosition,
				commanderName,
				commanderRank,
				templateType
			} = req

			// Prepare rows data
			const rows: Record<string, any>[] = data.map((student, idx) => {
				Object.keys(student).forEach((col) => {
					let cellValue = student[col]

					if (cellValue === null || cellValue === undefined) {
						cellValue = ''
					} else if (typeof cellValue === 'boolean') {
						cellValue = cellValue ? 'Có' : 'Không'
					} else if (Array.isArray(cellValue)) {
						cellValue =
							cellValue.length > 0 ? cellValue.join(', ') : ''
					} else {
						cellValue = String(cellValue)
					}

					return cellValue
				})

				if (templateType === 'CpvTempl') {
					const ethnic = student['ethnic']
					const isKinh = ethnic === 'Kinh'
					const isTay = ethnic === 'Tày'
					const isNung = ethnic === 'Nùng '
					if (isKinh || isTay || isNung) {
						student['ethnic'] = 'Không'
					}
				}

				return { idx: ++idx, ...student }
			})

			const dateObj = dayjs(date)
			const day = dateObj.format('DD')
			const month = dateObj.format('MM')
			const year = dateObj.year()

			const templateData: ExcelTemplateData = {
				city,
				commanderName,
				commanderPosition,
				commanderRank,
				day,
				month,
				rows,
				underUnitName,
				unitName,
				year
			}

			const template = await this.getTemplate(templateType!)

			let templData: any = {}
			if (templateType === 'StudentEnrollmentFormTempl') {
				const stu = rows.at(0)
				if (stu === undefined) {
					AppError.handleAppErr(
						AppError.invalidArgument('Student data is empty')
					)
				}

				const leafUnitId: number | undefined = stu.unit?.id
				if (leafUnitId === undefined) {
					AppError.handleAppErr(
						AppError.internal('Student has no unit assigned')
					)
				}

				// Nearest-first ancestor chain, e.g. [squad, platoon, company,
				// battalion] - always shown in full, root included.
				const chain = await this.unitRepo
					.findAncestorChain(leafUnitId)
					.catch(AppError.handleAppErr)
				stu.donVi = chain
					.map((u) => u.name)
					.reverse()
					.join(', ')

				const { rows: _, ...templateDataWithoutRows } = templateData
				templData = {
					stu,
					unit: {
						name: unitName,
						parentName: underUnitName
					},
					...templateDataWithoutRows
				}
			} else {
				templData = { ...templateData }
			}

			// Get the student's avatar key from storage
			// Assuming the avatar key is stored in the student data
			const studentAvatarKey = rows[0]?.avatar || 'default-avatar.png'

			// Generate the report with image from object storage
			const buffer = await createReport({
				template,
				data: templData,
				cmdDelimiter: ['{', '}'],
				additionalJsContext: {
					// Use the image injector with object storage
					injectAvt: createImageInjector(
						studentAvatarKey,
						this.imageStorage,
						{ width: 3, height: 4 }
					)
				}
			})

			return buffer
		} catch (err) {
			console.error('handleExportStudentData error', err)
			log.error('handleExportStudentData error', { err })

			throw APIError.internal('Internal error for exporting file')
		}
	}

	async handleExportStudentDataDynamic(
		req: ExportStudentDataDynamicRequest
	): Promise<Uint8Array> {
		try {
			log.info('ExportStudentDataDynamic starting')
			const {
				city,
				commanderName,
				commanderPosition,
				commanderRank,
				data,
				rawData,
				date,
				reportTitle,
				underUnitName,
				unitName,
				templateId
			} = req

			const rows = data.map(normalizeRowForDocx)
			const columns = deriveColumns(rows)
			// Raw, unflattened records for custom templates that need nested
			// {FOR} loops (e.g. childrenInfos/siblings) instead of the
			// flattened rows/columns table, which only supports one string
			// value per cell.
			const troopers = (rawData ?? []).map(normalizeRawForDocx)

			const dateObj = dayjs(date)
			const day = dateObj.format('DD')
			const month = dateObj.format('MM')
			const year = dateObj.year()

			const template =
				templateId !== undefined
					? await exportTemplateController.getTemplateFile(templateId)
					: await readFile(
							path.join(
								'./templates',
								'dynamic-docx-template.docx'
							)
						)

			return await createReport({
				template,
				data: {
					city,
					commanderName,
					commanderPosition,
					commanderRank,
					columns,
					day,
					month,
					reportTitle,
					rows,
					troopers,
					year,
					underUnitName,
					unitName
				},
				cmdDelimiter: ['{', '}']
			})
		} catch (err) {
			console.error('handleExportStudentDataDynamic error', err)
			log.error('handleExportStudentDataDynamic error', { err })

			throw APIError.internal('Internal error for exporting file')
		}
	}

	async handleExportUnitRosterExtract(
		req: ExportUnitRosterExtractRequest
	): Promise<Uint8Array> {
		try {
			log.info('ExportUnitRosterExtract starting')
			const {
				unitAlias,
				unitLevel,
				unitName,
				underUnitName,
				city,
				commanderName,
				commanderPosition,
				commanderRank,
				date,
				reportTitle
			} = req

			const rootUnit = await this.unitRepo.findOne({
				alias: unitAlias,
				level: unitLevel as UnitLevelName
			})
			if (rootUnit === undefined) {
				AppError.handleAppErr(
					AppError.notFound(
						`unit with alias: ${unitAlias} and level: ${unitLevel} not found`
					)
				)
			}

			const unitIds = await unitStatsRepo.findDescendantUnitIds(
				rootUnit.id
			)
			const unitList = await unitRepo.findByIds(unitIds)

			const students = await this.repo.find({ unitIds })

			const rosterUnits: RosterUnitNode[] = unitList.map((u) => ({
				id: u.id,
				name: u.name,
				parentId: u.parentId,
				level: u.level
			}))
			const rosterStudents: RosterStudent[] = students.map((s) => ({
				fullName: s.fullName ?? '',
				rank: s.rank ?? '',
				position: s.position ?? '',
				enlistmentPeriod: s.enlistmentPeriod ?? '',
				unitId: s.unit?.id
			}))

			const positionRows = await positionRepo.find({})
			const rosterPositions: RosterPosition[] = positionRows.map((p) => ({
				level: p.level,
				code: p.code,
				priority: p.priority
			}))

			const rows = buildRosterRows(
				{
					id: rootUnit.id,
					name: rootUnit.name,
					parentId: undefined,
					level: rootUnit.level
				},
				rosterUnits,
				rosterStudents,
				rosterPositions
			)
			const summary = buildRosterSummary(rosterStudents)

			const dateObj = dayjs(date)
			const day = dateObj.format('DD')
			const month = dateObj.format('MM')
			const year = dateObj.year()

			const template = await readFile(
				path.join('./templates', 'unit-roster-extract-templ.docx')
			)

			return await createReport({
				template,
				data: {
					unitName,
					underUnitName,
					city,
					day,
					month,
					year,
					reportTitle,
					total: summary.total,
					sq: summary.sq,
					qncn: summary.qncn,
					hsq: summary.hsq,
					bs: summary.bs,
					rows,
					commanderPosition,
					commanderRank,
					commanderName
				},
				cmdDelimiter: ['{', '}']
			})
		} catch (err) {
			console.error('handleExportUnitRosterExtract error', err)
			log.error('handleExportUnitRosterExtract error', { err })

			if (err instanceof AppError) {
				throw err
			}

			throw APIError.internal('Internal error for exporting file')
		}
	}
}

const studentController = new Controller(
	studentRepo,
	unitRepo,
	ObjectStorageImageAdapter
)

export default studentController

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
	RosterClassNode,
	RosterPosition,
	RosterStudent,
	RosterUnitNode
} from '../export/roster-utils'
import exportTemplateController from '../export-templates/controller'
import unitRepo from '../units/repo'
import unitStatsRepo from '../units/stats-repo'
import classRepo from '../classes/repo'
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
	// soldier positions (priority 3+) have no such limit. Scope is unitId
	// (the platoon) for the platoon commander, classId (the squad) for
	// squad leaders - mirrors students/controller.ts's classId-xor-unitId
	// ownership model.
	private async validateUniqueLeaderPositions(
		entries: Array<{
			id?: number
			position?: string | null
			unitId?: number | null
			classId?: number | null
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
			scopeType: 'unit' | 'class'
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
			const classId =
				e.classId !== undefined ? e.classId : existing?.class?.id

			if (leaderPos.priority === 0 && unitId != null) {
				scoped.push({
					...e,
					scopeType: 'unit',
					scopeId: unitId,
					positionName: leaderPos.name
				})
			} else if (leaderPos.priority > 0 && classId != null) {
				scoped.push({
					...e,
					scopeType: 'class',
					scopeId: classId,
					positionName: leaderPos.name
				})
			}
		}
		if (scoped.length === 0) return

		// Conflicts within this same batch.
		const seen = new Map<string, ScopedEntry>()
		for (const e of scoped) {
			const key = `${e.scopeType}:${e.scopeId}:${normalizeCode(e.position!)}`
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
		const unitIds = Array.from(
			new Set(
				scoped
					.filter((e) => e.scopeType === 'unit')
					.map((e) => e.scopeId)
			)
		)
		const classIds = Array.from(
			new Set(
				scoped
					.filter((e) => e.scopeType === 'class')
					.map((e) => e.scopeId)
			)
		)
		const [unitHolders, classHolders] = await Promise.all([
			unitIds.length > 0
				? this.repo.find({ unitIds })
				: Promise.resolve([]),
			classIds.length > 0
				? this.repo.find({ classIds })
				: Promise.resolve([])
		])
		const holders = [...unitHolders, ...classHolders]

		for (const e of scoped) {
			const conflict = holders.find(
				(s) =>
					s.id !== e.id &&
					s.position != null &&
					normalizeCode(s.position) === normalizeCode(e.position!) &&
					(e.scopeType === 'unit'
						? s.unit?.id === e.scopeId
						: s.class?.id === e.scopeId)
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

	async create(
		params: StudentParam[],
		classIds: number[],
		unitIds: number[]
	): Promise<StudentDB[]> {
		const hasExactlyOneOwner = params.every((p) => {
			const hasClass = p.classId !== undefined && p.classId !== null
			const hasUnit = p.unitId !== undefined && p.unitId !== null
			return hasClass !== hasUnit
		})
		if (hasExactlyOneOwner === false) {
			throw AppError.handleAppErr(
				AppError.invalidArgument(
					'A student must belong to exactly one of classId (squad) or unitId (platoon and above)'
				)
			)
		}

		const checkClassIds = params
			.filter((p) => p.classId !== undefined && p.classId !== null)
			.every((p) => classIds.includes(p.classId!))
		const checkUnitIds = params
			.filter((p) => p.unitId !== undefined && p.unitId !== null)
			.every((p) => unitIds.includes(p.unitId!))
		if (checkClassIds === false || checkUnitIds === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					'You are not authorized create with this classId or unitId'
				)
			)
		}

		const unitIdsInPayload = params
			.map((p) => p.unitId)
			.filter((id): id is number => id !== undefined && id !== null)
		if (unitIdsInPayload.length > 0) {
			const targetUnits = await this.unitRepo.findByIds(unitIdsInPayload)
			const hasSquadUnit = targetUnits.some((u) => u.level === 'squad')
			if (hasSquadUnit) {
				throw AppError.handleAppErr(
					AppError.invalidArgument(
						'unitId must reference a platoon-level unit or larger'
					)
				)
			}
		}

		await this.validateUniqueLeaderPositions(params)

		return this.repo.create(params).catch(AppError.handleAppErr)
	}

	async delete(
		studentsTodelete: StudentDB[],
		validClassIds: number[],
		validUnitIds: number[]
	) {
		const ids = studentsTodelete.map((student) => student.id)
		const students = await this.repo.find({ ids })
		const hasPermission = students.every((student) =>
			student.class !== null
				? validClassIds.includes(student.class.id)
				: validUnitIds.includes(student.unit!.id)
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
		{ unitAlias, unitLevel, classId, classIds, ...q }: GetStudentsQuery,
		validClassIds: number[],
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
			const classIds = await unitStatsRepo.classIdsForUnits(unitIds)
			log.trace('studentRepo.find unit case ids', {
				classIds,
				unitIds,
				query: q
			})

			const isAuthorized =
				classIds.every((id) => validClassIds.includes(id)) &&
				unitIds.every((id) => validUnitIds.includes(id))

			if (isAuthorized === false) {
				AppError.handleAppErr(
					AppError.unauthorized(
						"You don't have permission to read one of those studentId"
					)
				)
			}

			return this.repo
				.find({ ...q, classIds, unitIds })
				.catch(AppError.handleAppErr)
		}

		const cIds: number[] = []
		if (classIds !== undefined) {
			cIds.push(...classIds)
		}

		if (classId !== undefined) {
			cIds.push(classId)
		}
		if (cIds.length === 0) {
			cIds.push(...validClassIds)
		}

		return this.repo
			.find({
				...q,
				classIds: cIds.length !== 0 ? cIds : undefined,
				unitIds: validUnitIds.length !== 0 ? validUnitIds : undefined
			})
			.catch(AppError.handleAppErr)
	}

	async update(
		params: StudentDB[],
		validClassIds: number[],
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
		// classId/unitId are only present in the payload when the caller is
		// (re)assigning the student's unit; an update that leaves them
		// untouched is authorized by the existing record instead.
		const existingById = new Map(
			(await this.repo.find({ ids })).map((s) => [s.id, s])
		)
		const checkOwnership = params.every((p) => {
			if (p.classId !== undefined && p.classId !== null) {
				return validClassIds.includes(p.classId)
			}
			if (p.unitId !== undefined && p.unitId !== null) {
				return validUnitIds.includes(p.unitId)
			}

			const existing = existingById.get(p.id)
			if (existing === undefined) {
				return false
			}
			return existing.class !== null
				? validClassIds.includes(existing.class.id)
				: validUnitIds.includes(existing.unit!.id)
		})
		if (checkOwnership === false) {
			throw AppError.handleAppErr(
				AppError.unauthorized(
					"You don't have permission update this student"
				)
			)
		}

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
		validClassIds: number[],
		validUnitIds: number[]
	): Promise<StudentDB[]> {
		log.info('StudentController.updateStatus params: ', {
			ids,
			status,
			validClassIds,
			validUnitIds
		})

		if (!ids || ids.length === 0) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('No student IDs provided')
			)
		}

		// get students to check their classIds
		const students = await this.repo
			.find({ ids })
			.catch(AppError.handleAppErr)

		if (students.length === 0) {
			throw AppError.handleAppErr(
				AppError.notFound('No students found with provided IDs')
			)
		}

		// auth check
		const checkClassIds = students.every((student) =>
			student.class !== null
				? validClassIds.includes(student.class.id)
				: validUnitIds.includes(student.unit!.id)
		)

		if (!checkClassIds) {
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

		const classIds = units.flatMap((unit) => {
			if (unit.level === 'battalion') {
				return unit.children.flatMap((child) =>
					child.classes.map((c) => c.id)
				)
			}

			return unit.classes.map((c) => c.id)
		})

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
		const rows = await this.repo.politicsQualityReport(classIds)
		for (const { count, value, classId, category } of rows) {
			if (!data[classId]) {
				data[classId] = {}
			}

			if (category === 'classId') {
				data[classId].total = count
			} else {
				if (!data[classId][category]) {
					data[classId][category] = {}
				}

				const educationLevelMapKey = String(
					value
				) as keyof typeof educationLevelMap

				if (educationLevelMap[educationLevelMapKey] !== undefined) {
					const valueLabel = educationLevelMap[educationLevelMapKey]
					if (
						data[classId][category][valueLabel] === undefined ||
						data[classId][category][valueLabel] === null
					) {
						data[classId][category][valueLabel] = 0
					}

					data[classId][category][valueLabel] += count
				} else {
					data[classId][category][String(value)] = count
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
			if (templateType !== 'StudentEnrollmentFormTempl') {
				templData = { ...templateData }
			} else {
				const stu = rows.at(0)
				if (stu === undefined) {
					AppError.handleAppErr(
						AppError.invalidArgument('Student data is empty')
					)
				}

				const parentUnit = await this.unitRepo
					.getOne({ id: stu.class.unit.parentId })
					.catch(AppError.handleAppErr)

				const { rows: _, ...templateDataWithoutRows } = templateData
				templData = {
					stu,
					companyName: stu.class.unit.name,
					batalionName: parentUnit?.name,
					...templateDataWithoutRows
				}
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
					underUnitName,
					unitName,
					year
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
			const classList = await classRepo.find({ unitIds })
			const classIds = classList.map((c) => c.id)

			const students = await this.repo.find({ classIds, unitIds })

			const rosterUnits: RosterUnitNode[] = unitList.map((u) => ({
				id: u.id,
				name: u.name,
				parentId: u.parentId,
				level: u.level
			}))
			const rosterClasses: RosterClassNode[] = classList.map((c) => ({
				id: c.id,
				name: c.name,
				unitId: c.unitId
			}))
			const rosterStudents: RosterStudent[] = students.map((s) => ({
				fullName: s.fullName ?? '',
				rank: s.rank ?? '',
				position: s.position ?? '',
				enlistmentPeriod: s.enlistmentPeriod ?? '',
				unitId: s.unit?.id,
				classId: s.class?.id
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
				rosterClasses,
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

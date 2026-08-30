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
import { ExportStudentDataRequest, GetStudentsQuery } from './students'
import unitRepo from '../units/repo'
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

			if (u.level === 'battalion') {
				const companies = u.children
				const platoons = companies.flatMap((c) => c.children ?? [])
				const classIds = platoons.flatMap((p) =>
					p.classes.map((cl) => cl.id)
				)
				const unitIds = [
					u.id,
					...companies.map((c) => c.id),
					...platoons.map((p) => p.id)
				]
				log.trace('studentRepo.find battalion case ids', {
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

			if (u.level === 'company') {
				const platoons = u.children
				const classIds = platoons.flatMap((p) =>
					p.classes.map((cl) => cl.id)
				)
				const unitIds = [u.id, ...platoons.map((p) => p.id)]
				log.trace('studentRepo.find company case ids', {
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
}

const studentController = new Controller(
	studentRepo,
	unitRepo,
	ObjectStorageImageAdapter
)

export default studentController

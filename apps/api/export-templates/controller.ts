import log from 'encore.dev/log'
import { ExportTemplateRepository } from '.'
import { AppError } from '../errors'
import { MinIO } from '../objectStorage/minio'
import {
	ExportResourceType,
	ExportTemplateDB
} from '../schema/export-templates'
import exportTemplateRepo from './repo'

export interface UploadExportTemplateParams {
	name: string
	resourceType: ExportResourceType
	originalFilename: string
	fileBuffer: Buffer
	uploadedByUserId?: number
}

class controller {
	constructor(private readonly repo: ExportTemplateRepository) {}

	async upload(
		params: UploadExportTemplateParams
	): Promise<ExportTemplateDB> {
		log.trace('ExportTemplateController.upload params', {
			name: params.name,
			resourceType: params.resourceType,
			originalFilename: params.originalFilename
		})

		if (!params.originalFilename.toLowerCase().endsWith('.docx')) {
			throw AppError.handleAppErr(
				AppError.invalidArgument('Template file must be a .docx file')
			)
		}

		const s3Key = `export-templates/${params.resourceType}/${Date.now()}-${params.originalFilename}`

		await MinIO.PutObject({ Key: s3Key, Body: params.fileBuffer })

		return this.repo
			.create({
				name: params.name,
				resourceType: params.resourceType,
				s3Key,
				originalFilename: params.originalFilename,
				uploadedByUserId: params.uploadedByUserId
			})
			.catch(AppError.handleAppErr)
	}

	find(resourceType?: ExportResourceType): Promise<ExportTemplateDB[]> {
		log.trace('ExportTemplateController.find', { resourceType })

		return this.repo.find({ resourceType }).catch(AppError.handleAppErr)
	}

	async delete(id: number): Promise<ExportTemplateDB> {
		log.trace('ExportTemplateController.delete', { id })

		const existing = await this.repo.getOne(id)
		if (existing === undefined) {
			throw AppError.handleAppErr(
				AppError.notFound('Export template not found')
			)
		}

		await MinIO.DeleteObject({ Key: existing.s3Key })

		const deleted = await this.repo.delete(id).catch(AppError.handleAppErr)
		return deleted!
	}

	async getTemplateFile(id: number): Promise<Buffer> {
		const template = await this.repo.getOne(id)
		if (template === undefined) {
			throw AppError.handleAppErr(
				AppError.notFound('Export template not found')
			)
		}

		const obj = await MinIO.GetObject({ Key: template.s3Key })
		const chunks: Buffer[] = []
		for await (const chunk of obj.Body) {
			chunks.push(chunk as Buffer)
		}

		return Buffer.concat(chunks)
	}
}

const exportTemplateController = new controller(exportTemplateRepo)

export default exportTemplateController

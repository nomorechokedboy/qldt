import { readFile } from 'fs/promises'
import path from 'path'
import { api, Query } from 'encore.dev/api'
import log from 'encore.dev/log'
import { getAuthData } from '~encore/auth'
import { AppError } from '../errors'
import { setAuditContext } from '../middleware/audit'
import {
	ExportResourceType,
	exportResourceTypes
} from '../schema/export-templates'
import exportTemplateController from './controller'
import { parseUploadTemplateForm } from './file-parser'

export interface ExportTemplateResponse {
	id: number
	name: string
	resourceType: ExportResourceType
	originalFilename: string
	createdAt: string
}

export const UploadExportTemplate = api.raw(
	{ auth: true, expose: true, method: 'POST', path: '/export-templates' },
	async (req, res) => {
		try {
			const authData = getAuthData()!
			const form = await parseUploadTemplateForm(req, req.headers)

			if (
				!exportResourceTypes.includes(
					form.resourceType as ExportResourceType
				)
			) {
				throw AppError.invalidArgument(
					`resourceType must be one of ${exportResourceTypes.join(', ')}`
				)
			}

			const created = await exportTemplateController.upload({
				name: form.name,
				resourceType: form.resourceType as ExportResourceType,
				originalFilename: form.filename,
				fileBuffer: form.fileBuffer,
				uploadedByUserId: Number(authData.userID)
			})

			setAuditContext({ resourceIds: [created.id], newValue: created })

			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ data: created }))
		} catch (err) {
			log.error('UploadExportTemplate error', { err })

			if (err instanceof AppError) {
				res.writeHead(400, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: err.message }))
				return
			}

			res.writeHead(500, { Connection: 'close' })
			res.end('Internal error uploading export template')
		}
	}
)

export interface GetExportTemplatesQuery {
	resourceType?: Query<ExportResourceType>
}

export interface GetExportTemplatesResponse {
	data: ExportTemplateResponse[]
}

export const GetExportTemplates = api(
	{ auth: true, expose: true, method: 'GET', path: '/export-templates' },
	async (q: GetExportTemplatesQuery): Promise<GetExportTemplatesResponse> => {
		const data = await exportTemplateController.find(q.resourceType)

		return { data }
	}
)

export const DownloadExampleExportTemplate = api.raw(
	{
		auth: true,
		expose: true,
		method: 'GET',
		path: '/export-templates/example'
	},
	async (req, res) => {
		try {
			const resourceType = new URL(
				req.url ?? '',
				'http://localhost'
			).searchParams.get('resourceType')

			const filename =
				resourceType === 'students'
					? 'dynamic-docx-template-students-example.docx'
					: 'dynamic-docx-template.docx'

			const buffer = await readFile(path.join('./templates', filename))

			res.writeHead(200, {
				'Content-Type':
					'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'Content-Disposition': 'attachment; filename="mau-vi-du.docx"'
			})
			res.end(buffer)
		} catch (err) {
			log.error('DownloadExampleExportTemplate error', { err })

			res.writeHead(500, { Connection: 'close' })
			res.end('Internal error downloading example template')
		}
	}
)

interface DeleteExportTemplateRequest {
	id: number
}

export const DeleteExportTemplate = api(
	{
		auth: true,
		expose: true,
		method: 'DELETE',
		path: '/export-templates/:id'
	},
	async ({ id }: DeleteExportTemplateRequest): Promise<{ id: number }> => {
		const deleted = await exportTemplateController.delete(id)

		setAuditContext({ resourceIds: [id], previousValue: deleted })

		return { id }
	}
)

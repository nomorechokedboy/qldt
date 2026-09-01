import busboy from 'busboy'
import { IncomingHttpHeaders } from 'http'

export interface ParsedUploadTemplateForm {
	name: string
	resourceType: string
	filename: string
	fileBuffer: Buffer
}

export async function parseUploadTemplateForm(
	stream: NodeJS.ReadableStream,
	headers: IncomingHttpHeaders
): Promise<ParsedUploadTemplateForm> {
	return new Promise((resolve, reject) => {
		const bb = busboy({ headers })
		const fields: Record<string, string> = {}
		let filename = ''
		const chunks: Buffer[] = []

		bb.on('field', (name, value) => {
			fields[name] = value
		})

		bb.on('file', (_, file, info) => {
			filename = info.filename

			file.on('data', (data) => {
				chunks.push(data)
			}).on('error', (err) => {
				bb.emit('error', err)
			})
		})

		bb.on('close', () => {
			resolve({
				name: fields.name ?? filename,
				resourceType: fields.resourceType,
				filename,
				fileBuffer: Buffer.concat(chunks)
			})
		})

		bb.on('error', (err) => {
			reject(err)
		})

		stream.pipe(bb)
	})
}

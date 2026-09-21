import { ExportTableData } from '@/api'
import i18n from '@/i18n'
import type { ExportData } from '@/types'
import { toastApiError } from '@/lib/api-error'

export type ExportConfig = {
	filename?: string
}

function isoToDdMmYyyy(isoDate: string): string {
	if (isoDate === 'Chưa có thông tin') {
		return isoDate
	}

	const [year, month, day] = isoDate.split('-')
	return `${day}/${month}/${year}`
}

export default function useExportButton({
	filename = 'my-file'
}: ExportConfig) {
	async function handleExport({ data, ...exportData }: ExportData) {
		try {
			const politicalOrgColLabel = 'politicalOrg'
			const politicalOrgMap = { hcyu: 'Đoàn viên', cpv: 'Đảng viên' }
			const sanitizedData = data.map((d) => {
				for (const [key, val] of Object.entries(d)) {
					/* if (val === '') {
                        d[key] = 'Chưa có thông tin'
                    } */
				}

				const isPoliticalOrgExist =
					d[politicalOrgColLabel] !== undefined ||
					d[politicalOrgColLabel] !== null ||
					d[politicalOrgColLabel] !== ''

				if (isPoliticalOrgExist) {
					d[politicalOrgColLabel] =
						politicalOrgMap[
							d[
								politicalOrgColLabel
							] as keyof typeof politicalOrgMap
						]
				}

				d.dob = isoToDdMmYyyy(d.dob)
				d.fatherDob = isoToDdMmYyyy(d.fatherDob)
				d.motherDob = isoToDdMmYyyy(d.motherDob)

				return d
			})

			const resp = await ExportTableData({
				data: sanitizedData,
				...exportData
			})
			const blob = await resp.blob(),
				contentType =
					resp.headers.get('content-type') ??
					'application/octet-stream'
			const fileBlob = new Blob([blob], {
				type: contentType
			})

			const link = document.createElement('a')
			link.href = window.URL.createObjectURL(fileBlob)
			link.download = `${filename}.docx`

			document.body.appendChild(link)
			link.click()

			document.body.removeChild(link)
			window.URL.revokeObjectURL(link.href)
		} catch (err) {
			console.error('handleExport error', err)

			toastApiError(i18n.t('io:export.failed'), err)
		}
	}

	return {
		hidden: false,
		onExport: handleExport
	}
}

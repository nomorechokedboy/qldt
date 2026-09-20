import i18n from '@/i18n'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ExportTemplateGuideline } from './export-template-guideline'
import { UploadStep } from './import-students-dialog/upload-step'

afterEach(() => act(() => i18n.changeLanguage('vi')))

function renderUploadStep() {
	return render(
		<UploadStep
			downloadTemplate={() => {}}
			selectedFile={null}
			dragActive={false}
			fileInputRef={{ current: null }}
			onDrag={() => {}}
			onDrop={() => {}}
			onFileInputChange={() => {}}
		/>
	)
}

describe('import dialog upload step language', () => {
	it('is in Vietnamese by default', () => {
		renderUploadStep()

		expect(screen.getByText('File mẫu Excel')).toBeTruthy()
		expect(
			screen.getByText('Hỗ trợ file CSV, Excel (.xlsx, .xls)')
		).toBeTruthy()
	})

	it('switches to English when the language changes', async () => {
		renderUploadStep()

		await act(() => i18n.changeLanguage('en'))

		expect(screen.getByText('Excel template')).toBeTruthy()
		expect(
			screen.getByText('Supports CSV, Excel (.xlsx, .xls)')
		).toBeTruthy()
		expect(
			screen.getByRole('button', { name: 'choose a file' })
		).toBeTruthy()
	})
})

describe('export template guideline language', () => {
	it('keeps template variables exact while translating their meaning', async () => {
		render(<ExportTemplateGuideline resourceType='students' />)

		expect(screen.getByText('Ngày lập báo cáo')).toBeTruthy()

		await act(() => i18n.changeLanguage('en'))

		expect(screen.getByText('{unitName}')).toBeTruthy()
		expect(screen.getByText('Day the report is made')).toBeTruthy()
		expect(screen.getByText('troopers')).toBeTruthy()
		expect(screen.getByText('{-w:br/}')).toBeTruthy()
		expect(screen.getByText('unit.name')).toBeTruthy()
	})
})

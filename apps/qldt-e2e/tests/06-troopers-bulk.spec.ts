import type { Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { trooperWorkbook, type TrooperRow } from '../support/spreadsheet'
import { rest } from '../support/pace'
import { t } from '../support/text'

test.use({ storageState: ADMIN_STATE })

const dialog = (page: Page) => page.getByRole('dialog').last()
const rowFor = (page: Page, name: string) =>
	page.getByRole('row').filter({ hasText: name })

const XLSX_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// What a person types into the template: names, not ids. A unit is written the
// way the app labels it (with its parent), a position with its unit level.
const COMPANY = 'Đại đội 1 (Tiểu đoàn 8 Pháo binh)'
const SOLDIER = `${t('units:levels.squad')} - Chiến sĩ`

const common: TrooperRow = {
	birthPlaceProvinceName: 'Thành phố Hà Nội',
	birthPlaceWardName: 'Xã Minh Châu',
	addressProvinceName: 'Thành phố Hà Nội',
	addressWardName: 'Xã Minh Châu',
	unitId: COMPANY,
	positionId: SOLDIER,
	ethnic: 'Kinh',
	religion: 'Không',
	activityStatus: 'Đang phục vụ',
	politicalOrg: 'Đoàn',
	educationLevel: '12/12',
	isMarried: 'Không',
	familySize: '4'
}

const BINH: TrooperRow = {
	...common,
	fullName: 'Trần Quốc Bình',
	studentId: 'QN0004',
	dob: '12/08/2004',
	phone: '0933000004',
	birthPlaceDetail: '5 Trần Phú',
	addressDetail: '5 Trần Phú',
	rank: 'Binh nhì'
}
const CUONG: TrooperRow = {
	...common,
	fullName: 'Vũ Đức Cường',
	studentId: 'QN0005',
	dob: '30/01/2003',
	phone: '0933000005',
	birthPlaceDetail: '17 Lý Thường Kiệt',
	addressDetail: '17 Lý Thường Kiệt',
	rank: 'Binh nhất'
}

const upload = (page: Page, name: string, rows: TrooperRow[]) =>
	dialog(page)
		.locator('input[type=file]')
		.setInputFiles({
			name,
			mimeType: XLSX_TYPE,
			buffer: trooperWorkbook(rows)
		})

test('troopers in bulk: import a spreadsheet, column choice, edit in place, delete', async ({
	page,
	story
}) => {
	await page.goto('/dai-doi/c1?id=2')
	await story.chapter(
		'Quân nhân: thao tác hàng loạt',
		'Import từ Excel, chọn cột hiển thị, sửa ngay trên bảng và xóa'
	)

	await story.step(
		'Danh sách Đại đội 1 hiện có một quân nhân, tạo ở chương trước',
		async () => {
			await expect(rowFor(page, 'Phạm Văn An')).toBeVisible()
			await expect(rowFor(page, 'Trần Quốc Bình')).toHaveCount(0)
		}
	)

	await story.step(
		'Import: tải file mẫu về, điền theo mẫu rồi tải lên',
		async () => {
			await page
				.getByRole('button', { name: t('table:studentTable.import') })
				.click()
			await expect(dialog(page)).toBeVisible()

			const [download] = await Promise.all([
				page.waitForEvent('download'),
				dialog(page)
					.getByRole('button', {
						name: t('io:importDialog.upload.template.download')
					})
					.click()
			])
			expect(download.suggestedFilename()).toMatch(/\.xlsx$/)
		}
	)

	await story.step(
		'File có dòng ghi sai đơn vị: hệ thống báo lỗi trước khi lưu và khóa nút Import',
		async () => {
			await upload(page, 'quan-nhan-loi.xlsx', [
				BINH,
				{ ...CUONG, unitId: 'Đại đội 9' }
			])
			await expect(
				dialog(page).getByText(
					t('io:importDialog.messages.refErrors', { count: 1 })
				)
			).toBeVisible()
			await expect(
				dialog(page).getByRole('button', {
					name: t('io:importDialog.actions.confirm')
				})
			).toBeDisabled()
		}
	)

	await story.step('Chọn lại file đã điền đúng', async () => {
		await dialog(page)
			.getByRole('button', { name: t('io:importDialog.review.another') })
			.first()
			.click()
		await upload(page, 'quan-nhan.xlsx', [BINH, CUONG])
		await expect(
			dialog(page).getByText(
				t('io:importDialog.review.valid', { count: 2 })
			)
		).toBeVisible()
	})

	await story.step('Xác nhận: cả hai quân nhân được thêm', async () => {
		await dialog(page)
			.getByRole('button', { name: t('io:importDialog.actions.confirm') })
			.click()
		await expect(
			dialog(page).getByText(
				t('io:importDialog.messages.done', { success: 2, total: 2 })
			)
		).toBeVisible()
		await dialog(page)
			.getByRole('button', { name: t('io:importDialog.actions.close') })
			.click()
		await expect(dialog(page)).toBeHidden()
		await expect(rowFor(page, 'Trần Quốc Bình')).toBeVisible()
		await expect(rowFor(page, 'Vũ Đức Cường')).toBeVisible()
	})

	await story.step(
		'Chọn cột hiển thị: ẩn Quê quán, bật Dân tộc',
		async () => {
			await page
				.getByRole('button', { name: t('table:viewOptions.trigger') })
				.click()
			await page
				.getByRole('menuitemcheckbox', {
					name: t('table:columns.birthPlace')
				})
				.click()
			await page
				.getByRole('menuitemcheckbox', {
					name: t('table:columns.ethnic')
				})
				.click()
			await page.keyboard.press('Escape')
			await expect(
				page.getByRole('columnheader', {
					name: t('table:columns.birthPlace')
				})
			).toHaveCount(0)
			await expect(
				page.getByRole('columnheader', {
					name: t('table:columns.ethnic')
				})
			).toBeVisible()
		}
	)

	await story.step(
		'Sửa cấp bậc ngay trên bảng: nhấp đúp vào ô, chọn cấp bậc mới rồi lưu',
		async () => {
			const cell = rowFor(page, 'Vũ Đức Cường')
				.getByRole('cell')
				.filter({ hasText: 'Binh nhất' })
			await cell.getByText('Binh nhất', { exact: true }).dblclick()
			await page
				.getByRole('option', { name: 'Hạ sĩ', exact: true })
				.click()
			await rest(page)
			// The save button is icon-only, so it is found by its check mark.
			await rowFor(page, 'Vũ Đức Cường')
				.locator('button:has(svg.lucide-check)')
				.click()
			await expect(
				page.getByText(t('table:cells.updateSuccess')).first()
			).toBeVisible()
			await expect(
				rowFor(page, 'Vũ Đức Cường').getByText('Hạ sĩ', { exact: true })
			).toBeVisible()
		}
	)

	await story.step('Xóa một quân nhân', async () => {
		// The app asks with the browser's own confirm box.
		page.once('dialog', (confirm) => confirm.accept())
		await rowFor(page, 'Trần Quốc Bình')
			.getByRole('button', { name: t('table:rowActions.openMenu') })
			.click()
		await page
			.getByRole('menuitem', { name: t('table:rowActions.delete') })
			.click()
		await expect(
			page.getByText(t('table:rowActions.deleteSuccess')).first()
		).toBeVisible()
		await expect(rowFor(page, 'Trần Quốc Bình')).toHaveCount(0)
		await expect(rowFor(page, 'Vũ Đức Cường')).toBeVisible()
	})
})

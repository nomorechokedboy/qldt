import type { Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'

test.use({ storageState: ADMIN_STATE })

const level = (name: string) => t(`units:levels.${name}`)

const rowFor = (page: Page, name: string) =>
	page.getByRole('row').filter({ hasText: name })

// Fill the "add position" dialog of the tab that is open.
async function createPosition(
	page: Page,
	position: { code: string; name: string; priority: number; hsq?: boolean }
) {
	await page
		.getByRole('button', { name: t('admin:positions.create.trigger') })
		.click()
	const dialog = page.getByRole('dialog')
	await dialog
		.getByLabel(t('admin:positions.fields.code'), { exact: true })
		.fill(position.code)
	await dialog
		.getByLabel(t('admin:positions.fields.name'), { exact: true })
		.fill(position.name)
	await dialog
		.getByLabel(t('admin:positions.fields.priority'), { exact: true })
		.fill(String(position.priority))
	if (position.hsq) {
		await dialog.getByLabel(t('admin:positions.fields.hsq')).check()
	}
	await dialog
		.getByRole('button', { name: t('admin:common.add'), exact: true })
		.click()
	await dialog.waitFor({ state: 'hidden' })
	await expect(rowFor(page, position.name)).toBeVisible()
}

// Names of the rows in table order, without the header row.
const rowNames = async (page: Page) =>
	(await page.getByRole('row').allInnerTexts()).slice(1)

test('positions: the catalog of posts a trooper can hold, per unit level', async ({
	page,
	story
}) => {
	await page.goto('/chuc-vu')
	await story.chapter(
		'Danh mục chức vụ',
		'Mỗi cấp đơn vị có bảng chức vụ riêng, xếp theo thứ tự ưu tiên'
	)

	await story.step(
		'Hệ thống mới khởi tạo: chưa có chức vụ nào, các thẻ theo cấp từ tiểu đội đến tiểu đoàn',
		async () => {
			for (const name of ['squad', 'platoon', 'company', 'battalion']) {
				await expect(
					page.getByRole('tab', { name: level(name), exact: true })
				).toBeVisible()
			}
			await expect(
				page.getByRole('cell', { name: t('admin:positions.empty') })
			).toBeVisible()
		}
	)

	await story.step('Cấp tiểu đoàn: thêm các chức vụ chỉ huy', async () => {
		await createPosition(page, {
			code: 'tdt',
			name: 'Tiểu đoàn trưởng',
			priority: 10
		})
		await createPosition(page, {
			code: 'ctv',
			name: 'Chính trị viên tiểu đoàn',
			priority: 20
		})
		await createPosition(page, {
			code: 'tltc',
			name: 'Trợ lý tác chiến',
			priority: 90
		})
	})

	await story.step(
		'Bảng luôn xếp theo ưu tiên: số càng nhỏ càng đứng trước',
		async () => {
			const names = await rowNames(page)
			expect(names).toHaveLength(3)
			expect(names[0]).toContain('Tiểu đoàn trưởng')
			expect(names[1]).toContain('Chính trị viên tiểu đoàn')
			expect(names[2]).toContain('Trợ lý tác chiến')
		}
	)

	await story.step(
		'Chỉnh sửa: đưa Trợ lý tác chiến lên trước Chính trị viên bằng cách đổi thứ tự ưu tiên',
		async () => {
			await rowFor(page, 'Trợ lý tác chiến')
				.getByRole('button')
				.last()
				.click()
			await page
				.getByRole('menuitem', { name: t('admin:common.edit') })
				.click()
			const dialog = page.getByRole('dialog')
			await dialog
				.getByLabel(t('admin:positions.fields.priority'), {
					exact: true
				})
				.fill('15')
			await dialog
				.getByRole('button', { name: t('admin:common.saveShort') })
				.click()
			await expect(
				page.getByText(t('admin:positions.update.success'))
			).toBeVisible()
			await dialog.waitFor({ state: 'hidden' })

			const names = await rowNames(page)
			expect(names[1]).toContain('Trợ lý tác chiến')
			expect(names[2]).toContain('Chính trị viên tiểu đoàn')
		}
	)

	await story.step('Xóa một chức vụ thêm nhầm', async () => {
		await createPosition(page, {
			code: 'nham',
			name: 'Chức vụ thêm nhầm',
			priority: 99
		})
		// The app asks with the browser's own confirm box.
		page.once('dialog', async (dialog) => {
			expect(dialog.message()).toBe(
				t('admin:positions.delete.confirm', {
					name: 'Chức vụ thêm nhầm'
				})
			)
			await dialog.accept()
		})
		await rowFor(page, 'Chức vụ thêm nhầm')
			.getByRole('button')
			.last()
			.click()
		await page
			.getByRole('menuitem', { name: t('admin:common.delete') })
			.click()
		await expect(
			page.getByText(t('admin:positions.delete.success'))
		).toBeVisible()
		await expect(rowFor(page, 'Chức vụ thêm nhầm')).toHaveCount(0)
	})

	await story.step('Cấp đại đội: mỗi cấp có bảng riêng', async () => {
		await page
			.getByRole('tab', { name: level('company'), exact: true })
			.click()
		await expect(
			page.getByRole('cell', { name: t('admin:positions.empty') })
		).toBeVisible()
		await createPosition(page, {
			code: 'ddt',
			name: 'Đại đội trưởng',
			priority: 10
		})
		await createPosition(page, {
			code: 'ctvdd',
			name: 'Chính trị viên đại đội',
			priority: 20
		})
	})

	await story.step('Cấp trung đội', async () => {
		await page
			.getByRole('tab', { name: level('platoon'), exact: true })
			.click()
		await createPosition(page, {
			code: 'trdt',
			name: 'Trung đội trưởng',
			priority: 10
		})
	})

	await story.step(
		'Cấp tiểu đội: đánh dấu chức vụ của hạ sĩ quan (HSQ)',
		async () => {
			await page
				.getByRole('tab', { name: level('squad'), exact: true })
				.click()
			await createPosition(page, {
				code: 'tdtr',
				name: 'Tiểu đội trưởng',
				priority: 10,
				hsq: true
			})
			await createPosition(page, {
				code: 'cs',
				name: 'Chiến sĩ',
				priority: 90
			})

			// The table has no HSQ column; the edit form shows what was saved.
			await rowFor(page, 'Tiểu đội trưởng')
				.getByRole('button')
				.last()
				.click()
			await page
				.getByRole('menuitem', { name: t('admin:common.edit') })
				.click()
			const dialog = page.getByRole('dialog')
			await expect(
				dialog.getByLabel(t('admin:positions.fields.hsq'))
			).toBeChecked()
			await dialog
				.getByRole('button', { name: t('admin:common.cancel') })
				.click()
			await dialog.waitFor({ state: 'hidden' })
		}
	)

	await story.step(
		'Danh mục đã lưu: quay lại cấp tiểu đoàn vẫn còn đủ chức vụ',
		async () => {
			await page.reload()
			await expect(rowFor(page, 'Tiểu đoàn trưởng')).toBeVisible()
			await expect(rowFor(page, 'Trợ lý tác chiến')).toBeVisible()
			await expect(rowFor(page, 'Chức vụ thêm nhầm')).toHaveCount(0)
		}
	)
})

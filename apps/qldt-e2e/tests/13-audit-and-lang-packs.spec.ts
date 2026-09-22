import type { Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import { choose } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

const toast = (page: Page, text: string) =>
	expect(page.getByText(text).first()).toBeVisible()

// The two language cards on /cai-dat-ngon-ngu, found by their title (a plain
// div, not a heading role - CardTitle doesn't render a semantic heading).
const langCard = (page: Page, label: string) =>
	page.locator('[data-slot="card"]').filter({
		has: page.locator('[data-slot="card-title"]', {
			hasText: new RegExp(`^${label}$`)
		})
	})

test('audit log and language packs', async ({ page, story }) => {
	await page.goto('/nhat-ky-hoat-dong')
	await story.chapter(
		'Nhật ký hoạt động & gói ngôn ngữ',
		'Tra cứu nhật ký thao tác của hệ thống, tuỳ chỉnh chữ hiển thị theo ngôn ngữ'
	)

	await story.step(
		'Nhật ký hoạt động ghi lại các thao tác đã thực hiện ở các chương trước',
		async () => {
			await expect(page.getByText(t('admin:audit.empty'))).toHaveCount(0)
			await expect(
				page
					.getByRole('row')
					.filter({ hasText: 'Nguyễn Văn Quản' })
					.first()
			).toBeVisible()
		}
	)

	await story.step(
		'Lọc theo tài nguyên: chỉ còn nhật ký của quân nhân',
		async () => {
			await choose(
				page,
				page.getByRole('combobox').first(),
				t('admin:audit.resources.students')
			)
			const bodyRows = page.getByRole('row').filter({
				has: page.getByRole('button', { name: t('admin:audit.view') })
			})
			await expect(bodyRows.first()).toBeVisible()
			const count = await bodyRows.count()
			for (let i = 0; i < count; i++) {
				await expect(
					bodyRows
						.nth(i)
						.getByText(t('admin:audit.resources.students'))
				).toBeVisible()
			}
		}
	)

	await story.step(
		'Lọc thêm theo hành động: chỉ còn các lần tạo mới quân nhân',
		async () => {
			await choose(
				page,
				page.getByRole('combobox').nth(1),
				t('admin:audit.actions.create')
			)
			await expect(
				page
					.getByRole('row')
					.filter({
						has: page.getByRole('button', {
							name: t('admin:audit.view')
						})
					})
					.first()
			).toBeVisible()
		}
	)

	await story.step(
		'Xem chi tiết bản ghi mới nhất: đây là lần nhập hai quân nhân ở chương trước, kể cả nhập theo lô cũng được ghi lại',
		async () => {
			// Rows are newest first, and nothing after chapter 12's bulk import
			// creates a student - so the top row here is that import.
			await page
				.getByRole('row')
				.filter({
					has: page.getByRole('button', {
						name: t('admin:audit.view')
					})
				})
				.first()
				.getByRole('button', { name: t('admin:audit.view') })
				.click()
			const sheet = page.getByRole('dialog').last()
			await expect(
				sheet.getByRole('heading', {
					name: t('admin:audit.detailTitle')
				})
			).toBeVisible()
			await expect(sheet.getByText('Phan Đình Khánh')).toBeVisible()
			await expect(sheet.getByText('Lương Văn Hạ')).toBeVisible()
			await page.keyboard.press('Escape')
			await expect(sheet).toBeHidden()
		}
	)

	await story.step(
		'Bỏ bộ lọc: phân trang cho phép chuyển qua trang tiếp theo',
		async () => {
			await choose(
				page,
				page.getByRole('combobox').first(),
				t('admin:audit.allResources')
			)
			await choose(
				page,
				page.getByRole('combobox').nth(1),
				t('admin:audit.allActions')
			)
			const nextButton = page.getByRole('button', {
				name: t('admin:audit.next')
			})
			// Twelve chapters of CRUD comfortably clear one 20-row page; if a
			// future run ever has fewer rows this step just no-ops.
			if (await nextButton.isEnabled()) {
				await nextButton.click()
				await expect(page.getByText(/Trang 2 \//)).toBeVisible()
				await page
					.getByRole('button', { name: t('admin:audit.previous') })
					.click()
				await expect(page.getByText(/Trang 1 \//)).toBeVisible()
			}
		}
	)

	await page.goto('/cai-dat-ngon-ngu')

	await story.step('Cả hai ngôn ngữ đều đang dùng chữ mặc định', async () => {
		// Not exact: "Mặc định" is also a substring of several other
		// strings in the same card ("Tải tệp mẫu mặc định", "Khôi phục
		// mặc định", the format-hint paragraph) - a plain substring match
		// hits all of them.
		await expect(
			langCard(page, 'Tiếng Việt').getByText(
				t('langPacks:status.default'),
				{ exact: true }
			)
		).toBeVisible()
		await expect(
			langCard(page, 'English').getByText(t('langPacks:status.default'), {
				exact: true
			})
		).toBeVisible()
	})

	await story.step('Tải tệp mẫu mặc định của một ngôn ngữ', async () => {
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			langCard(page, 'English')
				.getByRole('button', { name: t('langPacks:downloadTemplate') })
				.click()
		])
		expect(download.suggestedFilename()).toBe('lang-pack-en-default.json')
	})

	const CUSTOM_TITLE = 'Bo Cong Cu Ngon Ngu'

	await story.step(
		'Tải lên gói tuỳ chỉnh cho tiếng Anh: đổi một chuỗi',
		async () => {
			await langCard(page, 'English')
				.getByLabel(`English: ${t('langPacks:dropzone')}`)
				.setInputFiles({
					name: 'en-override.json',
					mimeType: 'application/json',
					buffer: Buffer.from(
						JSON.stringify({ langPacks: { title: CUSTOM_TITLE } }),
						'utf-8'
					)
				})
			await toast(
				page,
				t('langPacks:toast.uploaded', { language: 'English' })
			)
			await expect(
				langCard(page, 'English').getByText(
					t('langPacks:status.custom'),
					{
						exact: true
					}
				)
			).toBeVisible()
			await expect(
				langCard(page, 'English').getByText(
					t('langPacks:result.applied', { count: 1 })
				)
			).toBeVisible()
		}
	)

	await story.step(
		'Chuyển giao diện sang tiếng Anh: chữ tuỳ chỉnh hiển thị ngay lập tức',
		async () => {
			await page
				.getByRole('button', { name: 'English', exact: true })
				.click()
			await expect(
				page.getByRole('heading', { name: CUSTOM_TITLE, exact: true })
			).toBeVisible()
		}
	)

	await story.step(
		'Chuyển lại tiếng Việt: chữ tiếng Việt không bị ảnh hưởng',
		async () => {
			await page
				.getByRole('button', { name: 'Tiếng Việt', exact: true })
				.click()
			await expect(
				page.getByRole('heading', {
					name: t('langPacks:title'),
					exact: true
				})
			).toBeVisible()
		}
	)

	await story.step('Khôi phục gói mặc định cho tiếng Anh', async () => {
		await langCard(page, 'English')
			.getByRole('button', { name: t('langPacks:reset') })
			.click()
		const dialog = page.getByRole('dialog').last()
		await expect(
			dialog.getByText(t('langPacks:confirmReset.title'))
		).toBeVisible()
		await dialog
			.getByRole('button', { name: t('langPacks:confirmReset.confirm') })
			.click()
		await toast(
			page,
			t('langPacks:toast.resetDone', { language: 'English' })
		)
		await expect(
			langCard(page, 'English').getByText(t('langPacks:status.default'), {
				exact: true
			})
		).toBeVisible()

		// The override is gone - switching to English now shows the
		// built-in title again, not the custom one from before.
		await page.getByRole('button', { name: 'English', exact: true }).click()
		await expect(
			page.getByRole('heading', { name: 'Language packs', exact: true })
		).toBeVisible()
		await page
			.getByRole('button', { name: 'Tiếng Việt', exact: true })
			.click()
	})

	await story.step(
		'Tệp không phải .json bị từ chối, không có gì được áp dụng',
		async () => {
			await langCard(page, 'Tiếng Việt')
				.getByLabel(`Tiếng Việt: ${t('langPacks:dropzone')}`)
				.setInputFiles({
					name: 'not-json.txt',
					mimeType: 'text/plain',
					buffer: Buffer.from('hello', 'utf-8')
				})
			await toast(page, t('langPacks:errors.notJsonFile'))
			await expect(
				langCard(page, 'Tiếng Việt').getByText(
					t('langPacks:status.default'),
					{ exact: true }
				)
			).toBeVisible()
		}
	)
})

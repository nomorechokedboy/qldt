import { ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import { createUnit } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

test('units: build the hierarchy under the root unit', async ({
	page,
	story
}) => {
	// The card that shows this alias, so its hover actions can be reached.
	const cardFor = (alias: string) =>
		page
			.locator('[data-slot=card]')
			.filter({ hasText: t('units:card.aliasLine', { alias }) })
	await page.goto('/quan-ly-don-vi')
	await story.chapter(
		'Quản lý đơn vị',
		'Dựng cây tổ chức: đại đội → trung đội → tiểu đội'
	)

	await story.step(
		'Danh sách đơn vị chỉ mới có đơn vị gốc vừa khởi tạo',
		async () => {
			await expect(
				page.getByText('Tiểu đoàn 8 Pháo binh').first()
			).toBeVisible()
		}
	)

	await story.step('Thêm Đại đội 1 trực thuộc tiểu đoàn', async () => {
		await createUnit(page, t, {
			name: 'Đại đội 1',
			alias: 'c1',
			level: t('units:levels.company'),
			parent: 'Tiểu đoàn 8 Pháo binh'
		})
		await expect(
			page
				.getByText(t('units:card.aliasLine', { alias: 'c1' }), {
					exact: false
				})
				.first()
		).toBeVisible()
	})

	await story.step('Thêm Đại đội 2', async () => {
		await createUnit(page, t, {
			name: 'Đại đội 2',
			alias: 'c2',
			level: t('units:levels.company'),
			parent: 'Tiểu đoàn 8 Pháo binh'
		})
		await expect(
			page
				.getByText(t('units:card.aliasLine', { alias: 'c2' }), {
					exact: false
				})
				.first()
		).toBeVisible()
	})

	await story.step('Thêm Trung đội 1 thuộc Đại đội 1', async () => {
		await createUnit(page, t, {
			name: 'Trung đội 1',
			alias: 'b1',
			level: t('units:levels.platoon'),
			parent: 'Đại đội 1'
		})
		await expect(
			page
				.getByText(t('units:card.aliasLine', { alias: 'b1' }), {
					exact: false
				})
				.first()
		).toBeVisible()
	})

	await story.step('Thêm Tiểu đội 1 thuộc Trung đội 1', async () => {
		await createUnit(page, t, {
			name: 'Tiểu đội 1',
			alias: 'a1',
			level: t('units:levels.squad'),
			parent: 'Trung đội 1'
		})
	})

	await story.step('Thêm một đại đội tạm để minh hoạ việc xoá', async () => {
		await createUnit(page, t, {
			name: 'Đại đội tạm',
			alias: 'tmp',
			level: t('units:levels.company'),
			parent: 'Tiểu đoàn 8 Pháo binh'
		})
		await expect(
			page
				.getByText(t('units:card.aliasLine', { alias: 'tmp' }), {
					exact: false
				})
				.first()
		).toBeVisible()
	})

	await story.step(
		'Chỉnh sửa tên Đại đội 2 (rê chuột vào thẻ để hiện nút thao tác)',
		async () => {
			await cardFor('c2').hover()
			await cardFor('c2').getByTitle(t('units:card.edit')).click()
			const dialog = page.getByRole('dialog')
			await dialog.locator('#edit-unit-name').fill('Đại đội 2 Hỏa lực')
			await dialog
				.getByRole('button', {
					name: t('units:form.update'),
					exact: true
				})
				.click()
			await dialog.waitFor({ state: 'hidden' })
			await expect(
				page.getByText('Đại đội 2 Hỏa lực').first()
			).toBeVisible()
		}
	)

	await story.step(
		'Xoá đại đội tạm — hệ thống hỏi xác nhận trước khi xoá',
		async () => {
			await cardFor('tmp').hover()
			await cardFor('tmp').getByTitle(t('units:card.delete')).click()
			const dialog = page.getByRole('dialog')
			await expect(
				dialog.getByText(t('units:card.deleteHeading'))
			).toBeVisible()
			await story.pause(1500)
			await dialog
				.getByRole('button', {
					name: t('units:card.delete'),
					exact: true
				})
				.click()
			await expect(
				page.getByText(t('units:card.aliasLine', { alias: 'tmp' }), {
					exact: false
				})
			).toHaveCount(0)
		}
	)

	await story.step(
		'Cây đơn vị ở thanh bên phản ánh cấu trúc vừa dựng',
		async () => {
			await page
				.getByRole('button', { name: 'Tiểu đoàn 8 Pháo binh' })
				.click()
			await page
				.getByRole('link', { name: 'Đại đội 1', exact: true })
				.click()
			await expect(page).toHaveURL(/dai-doi\/c1/)
		}
	)
})

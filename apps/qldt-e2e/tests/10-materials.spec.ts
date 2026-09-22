import type { Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { rest } from '../support/pace'
import { t } from '../support/text'
import { choose } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

const dialog = (page: Page) => page.getByRole('dialog').last()
const rowFor = (page: Page, text: string) =>
	page.getByRole('row').filter({ hasText: text })
const toast = (page: Page, text: string) =>
	expect(page.getByText(text).first()).toBeVisible()
const openMenu = (row: ReturnType<typeof rowFor>) =>
	row.getByRole('button', { name: 'Open menu' }).click()

// Fill the catalog dialog. The category defaults to furniture.
async function addType(
	page: Page,
	type: {
		name: string
		unitOfMeasure: string
		category?: string
		serialized?: boolean
	}
) {
	await page
		.getByRole('button', { name: t('materials:typeForm.trigger') })
		.click()
	await dialog(page).locator('#material-type-name').fill(type.name)
	if (type.category)
		await choose(
			page,
			dialog(page).locator('#material-type-category'),
			type.category
		)
	await dialog(page).locator('#material-type-uom').fill(type.unitOfMeasure)
	if (type.serialized)
		await dialog(page).locator('#material-type-serialized').check()
	await rest(page)
	await dialog(page)
		.getByRole('button', { name: t('materials:form.add'), exact: true })
		.click()
}

async function addStock(
	page: Page,
	stock: { type: string; room: string; quantity: string; condition?: string }
) {
	await page
		.getByRole('button', { name: t('materials:stockForm.trigger') })
		.click()
	await choose(page, dialog(page).locator('#stock-material-type'), stock.type)
	await choose(page, dialog(page).locator('#stock-room'), stock.room)
	await dialog(page).locator('#stock-quantity').fill(stock.quantity)
	if (stock.condition)
		await choose(
			page,
			dialog(page).locator('#stock-condition'),
			stock.condition
		)
	await rest(page)
	await dialog(page)
		.getByRole('button', { name: t('materials:form.add'), exact: true })
		.click()
	await toast(page, t('materials:stockForm.created'))
	await expect(dialog(page)).toBeHidden()
}

async function addAsset(
	page: Page,
	asset: { serial: string; room: string; trooper?: string }
) {
	await page
		.getByRole('button', { name: t('materials:assetForm.trigger') })
		.click()
	await choose(page, dialog(page).locator('#asset-material-type'), 'Súng AK')
	await dialog(page).locator('#asset-serial').fill(asset.serial)
	await choose(page, dialog(page).locator('#asset-room'), asset.room)
	if (asset.trooper)
		await choose(
			page,
			dialog(page).locator('#asset-trooper'),
			new RegExp(asset.trooper)
		)
	await rest(page)
	await dialog(page)
		.getByRole('button', { name: t('materials:form.add'), exact: true })
		.click()
	await toast(page, t('materials:assetForm.created'))
	await expect(dialog(page)).toBeHidden()
}

test('materials: catalog, buildings and rooms, supplies, weapons', async ({
	page,
	story
}) => {
	await page.goto('/quan-ly-vat-tu/danh-muc')
	await story.chapter(
		'Vật tư và khí tài',
		'Danh mục loại vật tư → nhà và phòng của đại đội → vật tư sinh hoạt → vũ khí, trang bị có số sê-ri'
	)

	await story.step('Danh mục vật tư còn trống', async () => {
		await expect(page.getByText(t('materials:catalog.empty'))).toBeVisible()
	})

	await story.step(
		'Thêm loại quản lý theo số sê-ri: Súng AK là vũ khí, từng khẩu có số riêng',
		async () => {
			await addType(page, {
				name: 'Súng AK',
				unitOfMeasure: 'khẩu',
				category: t('materials:categories.weapon'),
				serialized: true
			})
			await toast(page, t('materials:typeForm.created'))
			await expect(rowFor(page, 'Súng AK')).toContainText(
				t('materials:typeTable.bySerial')
			)
		}
	)

	await story.step(
		'Thêm loại quản lý theo số lượng: Ghế và Giường là đồ nội thất',
		async () => {
			await addType(page, { name: 'Ghế', unitOfMeasure: 'cái' })
			await expect(rowFor(page, 'Ghế')).toContainText(
				t('materials:typeTable.byQuantity')
			)
			await addType(page, { name: 'Giường', unitOfMeasure: 'cái' })
			await expect(rowFor(page, 'Giường')).toBeVisible()
		}
	)

	await story.step('Tên danh mục không được trùng', async () => {
		await addType(page, { name: 'Ghế', unitOfMeasure: 'cái' })
		await toast(page, t('materials:typeForm.createFailed'))
		await dialog(page)
			.getByRole('button', { name: t('materials:form.cancel') })
			.click()
		await expect(page.getByRole('dialog')).toHaveCount(0)
		await expect(rowFor(page, 'Ghế')).toHaveCount(1)
	})

	await story.step('Lọc theo phân loại: chỉ hiện đồ nội thất', async () => {
		await page
			.getByRole('button', { name: t('materials:columns.category') })
			.click()
		await page
			.getByRole('option', { name: t('materials:categories.furniture') })
			.click()
		await page.keyboard.press('Escape')
		await expect(rowFor(page, 'Ghế')).toBeVisible()
		await expect(rowFor(page, 'Súng AK')).toHaveCount(0)
	})

	await story.step('Sửa đơn vị tính của Giường', async () => {
		await openMenu(rowFor(page, 'Giường'))
		await page
			.getByRole('menuitem', { name: t('materials:actions.edit') })
			.click()
		await dialog(page).locator('#edit-material-type-uom').fill('chiếc')
		await rest(page)
		await dialog(page)
			.getByRole('button', { name: t('materials:form.save') })
			.click()
		await toast(page, t('materials:typeEdit.updated'))
		await expect(rowFor(page, 'Giường')).toContainText('chiếc')
	})

	await story.step('Xóa loại Giường (chưa dùng ở đâu)', async () => {
		page.once('dialog', (confirm) => confirm.accept())
		await openMenu(rowFor(page, 'Giường'))
		await page
			.getByRole('menuitem', { name: t('materials:actions.delete') })
			.click()
		await toast(page, t('materials:typeTable.deleted'))
		await expect(rowFor(page, 'Giường')).toHaveCount(0)
	})

	await story.step(
		'Sang trang Đại đội 1, mở tab Cơ sở vật chất: chưa có nhà nào',
		async () => {
			await page.goto('/dai-doi/c1?id=2')
			await page
				.getByRole('tab', { name: t('units:tabs.facilities') })
				.click()
			await expect(
				page.getByText(t('units:company.noBuildings'))
			).toBeVisible()
			await expect(
				page.getByText(t('units:company.noSupplies'))
			).toBeVisible()
		}
	)

	await story.step('Thêm nhà của Đại đội 1', async () => {
		await page
			.getByRole('button', {
				name: t('units:facilities.building.trigger')
			})
			.click()
		await dialog(page).locator('#building-name').fill('Nhà Đại đội 1')
		await dialog(page)
			.locator('#building-description')
			.fill('Khu nhà ở và làm việc')
		await rest(page)
		await dialog(page)
			.getByRole('button', {
				name: t('units:facilities.common.add'),
				exact: true
			})
			.click()
		await toast(page, t('units:facilities.building.created'))
		await expect(
			page
				.locator('[data-slot=card]')
				.filter({ hasText: 'Nhà Đại đội 1' })
		).toContainText(t('units:facilities.building.roomCount', { count: 0 }))
	})

	const roomsSheet = () => page.getByRole('dialog').first()
	const roomRow = (name: string) =>
		roomsSheet().locator('div.rounded-md.border').filter({ hasText: name })

	await story.step(
		'Quản lý phòng của nhà: thêm Kho, Phòng ở 1 và một phòng tạm',
		async () => {
			await page
				.getByRole('button', {
					name: t('units:facilities.building.manageRooms')
				})
				.click()
			await expect(roomsSheet()).toContainText(
				t('units:facilities.room.empty')
			)
			for (const room of [
				{ name: 'Kho', type: 'kho' },
				{ name: 'Phòng ở 1', type: 'phòng ở' },
				{ name: 'Phòng tạm', type: 'phòng ở' }
			]) {
				await page
					.getByRole('button', {
						name: t('units:facilities.room.trigger')
					})
					.click()
				await dialog(page).locator('#room-name').fill(room.name)
				await dialog(page).locator('#room-type').fill(room.type)
				await rest(page)
				await dialog(page)
					.getByRole('button', {
						name: t('units:facilities.common.add'),
						exact: true
					})
					.click()
				await toast(page, t('units:facilities.room.created'))
				await expect(roomRow(room.name)).toBeVisible()
			}
		}
	)

	await story.step('Đổi tên Kho thành Kho vũ khí', async () => {
		await roomRow('Kho')
			.first()
			.locator('button:has(svg.lucide-pencil)')
			.click()
		await dialog(page).locator('#edit-room-name').fill('Kho vũ khí')
		await rest(page)
		await dialog(page)
			.getByRole('button', { name: t('units:facilities.common.save') })
			.click()
		await toast(page, t('units:facilities.room.updated'))
		await expect(roomRow('Kho vũ khí')).toBeVisible()
	})

	await story.step('Xóa phòng tạm', async () => {
		page.once('dialog', (confirm) => confirm.accept())
		await roomRow('Phòng tạm')
			.locator('button:has(svg.lucide-trash)')
			.click()
		await toast(page, t('units:facilities.room.deleted'))
		await expect(roomRow('Phòng tạm')).toHaveCount(0)
		await page.keyboard.press('Escape')
		await expect(page.getByRole('dialog')).toHaveCount(0)
	})

	await story.step(
		'Thêm vật tư sinh hoạt: 20 ghế còn tốt ở Phòng ở 1',
		async () => {
			await addStock(page, {
				type: 'Ghế',
				room: 'Phòng ở 1',
				quantity: '20'
			})
			await expect(rowFor(page, 'Ghế')).toContainText('20')
		}
	)

	await story.step(
		'Thêm 10 ghế nữa cùng tình trạng: số lượng cộng dồn vào cùng một dòng',
		async () => {
			await addStock(page, {
				type: 'Ghế',
				room: 'Phòng ở 1',
				quantity: '10'
			})
			await expect(rowFor(page, 'Ghế')).toHaveCount(1)
			await expect(rowFor(page, 'Ghế')).toContainText('30')
		}
	)

	await story.step(
		'Ghế cần bảo dưỡng tách thành dòng riêng theo tình trạng',
		async () => {
			await addStock(page, {
				type: 'Ghế',
				room: 'Phòng ở 1',
				quantity: '5',
				condition: t('materials:condition.needs_maintenance')
			})
			await expect(rowFor(page, 'Ghế')).toHaveCount(2)
			await expect(
				rowFor(page, t('materials:condition.needs_maintenance'))
			).toContainText('5')
		}
	)

	await story.step('Sửa số lượng ghế cần bảo dưỡng còn 3', async () => {
		await openMenu(rowFor(page, t('materials:condition.needs_maintenance')))
		await page
			.getByRole('menuitem', { name: t('materials:actions.update') })
			.click()
		await dialog(page).locator('#edit-stock-quantity').fill('3')
		await rest(page)
		await dialog(page)
			.getByRole('button', { name: t('materials:form.save') })
			.click()
		await toast(page, t('materials:stockEdit.updated'))
		await expect(
			rowFor(page, t('materials:condition.needs_maintenance'))
		).toContainText('3')
	})

	await story.step(
		'Mở tab Vũ khí/trang bị: chưa có khí tài nào',
		async () => {
			await page
				.getByRole('tab', { name: t('units:tabs.weapons') })
				.click()
			await expect(
				page.getByText(t('units:company.noWeapons'))
			).toBeVisible()
		}
	)

	await story.step(
		'Thêm khí tài thứ nhất: AK-0001 để ở Kho vũ khí, cấp cho Phạm Văn An',
		async () => {
			await addAsset(page, {
				serial: 'AK-0001',
				room: 'Kho vũ khí',
				trooper: 'Phạm Văn An'
			})
			await expect(rowFor(page, 'AK-0001')).toContainText('Phạm Văn An')
		}
	)

	await story.step(
		'Thêm khí tài thứ hai: AK-0002, chưa cấp cho ai',
		async () => {
			await addAsset(page, { serial: 'AK-0002', room: 'Kho vũ khí' })
			await expect(rowFor(page, 'AK-0002')).toContainText(
				t('materials:shared.notAssigned')
			)
		}
	)

	await story.step(
		'AK-0002 bị hư hỏng: đổi trạng thái kèm ghi chú',
		async () => {
			await openMenu(rowFor(page, 'AK-0002'))
			await page
				.getByRole('menuitem', {
					name: t('materials:assetTable.allocate')
				})
				.click()
			await choose(
				page,
				dialog(page).locator('#edit-asset-status'),
				t('materials:assetStatus.damaged')
			)
			await dialog(page)
				.locator('#edit-asset-note')
				.fill('Hỏng lò xo hồi vị, chờ sửa chữa')
			await rest(page)
			await dialog(page)
				.getByRole('button', { name: t('materials:form.save') })
				.click()
			await toast(page, t('materials:assetEdit.updated'))
			await expect(rowFor(page, 'AK-0002')).toContainText(
				t('materials:assetStatus.damaged')
			)
		}
	)

	await story.step(
		'Lịch sử của AK-0002 ghi lại lần đổi trạng thái',
		async () => {
			await openMenu(rowFor(page, 'AK-0002'))
			await page
				.getByRole('menuitem', {
					name: t('materials:assetTable.history')
				})
				.click()
			await expect(dialog(page)).toContainText(
				t('materials:assetHistory.events.status_changed')
			)
			await page.keyboard.press('Escape')
			await expect(page.getByRole('dialog')).toHaveCount(0)
		}
	)

	await story.step('Mã QR của AK-0001 để in và dán lên khí tài', async () => {
		await openMenu(rowFor(page, 'AK-0001'))
		await page
			.getByRole('menuitem', {
				name: t('materials:assetTable.downloadQr')
			})
			.click()
		await expect(
			dialog(page).getByText(
				t('materials:assetQr.title', { serial: 'AK-0001' })
			)
		).toBeVisible()
		await page.keyboard.press('Escape')
		await expect(page.getByRole('dialog')).toHaveCount(0)
	})
})

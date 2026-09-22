import type { Page } from '@playwright/test'
import { ADMIN, ADMIN_STATE, expect, test } from '../support/story'
import { rest } from '../support/pace'
import { t } from '../support/text'
import {
	buildResults,
	DAMAGED,
	GOOD,
	NEEDS_MAINTENANCE,
	resultsQrPng,
	type Challenge
} from '../support/inventory'
import {
	APPROVER,
	REQUESTER,
	loginLabels,
	rowFor as proposalRowFor,
	sheet,
	submitProposal
} from '../support/proposals'
import { choose, login, signOut } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

// The scan half of the round trip (challenge QR -> phone counts offline ->
// signed results QR) has no phone in this suite, so the test plays the
// phone's part itself: it reads the real challenge back from the network,
// builds a results payload with the same HMAC the phone would compute (see
// support/inventory.ts), renders it as a QR PNG and feeds that through the
// scanner's own "upload a photo instead" fallback - exercising the real
// signature check and the real diff/apply code on the server, just without
// a camera.

const dialog = (page: Page) => page.getByRole('dialog').last()
const rowFor = (page: Page, text: string) =>
	page.getByRole('row').filter({ hasText: text })
const toast = (page: Page, text: string) =>
	expect(page.getByText(text).first()).toBeVisible()

test('inventory sessions: reconcile a room by QR, then a handover export', async ({
	page,
	story
}) => {
	await page.goto('/dai-doi/c1?id=2')
	await story.chapter(
		'Kiểm kê bằng mã QR',
		'Đối chiếu vũ khí và vật tư của một phòng qua vòng quét mã QR → xem chênh lệch → áp dụng vào tồn kho'
	)

	await page.getByRole('tab', { name: t('units:tabs.facilities') }).click()

	const roomsSheetOf = () => page.getByRole('dialog').first()
	const roomRow = (name: string) =>
		roomsSheetOf()
			.locator('div.rounded-md.border')
			.filter({ hasText: name })
	const diffRow = (text: string) =>
		dialog(page)
			.locator('div.rounded-md.border.p-2.text-sm')
			.filter({ hasText: text })

	await story.step('Mở danh sách phòng của Nhà Đại đội 1', async () => {
		await page
			.getByRole('button', {
				name: t('units:facilities.building.manageRooms')
			})
			.click()
		await expect(roomRow('Kho vũ khí')).toBeVisible()
		await expect(roomRow('Phòng ở 1')).toBeVisible()
	})

	let assetsChallenge: Challenge
	await story.step(
		'Tạo mã QR kiểm kê cho Kho vũ khí: hai khẩu súng cần đối chiếu',
		async () => {
			await roomRow('Kho vũ khí')
				.getByTitle(t('materials:inventory.dialog.triggerTitle'))
				.click()
			const [createResp] = await Promise.all([
				page.waitForResponse(
					(r) =>
						r.url().endsWith('/inventory-sessions') &&
						r.request().method() === 'POST'
				),
				dialog(page)
					.getByRole('button', {
						name: t('materials:inventory.dialog.create')
					})
					.click()
			])
			assetsChallenge = await createResp.json()
			expect(assetsChallenge.expected).toHaveLength(2)
			await expect(
				dialog(page).getByText(
					t('materials:inventory.dialog.challengeSummary', {
						assets: 2,
						stocks: 0
					})
				)
			).toBeVisible()
			await rest(page)
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.dialog.scanResults')
				})
				.click()
		}
	)

	await story.step(
		'Trên điện thoại: AK-0001 khớp, AK-0002 không tìm thấy - quét kết quả về',
		async () => {
			const results = buildResults(assetsChallenge, {
				assets: [['AK-0001', GOOD]]
			})
			const png = await resultsQrPng(results)
			const [resultsResp] = await Promise.all([
				page.waitForResponse(
					(r) =>
						r.url().endsWith('/inventory-sessions/results') &&
						r.request().method() === 'POST'
				),
				dialog(page).locator('input[type=file]').setInputFiles({
					name: 'ket-qua-kho-vu-khi.png',
					mimeType: 'image/png',
					buffer: png
				})
			])
			expect(resultsResp.ok()).toBeTruthy()
			await expect(
				dialog(page).getByRole('button', {
					name: t('materials:inventory.dialog.confirm')
				})
			).toBeVisible()
			await expect(diffRow('AK-0001')).toContainText(
				t('materials:inventory.diffStatus.matched')
			)
			await expect(diffRow('AK-0002')).toContainText(
				t('materials:inventory.diffStatus.missing')
			)
		}
	)

	await story.step(
		'Xác nhận kết quả rồi áp dụng: AK-0002 tự động chuyển sang "Mất"',
		async () => {
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.dialog.confirm')
				})
				.click()
			await toast(page, t('materials:inventory.dialog.confirmed'))
			await expect(
				dialog(page).getByText(
					t('materials:inventory.apply.automatic', {
						missing: 1,
						conditionChanged: 0
					})
				)
			).toBeVisible()
			await rest(page)
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.apply.title')
				})
				.click()
			await toast(
				page,
				t('materials:inventory.apply.success', {
					missing: 1,
					conditionChanged: 0,
					extraAssets: 0,
					stockLines: 0
				})
			)
			await page.keyboard.press('Escape')
			// Only the rooms sheet is left open behind it.
			await expect(page.getByRole('dialog')).toHaveCount(1)
		}
	)

	let stockChallenge: Challenge
	await story.step(
		'Tạo mã QR kiểm kê cho Phòng ở 1: 30 ghế tốt và 3 ghế cần bảo dưỡng',
		async () => {
			await roomRow('Phòng ở 1')
				.getByTitle(t('materials:inventory.dialog.triggerTitle'))
				.click()
			const [createResp] = await Promise.all([
				page.waitForResponse(
					(r) =>
						r.url().endsWith('/inventory-sessions') &&
						r.request().method() === 'POST'
				),
				dialog(page)
					.getByRole('button', {
						name: t('materials:inventory.dialog.create')
					})
					.click()
			])
			stockChallenge = await createResp.json()
			expect(stockChallenge.expectedStocks).toHaveLength(2)
			await rest(page)
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.dialog.scanResults')
				})
				.click()
		}
	)

	await story.step(
		'Trên điện thoại: thiếu 2 ghế tốt, đủ ghế cần bảo dưỡng, phát sinh 2 ghế hư hỏng',
		async () => {
			const gheId = stockChallenge.expectedStocks[0][0]
			const maintQty = stockChallenge.expectedStocks.find(
				(row) => row[2] === NEEDS_MAINTENANCE
			)![3]
			const results = buildResults(stockChallenge, {
				stocks: [
					[gheId, GOOD, 28],
					[gheId, NEEDS_MAINTENANCE, maintQty],
					[gheId, DAMAGED, 2]
				]
			})
			const png = await resultsQrPng(results)
			const [resultsResp] = await Promise.all([
				page.waitForResponse(
					(r) =>
						r.url().endsWith('/inventory-sessions/results') &&
						r.request().method() === 'POST'
				),
				dialog(page).locator('input[type=file]').setInputFiles({
					name: 'ket-qua-phong-o-1.png',
					mimeType: 'image/png',
					buffer: png
				})
			])
			expect(resultsResp.ok()).toBeTruthy()
			await expect(diffRow(t('materials:condition.good'))).toContainText(
				t('materials:inventory.stockDiffStatus.short')
			)
			await expect(
				diffRow(t('materials:condition.needs_maintenance'))
			).toContainText(t('materials:inventory.stockDiffStatus.matched'))
			await expect(
				diffRow(t('materials:condition.damaged'))
			).toContainText(t('materials:inventory.stockDiffStatus.extra'))
		}
	)

	await story.step(
		'Xác nhận rồi chọn áp dụng cả hai dòng chênh lệch vật tư',
		async () => {
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.dialog.confirm')
				})
				.click()
			await toast(page, t('materials:inventory.dialog.confirmed'))
			await dialog(page)
				.locator('label')
				.filter({ hasText: '28' })
				.getByRole('checkbox')
				.click()
			await dialog(page)
				.locator('label')
				.filter({ hasText: t('materials:condition.damaged') })
				.getByRole('checkbox')
				.click()
			await rest(page)
			await dialog(page)
				.getByRole('button', {
					name: t('materials:inventory.apply.title')
				})
				.click()
			await toast(
				page,
				t('materials:inventory.apply.success', {
					missing: 0,
					conditionChanged: 0,
					extraAssets: 0,
					stockLines: 2
				})
			)
			await page.keyboard.press('Escape')
			await page.keyboard.press('Escape')
			await expect(page.getByRole('dialog')).toHaveCount(0)
		}
	)

	await story.step(
		'Kết quả đã ghi vào tồn kho của Phòng ở 1: 28 tốt, 3 cần bảo dưỡng, 2 hư hỏng',
		async () => {
			const roomRowOf = (conditionLabel: string) =>
				rowFor(page, 'Phòng ở 1').filter({ hasText: conditionLabel })
			await expect(
				roomRowOf(t('materials:condition.good'))
			).toContainText('28')
			await expect(
				roomRowOf(t('materials:condition.needs_maintenance'))
			).toContainText('3')
			await expect(
				roomRowOf(t('materials:condition.damaged'))
			).toContainText('2')
		}
	)

	await story.step(
		'Kết quả cũng ghi vào Kho vũ khí: AK-0002 chuyển thành "Mất"',
		async () => {
			await page
				.getByRole('tab', { name: t('units:tabs.weapons') })
				.click()
			await expect(rowFor(page, 'AK-0001')).toContainText(
				t('materials:assetStatus.in_service')
			)
			await expect(rowFor(page, 'AK-0002')).toContainText(
				t('materials:assetStatus.lost')
			)
		}
	)

	await story.step(
		'Lịch sử kiểm kê của Kho vũ khí ghi lại phiên đã xác nhận',
		async () => {
			await page
				.getByRole('tab', { name: t('units:tabs.facilities') })
				.click()
			await page
				.getByRole('button', {
					name: t('units:facilities.building.manageRooms')
				})
				.click()
			await roomRow('Kho vũ khí')
				.getByTitle(t('units:facilities.room.inventoryHistory'))
				.click()
			const history = page.getByRole('dialog').last()
			await expect(
				history.getByText(
					t('materials:inventory.sessionStatus.reviewed')
				)
			).toBeVisible()
			await page.keyboard.press('Escape')
			await expect(page.getByRole('dialog')).toHaveCount(1)
			// The rooms sheet is a Sheet nested behind the Sheet just closed -
			// Escape stops being honoured by it in that specific sequence
			// (a Radix sheet-in-sheet quirk, not a real bug), so the rooms
			// sheet closes via its own visible close button instead.
			await page
				.getByRole('dialog')
				.getByRole('button', { name: 'Close' })
				.click()
			await expect(page.getByRole('dialog')).toHaveCount(0)
		}
	)

	await story.step(
		'Bàn giao vật tư sang Đại đội 2: đăng nhập bằng tài khoản chính ủy',
		async () => {
			await signOut(page, t)
			await login(page, loginLabels(), REQUESTER)
			await expect(page).not.toHaveURL(/login/)
			await page.goto('/chuyen-giao-tai-san')
		}
	)

	const SOURCE = /^Đại đội 1 \(/
	const DESTINATION = /^Đại đội 2 Hỏa lực \(/

	await story.step(
		'Tạo yêu cầu bàn giao: chuyển toàn bộ ghế còn tốt sang Đại đội 2',
		async () => {
			await page
				.getByRole('button', {
					name: t('proposals:transfer.createButton')
				})
				.click()
			const combobox = sheet(page).getByRole('combobox')
			await choose(page, combobox.nth(0), SOURCE)
			await choose(page, combobox.nth(1), DESTINATION)
			await choose(page, combobox.nth(3), APPROVER.displayName)
			await sheet(page)
				.getByRole('tab', { name: t('proposals:transfer.stocks') })
				.click()
			// Phòng ở 1 now has Ghế split across three conditions (good,
			// needs_maintenance, damaged) after the inventory session above -
			// only the "good" line is meant to move.
			await sheet(page)
				.locator('form')
				.getByRole('checkbox', { name: /Ghế \(good\)/ })
				.check()
			await rest(page)
			await submitProposal(page, 'transfer')
			await expect(proposalRowFor(page, '1 vật tư')).toBeVisible()
		}
	)

	await story.step(
		'Duyệt yêu cầu: đăng nhập bằng tài khoản tiểu đoàn trưởng',
		async () => {
			await signOut(page, t)
			await login(page, loginLabels(), APPROVER)
			await expect(page).not.toHaveURL(/login/)
			await page.goto('/chuyen-giao-tai-san')
			page.once('dialog', (confirm) => confirm.accept())
			await proposalRowFor(page, '1 vật tư')
				.getByRole('button', { name: t('proposals:common.approve') })
				.click()
			await toast(page, t('proposals:transfer.approved'))
		}
	)

	await story.step(
		'Xuất biên bản bàn giao cho yêu cầu đã duyệt',
		async () => {
			const [download] = await Promise.all([
				page.waitForEvent('download'),
				proposalRowFor(page, '1 vật tư')
					.getByRole('button', {
						name: t('proposals:transfer.exportHandover')
					})
					.click()
			])
			expect(download.suggestedFilename()).toMatch(/\.docx$/)
		}
	)

	await story.step('Quay lại tài khoản quản trị', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), ADMIN)
		await expect(page).not.toHaveURL(/login/)
		await page.context().storageState({ path: ADMIN_STATE })
	})
})

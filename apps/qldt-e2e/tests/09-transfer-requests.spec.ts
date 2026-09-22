import type { Page } from '@playwright/test'
import { ADMIN, ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import {
	APPROVER,
	REQUESTER,
	loginLabels,
	pickTrooper,
	rowFor,
	sheet,
	submitProposal
} from '../support/proposals'
import { choose, login, signOut } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

const SOURCE = /^Đại đội 1 \(/
const DESTINATION = /^Đại đội 2 Hỏa lực \(/

const openForm = (page: Page) =>
	page
		.getByRole('button', { name: t('proposals:transfer.createButton') })
		.click()

// Source and destination unit, then the approver, in the order the form is read.
async function fillHeader(page: Page) {
	const combobox = sheet(page).getByRole('combobox')
	await choose(page, combobox.nth(0), SOURCE)
	await choose(page, combobox.nth(1), DESTINATION)
	await choose(page, combobox.nth(3), APPROVER.displayName)
}

const submit = (page: Page) => submitProposal(page, 'transfer')

test('transfer requests: move troopers to another unit, then approve, reject or cancel', async ({
	page,
	story
}) => {
	await page.goto('/chuyen-giao-tai-san')
	await story.chapter(
		'Bàn giao quân số',
		'Yêu cầu chuyển quân nhân sang đơn vị khác → chỉ huy cấp trên chung duyệt → quân nhân về đơn vị mới'
	)

	await story.step('Trang bàn giao còn trống', async () => {
		await expect(
			page.getByText(t('proposals:transfer.emptyTable'))
		).toBeVisible()
	})

	await story.step('Đăng nhập bằng tài khoản chính ủy', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), REQUESTER)
		await expect(page).not.toHaveURL(/login/)
		await page.goto('/chuyen-giao-tai-san')
	})

	await story.step(
		'Chưa chọn đơn vị thì chưa chọn được người duyệt, biểu mẫu nói rõ vì sao',
		async () => {
			await openForm(page)
			await expect(
				sheet(page).getByRole('combobox').nth(3)
			).toBeDisabled()
			await expect(
				sheet(page).getByText(
					t('proposals:transfer.approverNeedsUnits')
				)
			).toBeVisible()
			await expect(
				sheet(page).getByText(
					t('proposals:transfer.pickSourceForResources')
				)
			).toBeVisible()
			await expect(
				sheet(page).getByRole('button', {
					name: t('proposals:transfer.submit'),
					exact: true
				})
			).toBeDisabled()
		}
	)

	await story.step(
		'Chọn đơn vị nguồn và đích: người duyệt là chỉ huy của đơn vị cấp trên chung',
		async () => {
			const combobox = sheet(page).getByRole('combobox')
			await choose(page, combobox.nth(0), SOURCE)
			await choose(page, combobox.nth(1), DESTINATION)
			await expect(
				sheet(page).getByText(t('proposals:transfer.approverHint'))
			).toBeVisible()
			await combobox.nth(3).click()
			await expect(
				page.getByRole('option', { name: APPROVER.displayName })
			).toBeVisible()
			await page.keyboard.press('Escape')
		}
	)

	await story.step(
		'Danh sách quân nhân của Đại đội 1 (kể cả đơn vị cấp dưới) hiện ra để tích chọn',
		async () => {
			for (const name of ['Phạm Văn An', 'Vũ Đức Cường', 'Lò Văn Hòa']) {
				await expect(
					sheet(page)
						.locator('form')
						.getByRole('checkbox', { name: new RegExp(name) })
				).toBeVisible()
			}
			await page.keyboard.press('Escape')
			await expect(sheet(page)).toBeHidden()
		}
	)

	await story.step(
		'Yêu cầu thứ nhất: chuyển Lò Văn Hòa sang Đại đội 2, sau đó chính ủy tự hủy',
		async () => {
			await openForm(page)
			await fillHeader(page)
			await pickTrooper(page, 'Lò Văn Hòa')
			await submit(page)

			page.once('dialog', (confirm) => confirm.accept())
			await rowFor(page, '1 quân nhân')
				.getByRole('button', { name: t('proposals:common.cancel') })
				.click()
			await expect(
				page.getByText(t('proposals:transfer.cancelled')).first()
			).toBeVisible()
			await expect(rowFor(page, '1 quân nhân')).toContainText(
				t('proposals:status.cancelled')
			)
		}
	)

	await story.step(
		'Yêu cầu thứ hai: chuyển hai quân nhân An và Đức',
		async () => {
			await openForm(page)
			await fillHeader(page)
			await pickTrooper(page, 'Phạm Văn An')
			await pickTrooper(page, 'Nguyễn Minh Đức')
			await submit(page)
			await expect(rowFor(page, '2 quân nhân')).toBeVisible()
		}
	)

	await story.step('Yêu cầu thứ ba: chuyển Vũ Đức Cường', async () => {
		await openForm(page)
		await fillHeader(page)
		await pickTrooper(page, 'Vũ Đức Cường')
		await submit(page)
		await expect(
			rowFor(page, '1 quân nhân').filter({
				hasText: t('proposals:status.pending')
			})
		).toBeVisible()
	})

	await story.step('Đăng nhập bằng tài khoản tiểu đoàn trưởng', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), APPROVER)
		await expect(page).not.toHaveURL(/login/)
		await page.goto('/chuyen-giao-tai-san')
		await expect(rowFor(page, '2 quân nhân')).toBeVisible()
	})

	await story.step(
		'Từ chối yêu cầu chuyển hai quân nhân và nêu lý do',
		async () => {
			await rowFor(page, '2 quân nhân')
				.getByRole('button', { name: t('proposals:common.reject') })
				.click()
			const dialog = page.getByRole('dialog')
			await dialog
				.getByLabel(t('proposals:reject.reasonLabel'))
				.fill('Đại đội 1 đang thiếu quân số')
			await dialog
				.getByRole('button', {
					name: t('proposals:common.reject'),
					exact: true
				})
				.click()
			await expect(
				page.getByText(t('proposals:transfer.rejected')).first()
			).toBeVisible()
			await expect(rowFor(page, '2 quân nhân')).toContainText(
				t('proposals:status.rejected')
			)
		}
	)

	await story.step('Duyệt yêu cầu chuyển Cường', async () => {
		page.once('dialog', (confirm) => confirm.accept())
		await rowFor(page, '1 quân nhân')
			.filter({ hasText: t('proposals:status.pending') })
			.getByRole('button', { name: t('proposals:common.approve') })
			.click()
		await expect(
			page.getByText(t('proposals:transfer.approved')).first()
		).toBeVisible()
	})

	await story.step(
		'Ba yêu cầu, ba kết quả: đã hủy, bị từ chối, đã duyệt',
		async () => {
			await expect(rowFor(page, '2 quân nhân')).toContainText(
				t('proposals:status.rejected')
			)
			await expect(
				rowFor(page, '1 quân nhân').filter({
					hasText: t('proposals:status.approved')
				})
			).toHaveCount(1)
			await expect(
				rowFor(page, '1 quân nhân').filter({
					hasText: t('proposals:status.cancelled')
				})
			).toHaveCount(1)
		}
	)

	await story.step(
		'Chi tiết yêu cầu đã duyệt: hai đơn vị và quân nhân được chuyển',
		async () => {
			await rowFor(page, '1 quân nhân')
				.filter({ hasText: t('proposals:status.approved') })
				.getByRole('button', { name: t('proposals:common.view') })
				.click()
			const detail = page.getByRole('dialog')
			await expect(
				detail.getByText(t('proposals:transfer.detailTitle'))
			).toBeVisible()
			await expect(detail.getByText('Vũ Đức Cường')).toBeVisible()
			await expect(
				detail.getByText(t('proposals:itemStatus.approved'))
			).toBeVisible()
			await page.keyboard.press('Escape')
		}
	)

	await story.step(
		'Cường đã sang Đại đội 2 Hỏa lực và không còn ở Đại đội 1',
		async () => {
			await page.goto('/dai-doi/c2?id=3')
			await expect(rowFor(page, 'Vũ Đức Cường')).toBeVisible()
			await page.goto('/dai-doi/c1?id=2')
			await expect(rowFor(page, 'Phạm Văn An')).toBeVisible()
			await expect(rowFor(page, 'Vũ Đức Cường')).toHaveCount(0)
		}
	)

	await story.step('Quay lại tài khoản quản trị', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), ADMIN)
		await expect(page).not.toHaveURL(/login/)
		await page.context().storageState({ path: ADMIN_STATE })
	})
})

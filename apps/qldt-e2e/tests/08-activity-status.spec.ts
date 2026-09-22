import type { Page } from '@playwright/test'
import { ADMIN, ADMIN_STATE, expect, test } from '../support/story'
import { rest } from '../support/pace'
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

const BATTALION = /^Tiểu đoàn 8/
const status = (name: string) => t(`proposals:activityStatus.${name}`)

const submit = (page: Page) => submitProposal(page, 'activity')

const openForm = (page: Page) =>
	page
		.getByRole('button', { name: t('proposals:activity.createButton') })
		.click()

// Unit, status and approver, in the order the form is read.
async function fillHeader(page: Page, proposal: { status: string }) {
	const combobox = sheet(page).getByRole('combobox')
	await choose(page, combobox.nth(0), BATTALION)
	await choose(page, combobox.nth(1), proposal.status)
	await choose(page, combobox.nth(2), APPROVER.displayName)
}

// A status that lasts a while is proposed with a range: from today (so it
// takes effect on approval) to the day after.
async function pickRangeFromToday(page: Page) {
	await sheet(page)
		.getByRole('button', { name: t('proposals:activity.pickDateRange') })
		.click()
	const today = page.locator('td[data-today=true]')
	await today.locator('button').click()
	await today.locator('xpath=following::td[1]//button').click()
	await page.keyboard.press('Escape')
	await rest(page)
}

async function pickToday(page: Page) {
	await sheet(page)
		.getByRole('button', { name: t('proposals:common.pickEffectiveDate') })
		.click()
	await page.locator('td[data-today=true] button').click()
	await rest(page)
}

const filterBy = (page: Page, label: string) =>
	choose(page, page.getByRole('combobox').first(), label)

test('activity status: propose a status change, then approve, reject or cancel', async ({
	page,
	story
}) => {
	await page.goto('/de-xuat-che-do')
	await story.chapter(
		'Đề xuất chế độ',
		'Nghỉ phép, nghỉ tuần, xuất ngũ… được đề xuất và phê duyệt như thăng quân hàm'
	)

	await story.step('Trang đề xuất chế độ còn trống', async () => {
		await expect(
			page.getByText(t('proposals:activity.emptyTable'))
		).toBeVisible()
	})

	await story.step('Đăng nhập bằng tài khoản chính ủy', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), REQUESTER)
		await expect(page).not.toHaveURL(/login/)
		await page.goto('/de-xuat-che-do')
	})

	await story.step(
		'Chỉ có bốn chế độ để đề xuất: nghỉ phép năm, nghỉ tuần, luyện tập và xuất ngũ',
		async () => {
			await openForm(page)
			await sheet(page).getByRole('combobox').nth(1).click()
			const options = page.getByRole('option')
			await expect(options).toHaveCount(4)
			for (const name of [
				'annual_leave',
				'weekly_leave',
				'rehearsal',
				'discharged'
			]) {
				await expect(
					options.filter({ hasText: status(name) })
				).toBeVisible()
			}
			await page.keyboard.press('Escape')
		}
	)

	await story.step(
		'Đề xuất thứ nhất: Phạm Văn An nghỉ phép năm, có ngày bắt đầu và ngày kết thúc',
		async () => {
			await fillHeader(page, { status: status('annual_leave') })
			// Still missing: the dates, then the troopers.
			await expect(sheet(page).locator('p[aria-live=polite]')).toHaveText(
				t('proposals:activity.missingDates')
			)
			await pickRangeFromToday(page)
			await pickTrooper(page, 'Phạm Văn An')
			await submit(page)
			await expect(rowFor(page, status('annual_leave'))).toBeVisible()
		}
	)

	await story.step(
		'Đề xuất thứ hai: Vũ Đức Cường xuất ngũ, chỉ cần một ngày hiệu lực',
		async () => {
			await openForm(page)
			await fillHeader(page, { status: status('discharged') })
			await pickToday(page)
			await pickTrooper(page, 'Vũ Đức Cường')
			await submit(page)
			await expect(rowFor(page, status('discharged'))).toBeVisible()
		}
	)

	await story.step(
		'Đề xuất thứ ba: Lò Văn Hòa nghỉ tuần, sau đó chính ủy tự hủy',
		async () => {
			await openForm(page)
			await fillHeader(page, { status: status('weekly_leave') })
			await pickRangeFromToday(page)
			await pickTrooper(page, 'Lò Văn Hòa')
			await submit(page)

			page.once('dialog', (confirm) => confirm.accept())
			await rowFor(page, status('weekly_leave'))
				.getByRole('button', { name: t('proposals:common.cancel') })
				.click()
			await expect(
				page.getByText(t('proposals:activity.cancelled')).first()
			).toBeVisible()
			await expect(rowFor(page, status('weekly_leave'))).toContainText(
				t('proposals:status.cancelled')
			)
		}
	)

	await story.step('Đăng nhập bằng tài khoản tiểu đoàn trưởng', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), APPROVER)
		await expect(page).not.toHaveURL(/login/)
		await page.goto('/de-xuat-che-do')
	})

	await story.step(
		'Lọc theo trạng thái "Chờ duyệt": đề xuất đã hủy không còn trong danh sách',
		async () => {
			await filterBy(page, t('proposals:status.pending'))
			await expect(rowFor(page, status('annual_leave'))).toBeVisible()
			await expect(rowFor(page, status('discharged'))).toBeVisible()
			await expect(rowFor(page, status('weekly_leave'))).toHaveCount(0)
		}
	)

	await story.step('Từ chối đề xuất xuất ngũ và nêu lý do', async () => {
		await rowFor(page, status('discharged'))
			.getByRole('button', { name: t('proposals:common.reject') })
			.click()
		const dialog = page.getByRole('dialog')
		await dialog
			.getByLabel(t('proposals:reject.reasonLabel'))
			.fill('Chưa đến kỳ xuất ngũ')
		await dialog
			.getByRole('button', {
				name: t('proposals:common.reject'),
				exact: true
			})
			.click()
		await expect(
			page.getByText(t('proposals:activity.rejected')).first()
		).toBeVisible()
	})

	await story.step('Duyệt đề xuất nghỉ phép năm của An', async () => {
		page.once('dialog', (confirm) => confirm.accept())
		await rowFor(page, status('annual_leave'))
			.getByRole('button', { name: t('proposals:common.approve') })
			.click()
		await expect(
			page.getByText(t('proposals:activity.approved')).first()
		).toBeVisible()
	})

	await story.step(
		'Bỏ lọc: cả ba đề xuất hiện với ba trạng thái khác nhau',
		async () => {
			await filterBy(page, t('proposals:status.all'))
			await expect(rowFor(page, status('annual_leave'))).toContainText(
				t('proposals:status.approved')
			)
			await expect(rowFor(page, status('discharged'))).toContainText(
				t('proposals:status.rejected')
			)
			await expect(rowFor(page, status('weekly_leave'))).toContainText(
				t('proposals:status.cancelled')
			)
		}
	)

	await story.step(
		'Chi tiết đề xuất đã duyệt: khoảng ngày và kết quả của từng quân nhân',
		async () => {
			await rowFor(page, status('annual_leave'))
				.getByRole('button', { name: t('proposals:common.view') })
				.click()
			const detail = page.getByRole('dialog')
			await expect(
				detail.getByText(t('proposals:activity.detailTitle'))
			).toBeVisible()
			await expect(detail.getByText('Phạm Văn An')).toBeVisible()
			await expect(
				detail.getByText(t('proposals:itemStatus.approved'))
			).toBeVisible()
			await page.keyboard.press('Escape')
		}
	)

	await story.step(
		'Hồ sơ của An đã ghi tình trạng mới: nghỉ phép năm',
		async () => {
			await page.goto('/dai-doi/c1?id=2')
			await rowFor(page, 'Phạm Văn An')
				.getByRole('button', { name: t('table:rowActions.openMenu') })
				.click()
			await page
				.getByRole('menuitem', { name: t('table:rowActions.details') })
				.click()
			// The read-only profile leaves the status out; the edit form shows
			// it (nothing is saved: the dialog is closed again).
			const record = page.getByRole('dialog')
			await record
				.getByRole('button', { name: t('student:actions.edit') })
				.click()
			await record
				.getByRole('button', {
					name: new RegExp(
						t('student:record.sections.military.label')
					)
				})
				.click()
			await expect(
				record.getByRole('combobox', {
					name: t('student:fields.activityStatus')
				})
			).toHaveText(status('annual_leave'))
			// The first Escape leaves edit mode, the second closes the profile.
			await page.keyboard.press('Escape')
			await page.keyboard.press('Escape')
			await expect(page.getByRole('dialog')).toHaveCount(0)
		}
	)

	await story.step('Quay lại tài khoản quản trị', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), ADMIN)
		await expect(page).not.toHaveURL(/login/)
		await page.context().storageState({ path: ADMIN_STATE })
	})
})

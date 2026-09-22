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
	submitProposal,
	troopers
} from '../support/proposals'
import { assignRole, choose, createUser, login, signOut } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

// Unit, approver and effective date, in the order the form is read.
async function fillHeader(
	page: Page,
	proposal: { rank: string; unit: string | RegExp }
) {
	const combobox = sheet(page).getByRole('combobox')
	await choose(page, combobox.nth(0), proposal.unit)
	await choose(
		page,
		sheet(page).getByLabel(t('proposals:rank.targetRank')),
		new RegExp(`^${proposal.rank}$`)
	)
	await choose(page, combobox.nth(2), APPROVER.displayName)
	await sheet(page)
		.getByRole('button', { name: t('proposals:common.pickEffectiveDate') })
		.click()
	// Promotions apply once their date has come, so the story picks today.
	await page.locator('td[data-today=true] button').click()
	await rest(page)
}

const submit = (page: Page) => submitProposal(page, 'rank')

test('rank promotion: propose, then approve, reject or cancel', async ({
	page,
	story
}) => {
	await page.goto('/list-user')
	await story.chapter(
		'Đề xuất thăng quân hàm',
		'Tạo đề xuất → người có thẩm quyền duyệt hoặc từ chối → quân hàm được cập nhật'
	)

	await story.step(
		'Tạo hai tài khoản cấp tiểu đoàn: chính ủy đề xuất, tiểu đoàn trưởng phê duyệt',
		async () => {
			await createUser(page, t, {
				...REQUESTER,
				unit: /^Tiểu đoàn 8/,
				rank: 'Thiếu tá',
				position: 'Chính trị viên tiểu đoàn'
			})
			await assignRole(page, t, REQUESTER.username, 'battalion_commander')
			await createUser(page, t, {
				...APPROVER,
				unit: /^Tiểu đoàn 8/,
				rank: 'Trung tá',
				position: 'Tiểu đoàn trưởng'
			})
			await assignRole(page, t, APPROVER.username, 'battalion_commander')
			await expect(rowFor(page, APPROVER.username)).toBeVisible()
		}
	)

	await story.step(
		'Ghi hai người vào bộ chỉ huy Tiểu đoàn 8: chỉ người giữ chức chỉ huy mới được đề xuất hoặc làm người duyệt',
		async () => {
			await page.goto('/quan-ly-don-vi')
			const card = page
				.locator('[data-slot=card]')
				.filter({ hasText: t('units:card.aliasLine', { alias: 'd8' }) })
			await card.hover()
			await card.getByTitle(t('units:card.edit')).click()
			const dialog = page.getByRole('dialog')
			await choose(
				page,
				dialog.getByLabel(t('units:commanders.commander'), {
					exact: true
				}),
				new RegExp(APPROVER.displayName)
			)
			await choose(
				page,
				dialog.getByLabel(t('units:commanders.politicalCommander'), {
					exact: true
				}),
				new RegExp(REQUESTER.displayName)
			)
			await dialog
				.getByRole('button', {
					name: t('units:form.update'),
					exact: true
				})
				.click()
			await dialog.waitFor({ state: 'hidden' })
		}
	)

	await story.step('Đăng nhập bằng tài khoản chính ủy', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), REQUESTER)
		await expect(page).not.toHaveURL(/login/)
	})

	await story.step('Trang đề xuất thăng quân hàm còn trống', async () => {
		await page.goto('/de-xuat-thang-quan-ham')
		await expect(
			page.getByText(t('proposals:rank.emptyTable'))
		).toBeVisible()
	})

	await story.step(
		'Mở biểu mẫu: chưa đủ thông tin thì nút tạo bị khóa và biểu mẫu nói còn thiếu gì',
		async () => {
			await page
				.getByRole('button', { name: t('proposals:rank.createButton') })
				.click()
			await expect(sheet(page)).toBeVisible()
			await expect(
				sheet(page).getByRole('button', {
					name: t('proposals:rank.submit')
				})
			).toBeDisabled()
			await expect(sheet(page).locator('p[aria-live=polite]')).toHaveText(
				t('proposals:common.missing.unit')
			)
		}
	)

	await story.step(
		'Chỉ quân nhân kém quân hàm đề xuất đúng một bậc mới được chọn; người khác bị làm mờ kèm lý do',
		async () => {
			await choose(
				page,
				sheet(page).getByRole('combobox').nth(0),
				/^Tiểu đoàn 8/
			)
			await choose(
				page,
				sheet(page).getByLabel(t('proposals:rank.targetRank')),
				/^Trung sĩ$/
			)
			// Trung sĩ is one step above Hạ sĩ: Đức and Cường qualify, An does not.
			await expect(
				troopers(page).getByRole('checkbox', { name: /Phạm Văn An/ })
			).toHaveCount(0)
			await expect(
				troopers(page).getByText(
					t('proposals:rank.reasonNotAdjacent', { rank: 'Trung sĩ' })
				)
			).not.toHaveCount(0)
			await expect(
				troopers(page).getByRole('checkbox', { name: /Vũ Đức Cường/ })
			).toBeVisible()
			await expect(
				troopers(page).getByRole('checkbox', {
					name: /Nguyễn Minh Đức/
				})
			).toBeVisible()
		}
	)

	await story.step(
		'Đề xuất thứ nhất: Vũ Đức Cường lên Trung sĩ',
		async () => {
			await fillHeader(page, { rank: 'Trung sĩ', unit: /^Tiểu đoàn 8/ })
			await pickTrooper(page, 'Vũ Đức Cường')
			// With nothing missing, the footer says what will be submitted.
			await expect(
				sheet(page).getByText(/Trung sĩ cho 1 quân nhân/)
			).toBeVisible()
			await submit(page)
			await expect(rowFor(page, 'Trung sĩ')).toBeVisible()
		}
	)

	await story.step('Đề xuất thứ hai: Phạm Văn An lên Hạ sĩ', async () => {
		await page
			.getByRole('button', { name: t('proposals:rank.createButton') })
			.click()
		await fillHeader(page, { rank: 'Hạ sĩ', unit: /^Tiểu đoàn 8/ })
		await pickTrooper(page, 'Phạm Văn An')
		await submit(page)
		await expect(rowFor(page, 'Hạ sĩ')).toBeVisible()
	})

	await story.step(
		'Đề xuất thứ ba: Lò Văn Hòa lên Thượng sĩ, sau đó chính ủy tự hủy',
		async () => {
			await page
				.getByRole('button', { name: t('proposals:rank.createButton') })
				.click()
			await fillHeader(page, { rank: 'Thượng sĩ', unit: /^Tiểu đoàn 8/ })
			await pickTrooper(page, 'Lò Văn Hòa')
			await submit(page)

			page.once('dialog', (confirm) => confirm.accept())
			await rowFor(page, 'Thượng sĩ')
				.getByRole('button', { name: t('proposals:common.cancel') })
				.click()
			await expect(
				page.getByText(t('proposals:rank.cancelled')).first()
			).toBeVisible()
			await expect(rowFor(page, 'Thượng sĩ')).toContainText(
				t('proposals:status.cancelled')
			)
		}
	)

	await story.step(
		'Chính ủy chỉ là người đề xuất, không phải người duyệt: không có nút Duyệt',
		async () => {
			await expect(rowFor(page, 'Hạ sĩ')).toBeVisible()
			await expect(
				rowFor(page, 'Hạ sĩ').getByRole('button', {
					name: t('proposals:common.approve')
				})
			).toHaveCount(0)
		}
	)

	await story.step('Đăng nhập bằng tài khoản tiểu đoàn trưởng', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), APPROVER)
		await expect(page).not.toHaveURL(/login/)
		await page.goto('/de-xuat-thang-quan-ham')
		await expect(rowFor(page, 'Hạ sĩ')).toBeVisible()
	})

	await story.step('Từ chối đề xuất của Cường và nêu lý do', async () => {
		await rowFor(page, 'Trung sĩ')
			.getByRole('button', { name: t('proposals:common.reject') })
			.click()
		const dialog = page.getByRole('dialog')
		await dialog
			.getByLabel(t('proposals:reject.reasonLabel'))
			.fill('Chưa đủ thời gian giữ quân hàm hiện tại')
		await dialog
			.getByRole('button', {
				name: t('proposals:common.reject'),
				exact: true
			})
			.click()
		await expect(
			page.getByText(t('proposals:rank.rejected')).first()
		).toBeVisible()
		await expect(rowFor(page, 'Trung sĩ')).toContainText(
			t('proposals:status.rejected')
		)
	})

	await story.step('Duyệt đề xuất của An', async () => {
		page.once('dialog', (confirm) => confirm.accept())
		await rowFor(page, 'Hạ sĩ')
			.getByRole('button', { name: t('proposals:common.approve') })
			.click()
		await expect(
			page.getByText(t('proposals:rank.approved')).first()
		).toBeVisible()
		await expect(rowFor(page, 'Hạ sĩ')).toContainText(
			t('proposals:status.approved')
		)
	})

	await story.step(
		'Xem chi tiết đề xuất đã duyệt: quân nhân được đánh dấu thành công',
		async () => {
			await rowFor(page, 'Hạ sĩ')
				.getByRole('button', { name: t('proposals:common.view') })
				.click()
			const detail = page.getByRole('dialog')
			await expect(
				detail.getByText(t('proposals:rank.detailTitle'))
			).toBeVisible()
			await expect(detail.getByText('Phạm Văn An')).toBeVisible()
			await expect(
				detail.getByText(t('proposals:itemStatus.approved'))
			).toBeVisible()
			await page.keyboard.press('Escape')
		}
	)

	await story.step(
		'Quân hàm của An đã đổi ngay trên danh sách quân nhân, Cường giữ nguyên',
		async () => {
			await page.goto('/dai-doi/c1?id=2')
			await expect(
				rowFor(page, 'Phạm Văn An').getByText('Hạ sĩ', { exact: true })
			).toBeVisible()
			await expect(
				rowFor(page, 'Vũ Đức Cường').getByText('Hạ sĩ', { exact: true })
			).toBeVisible()
		}
	)

	await story.step('Quay lại tài khoản quản trị', async () => {
		await signOut(page, t)
		await login(page, loginLabels(), ADMIN)
		await expect(page).not.toHaveURL(/login/)
		await page.context().storageState({ path: ADMIN_STATE })
	})
})

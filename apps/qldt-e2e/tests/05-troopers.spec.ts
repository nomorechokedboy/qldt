import type { Locator, Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { rest } from '../support/pace'
import { t } from '../support/text'

test.use({ storageState: ADMIN_STATE })

const dialog = (page: Page) => page.getByRole('dialog').last()
const place = (kind: 'birthPlace' | 'address') => t(`student:place.${kind}`)
const rowFor = (page: Page, name: string) =>
	page.getByRole('row').filter({ hasText: name })

// Dates are typed digit by digit: the field masks its own slashes and only
// keeps a whole date when it arrives as keystrokes or a paste.
async function typeDate(field: Locator, date: string) {
	await field.pressSequentially(date, { delay: 30 })
}

// Combobox with a search list: open it and take an option.
async function pick(page: Page, trigger: Locator, option: string | RegExp) {
	await trigger.click()
	await page.getByRole('option', { name: option }).first().click()
	await rest(page)
}

type Trooper = {
	name: string
	studentId: string
	dob: string
	unit: RegExp
	hometown: { province: string; street: string }
	residence: { province: string; street: string }
	ethnic: string
	phone?: string
	rank: string
	position: string
}

async function openWizard(page: Page) {
	await page.getByRole('button', { name: t('student:wizard.add') }).click()
	await expect(dialog(page)).toBeVisible()
}

const next = (page: Page) =>
	dialog(page).getByRole('button', { name: t('student:wizard.next') })

// Step 1: identity, unit, hometown and residence, ethnicity.
async function fillPersonal(page: Page, p: Trooper) {
	const d = dialog(page)
	await d
		.getByLabel(t('student:fields.fullName'), { exact: true })
		.fill(p.name)
	await d
		.getByLabel(t('student:create.studentId'), { exact: true })
		.fill(p.studentId)
	await typeDate(
		d.getByLabel(t('student:fields.dob'), { exact: true }),
		p.dob
	)
	if (p.phone) {
		await d
			.getByLabel(t('student:fields.phone'), { exact: true })
			.fill(p.phone)
	}
	await pick(
		page,
		d.getByRole('combobox', {
			name: t('student:fields.unit'),
			exact: true
		}),
		p.unit
	)
	for (const kind of ['birthPlace', 'address'] as const) {
		const where = kind === 'birthPlace' ? p.hometown : p.residence
		const label = (key: 'province' | 'ward' | 'street') =>
			t(`student:place.${key}`, { place: place(kind) })
		await pick(
			page,
			d.getByRole('combobox', { name: label('province') }),
			where.province
		)
		await pick(page, d.getByRole('combobox', { name: label('ward') }), /./)
		await d.getByLabel(label('street')).fill(where.street)
	}
	await pick(
		page,
		d.getByRole('combobox', {
			name: t('student:fields.ethnic'),
			exact: true
		}),
		new RegExp(`^${p.ethnic}$`)
	)
}

// Step 2: rank and position (the position list is the catalog from chapter 04).
async function fillMilitary(page: Page, p: Trooper) {
	const d = dialog(page)
	await pick(
		page,
		d.getByRole('combobox', {
			name: t('student:fields.rank'),
			exact: true
		}),
		new RegExp(`^${p.rank}$`)
	)
	await pick(
		page,
		d.getByRole('combobox', {
			name: t('student:fields.position'),
			exact: true
		}),
		new RegExp(`^${p.position}$`)
	)
}

// The short way: every required field, nothing else.
async function addTrooper(page: Page, p: Trooper) {
	await openWizard(page)
	await fillPersonal(page, p)
	await next(page).click()
	await fillMilitary(page, p)
	await next(page).click()
	await next(page).click()
	await dialog(page)
		.getByRole('button', { name: t('student:wizard.add'), exact: true })
		.click()
	await expect(page.getByText(t('student:wizard.created'))).toBeVisible()
	await expect(dialog(page)).toBeHidden()
}

// From the company page to one of its subordinate units, by that unit's card.
async function openUnit(page: Page, tab: string, unitName: string) {
	await page.getByRole('tab', { name: tab, exact: true }).click()
	const card = page.locator('[data-slot=card]').filter({ hasText: unitName })
	await card.hover()
	await card.getByTitle(t('units:card.manage')).click()
}

async function openDetails(page: Page, name: string) {
	await rowFor(page, name)
		.getByRole('button', { name: t('table:rowActions.openMenu') })
		.click()
	await page
		.getByRole('menuitem', { name: t('table:rowActions.details') })
		.click()
}

const AN: Trooper = {
	name: 'Phạm Văn An',
	studentId: 'QN0001',
	dob: '15032005',
	unit: /^Đại đội 1 \(/,
	hometown: { province: 'Hà Nội', street: '12 Phố Huế' },
	residence: { province: 'Hồ Chí Minh', street: '45 Lê Lợi' },
	ethnic: 'Kinh',
	phone: '0912345678',
	rank: 'Binh nhất',
	position: 'Chiến sĩ'
}
const DUC: Trooper = {
	name: 'Nguyễn Minh Đức',
	studentId: 'QN0002',
	dob: '02112004',
	unit: /^Trung đội 1 \(/,
	hometown: { province: 'Hải Phòng', street: '8 Điện Biên Phủ' },
	residence: { province: 'Hải Phòng', street: '8 Điện Biên Phủ' },
	ethnic: 'Kinh',
	rank: 'Hạ sĩ',
	position: 'Chiến sĩ'
}
const HOA: Trooper = {
	name: 'Lò Văn Hòa',
	studentId: 'QN0003',
	dob: '20072003',
	unit: /^Tiểu đội 1 \(/,
	hometown: { province: 'Đà Nẵng', street: '3 Nguyễn Văn Linh' },
	residence: { province: 'Đà Nẵng', street: '3 Nguyễn Văn Linh' },
	ethnic: 'Thái',
	rank: 'Trung sĩ',
	position: 'Tiểu đội trưởng'
}

test('troopers: add through the record wizard, then view and edit', async ({
	page,
	story
}) => {
	// Đại đội 1 is unit 2: the root is 1 and chapter 02 created it first.
	await page.goto('/dai-doi/c1?id=2')
	await story.chapter(
		'Hồ sơ quân nhân',
		'Thêm quân nhân qua biểu mẫu 4 bước, xem hồ sơ và chỉnh sửa'
	)

	await story.step(
		'Đại đội 1 chưa có quân nhân nào: đây là danh sách của đơn vị',
		async () => {
			await expect(
				page.getByRole('cell', { name: t('units:tabs.noStudentInfo') })
			).toBeVisible()
		}
	)

	await story.step(
		'Bước 1 — Thông tin cá nhân: các trường bắt buộc được kiểm tra ngay khi bấm Tiếp theo',
		async () => {
			await openWizard(page)
			await next(page).click()
			await expect(
				dialog(page).getByText(t('student:validation.fullNameRequired'))
			).toBeVisible()
			await expect(
				dialog(page).getByText(t('student:validation.ethnicRequired'))
			).toBeVisible()
		}
	)

	await story.step(
		'Nhập họ tên, mã số, ngày sinh, đơn vị, quê quán, trú quán và dân tộc',
		async () => {
			await fillPersonal(page, AN)
			await next(page).click()
		}
	)

	await story.step(
		'Bước 2 — Cấp bậc và chức vụ lấy từ danh mục',
		async () => {
			await fillMilitary(page, AN)
			await expect(
				dialog(page).getByRole('combobox', {
					name: t('student:fields.position'),
					exact: true
				})
			).toHaveText('Chiến sĩ')
			await next(page).click()
		}
	)

	await story.step('Bước 3 — Thông tin bố mẹ, anh chị em', async () => {
		const d = dialog(page)
		await d.getByLabel(t('student:create.fatherName')).fill('Phạm Văn Bảo')
		await d.getByLabel(t('student:create.fatherJob')).fill('Nông dân')
		await d.getByLabel(t('student:create.motherName')).fill('Trần Thị Lan')
		await d.getByLabel(t('student:create.motherJob')).fill('Giáo viên')
		await d
			.getByRole('button', { name: t('student:people.addSibling') })
			.click()
		await d
			.getByRole('textbox', {
				name: t('student:fields.siblingName')
			})
			.fill('Phạm Thị Mai')
		await typeDate(
			d.getByRole('textbox', {
				name: t('student:fields.dob'),
				exact: true
			}),
			'01092000'
		)
		await next(page).click()
	})

	await story.step(
		'Bước 4 — Vợ/chồng và con: bỏ trống vì quân nhân chưa kết hôn, rồi tạo hồ sơ',
		async () => {
			await dialog(page)
				.getByRole('button', {
					name: t('student:wizard.add'),
					exact: true
				})
				.click()
			await expect(
				page.getByText(t('student:wizard.created'))
			).toBeVisible()
			await expect(dialog(page)).toBeHidden()
			await expect(rowFor(page, AN.name)).toBeVisible()
		}
	)

	await story.step('Thêm quân nhân thứ hai, thuộc Trung đội 1', async () => {
		await addTrooper(page, DUC)
	})

	await story.step(
		'Thêm quân nhân thứ ba, thuộc Tiểu đội 1: một tiểu đội trưởng',
		async () => {
			await addTrooper(page, HOA)
		}
	)

	await story.step(
		'Mỗi đơn vị có danh sách riêng: Đại đội 1 chỉ hiện quân nhân đăng ký trực tiếp tại đó',
		async () => {
			await expect(rowFor(page, AN.name)).toBeVisible()
			await expect(rowFor(page, DUC.name)).toHaveCount(0)
			await expect(rowFor(page, HOA.name)).toHaveCount(0)
		}
	)

	await story.step(
		'Quân nhân của Trung đội 1 nằm ở trang của trung đội',
		async () => {
			await openUnit(page, t('units:tabs.platoons'), 'Trung đội 1')
			await expect(page).toHaveURL(/\/trung-doi\/b1/)
			await expect(rowFor(page, DUC.name)).toBeVisible()
			await expect(rowFor(page, AN.name)).toHaveCount(0)
		}
	)

	await story.step(
		'Tiểu đội trưởng hiện ở trang của Tiểu đội 1',
		async () => {
			await page.goto('/dai-doi/c1?id=2')
			await openUnit(page, t('units:tabs.squads'), 'Tiểu đội 1')
			await expect(rowFor(page, HOA.name)).toBeVisible()
			await expect(rowFor(page, HOA.name)).toContainText(
				'Tiểu đội trưởng'
			)
		}
	)

	await story.step('Quay lại Đại đội 1', async () => {
		await page.goto('/dai-doi/c1?id=2')
		await expect(rowFor(page, AN.name)).toBeVisible()
	})

	await story.step('Mở hồ sơ chi tiết của một quân nhân', async () => {
		await openDetails(page, AN.name)
		const d = dialog(page)
		await expect(d.getByText(AN.name).first()).toBeVisible()
		await expect(d.getByText(AN.studentId).first()).toBeVisible()
		await expect(d.getByText('15/03/2005').first()).toBeVisible()
	})

	await story.step('Chỉnh sửa hồ sơ: bổ sung số điện thoại', async () => {
		await dialog(page)
			.getByRole('button', { name: t('student:actions.edit') })
			.click()
		const d = dialog(page)
		await d
			.getByLabel(t('student:fields.phone'), { exact: true })
			.fill('0987654321')
		await d
			.getByRole('button', { name: t('student:editForm.save') })
			.click()
		await expect(
			page.getByText(t('table:cells.updateSuccess')).first()
		).toBeVisible()
		// The record closes on save; opening it again shows what was stored.
		await page.keyboard.press('Escape')
		await expect(page.getByRole('dialog')).toHaveCount(0)
		await openDetails(page, AN.name)
		await expect(dialog(page).getByText('0987654321')).toBeVisible()
	})
})

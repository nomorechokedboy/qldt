import type { Page } from '@playwright/test'
import { ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import { trooperWorkbook, type TrooperRow } from '../support/spreadsheet'

test.use({ storageState: ADMIN_STATE })

const XLSX_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Same company the troopers-bulk chapter imports into - already proven to
// accept this exact template shape.
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

function pad2(n: number) {
	return String(n).padStart(2, '0')
}

// The backend matches birthdays against SQLite's `'now'`, which is always
// UTC (see students/repo.ts) - so "today" for test data has to be computed
// in UTC too, not local time, or the match can be off by a day right at a
// UTC/local day boundary.
const now = new Date()
const todayDay = pad2(now.getUTCDate())
const todayMonthNum = now.getUTCMonth() + 1
const todayMonth = pad2(todayMonthNum)
const todayQuarterNum = Math.floor((todayMonthNum - 1) / 3) + 1
// Six months away always lands in a different month AND a different
// quarter (2 quarters apart, mod 4), regardless of what day it is.
const otherMonthNum = ((todayMonthNum - 1 + 6) % 12) + 1
const otherMonth = pad2(otherMonthNum)
const otherQuarterNum = Math.floor((otherMonthNum - 1) / 3) + 1

const BIRTHDAY_TROOPER: TrooperRow = {
	...common,
	fullName: 'Phan Đình Khánh',
	studentId: 'QN0100',
	dob: `${todayDay}/${todayMonth}/2000`,
	phone: '0933000100',
	birthPlaceDetail: '9 Hoàng Diệu',
	addressDetail: '9 Hoàng Diệu',
	rank: 'Binh nhì'
}
const OTHER_TROOPER: TrooperRow = {
	...common,
	fullName: 'Lương Văn Hạ',
	studentId: 'QN0101',
	dob: `15/${otherMonth}/2000`,
	phone: '0933000101',
	birthPlaceDetail: '21 Bà Triệu',
	addressDetail: '21 Bà Triệu',
	rank: 'Binh nhì'
}

const dialog = (page: Page) => page.getByRole('dialog').last()
const rowFor = (page: Page, name: string) =>
	page.getByRole('row').filter({ hasText: name })

async function kpiValue(page: Page, label: string) {
	// Scoped to the card whose *title* is exactly this label - a couple of
	// pages also show this same text as a substring elsewhere (e.g. the
	// political report's per-unit "Tổng quân số: N" lines), which a plain
	// hasText on the whole card would also match.
	const card = page.locator('[data-slot="card"]').filter({
		has: page.locator('[data-slot="card-title"]', {
			hasText: new RegExp(`^${label}$`)
		})
	})
	const text = await card.locator('.text-2xl').innerText()
	return Number(text.replace(/\D/g, ''))
}

async function pickUnit(page: Page, name: string) {
	await page.getByRole('combobox').first().click()
	await page.getByRole('option', { name, exact: true }).click()
}

async function filterByUnit(page: Page, name: string) {
	// The birthday tab's StudentTable toolbar has TWO buttons named "Đơn vị":
	// our UnitFacetedFilter (leftSection, grouped battalion -> companies -
	// the one we want) rendered first, then a second, generic column facet
	// from useStudentFacetedFilters (flat, one option per battalion, useless
	// for picking a company) rendered right after it - plus the sidebar's own
	// "Đơn vị" nav item outside the tab entirely. Scoping to the active
	// tabpanel drops the sidebar match; `.first()` then picks ours over the
	// generic one.
	await page
		.getByRole('tabpanel')
		.getByRole('button', { name: t('units:filters.unit'), exact: true })
		.first()
		.click()
	await page.getByRole('option', { name, exact: true }).click()
	await page.keyboard.press('Escape')
}

test('unit stats, birthdays and the political quality report', async ({
	page,
	story
}) => {
	await page.goto('/thong-ke-doanh-trai')
	await story.chapter(
		'Thống kê & báo cáo',
		'Thống kê theo đơn vị, danh sách sinh nhật đồng đội theo tuần/tháng/quý, báo cáo chất lượng chính trị'
	)

	let troopsBefore = 0
	let personnelBefore = 0

	await story.step(
		'Thống kê Đại đội 1 trước khi thêm quân nhân mới',
		async () => {
			await pickUnit(page, COMPANY)
			troopsBefore = await kpiValue(
				page,
				t('units:dashboard.kpiTotalTroops')
			)
		}
	)

	await story.step(
		'Báo cáo chất lượng chính trị trước khi thêm quân nhân mới',
		async () => {
			await page.goto('/thong-ke-chinh-tri')
			// The KPI card briefly renders "0" while the report data is still
			// loading, before the real total arrives - read too early and this
			// baseline silently locks in the loading-state zero instead of the
			// actual pre-import count.
			await page.waitForLoadState('networkidle')
			personnelBefore = await kpiValue(
				page,
				t('stats:report.totalPersonnel')
			)
		}
	)

	await story.step(
		'Thêm hai quân nhân mới vào Đại đội 1: một sinh nhật hôm nay, một sinh nhật cách nửa năm',
		async () => {
			await page.goto('/dai-doi/c1?id=2')
			// Start listening before the click that mounts the dialog (and fires
			// its GET /wards) - the response can arrive before we'd start
			// listening otherwise, and this wait only matters if it's armed
			// first.
			const wardsLoaded = page.waitForResponse(
				(resp) => resp.url().includes('/wards') && resp.ok()
			)
			await page
				.getByRole('button', { name: t('table:studentTable.import') })
				.click()
			await expect(dialog(page)).toBeVisible()
			// The dialog resolves units/positions/provinces/wards to build its
			// unitLabelToId/positionLabelToId/provinceNameToCode/
			// wardNameToCodeByProvince lookup maps in the background; uploading
			// before that settles parses every row's fields against still-empty
			// maps, so those rows come back as reference errors.
			//
			// `waitForLoadState('networkidle')` alone isn't sufficient: it only
			// guarantees no network requests are in flight, not that the derived
			// lookup maps have actually been recomputed and committed to React
			// state. GET /wards (the nationwide ward list, by far the largest of
			// the four lookups) is the one that actually loses this race in
			// practice - confirmed by a failure where the unit/position columns
			// (small, org-scoped lists) had already resolved correctly but the
			// birthPlace/address province+ward columns still errored. Waiting for
			// that specific response is a condition-based wait on the real
			// dependency, not a network-idle heuristic.
			await wardsLoaded
			await page.waitForLoadState('networkidle')
			await dialog(page)
				.locator('input[type=file]')
				.setInputFiles({
					name: 'sinh-nhat.xlsx',
					mimeType: XLSX_TYPE,
					buffer: trooperWorkbook([BIRTHDAY_TROOPER, OTHER_TROOPER])
				})
			await expect(
				dialog(page).getByText(
					t('io:importDialog.review.valid', { count: 2 })
				)
			).toBeVisible()
			await dialog(page)
				.getByRole('button', {
					name: t('io:importDialog.actions.confirm')
				})
				.click()
			await expect(
				dialog(page).getByText(
					t('io:importDialog.messages.done', { success: 2, total: 2 })
				)
			).toBeVisible()
			await dialog(page)
				.getByRole('button', {
					name: t('io:importDialog.actions.close')
				})
				.click()
			await expect(rowFor(page, 'Phan Đình Khánh')).toBeVisible()
			await expect(rowFor(page, 'Lương Văn Hạ')).toBeVisible()
		}
	)

	await story.step(
		'Thống kê Đại đội 1 cập nhật: quân số tăng thêm hai, chi tiết theo đơn vị liệt kê đúng người',
		async () => {
			await page.goto('/thong-ke-doanh-trai')
			await pickUnit(page, COMPANY)
			await expect
				.poll(() => kpiValue(page, t('units:dashboard.kpiTotalTroops')))
				.toBe(troopsBefore + 2)

			await page
				.getByRole('tab', { name: t('units:dashboard.details') })
				.click()
			await expect(
				page.getByRole('tab', { name: t('units:tabs.students') })
			).toBeVisible()
			await expect(rowFor(page, 'Phan Đình Khánh')).toBeVisible()
			await expect(rowFor(page, 'Lương Văn Hạ')).toBeVisible()
			await expect(
				page.getByRole('tab', { name: t('units:tabs.facilities') })
			).toBeVisible()
			await expect(
				page.getByRole('tab', { name: t('units:tabs.weapons') })
			).toBeVisible()
		}
	)

	await story.step(
		'Sinh nhật tuần này: quân nhân sinh nhật hôm nay xuất hiện, người kia thì không',
		async () => {
			await page.goto('/birthday')
			await filterByUnit(page, 'Đại đội 1')
			await expect(rowFor(page, 'Phan Đình Khánh')).toBeVisible()
			await expect(rowFor(page, 'Lương Văn Hạ')).toHaveCount(0)
		}
	)

	await story.step(
		'Sinh nhật theo tháng: mặc định tháng hiện tại, đổi sang tháng của người kia thì đổi vai',
		async () => {
			await page
				.getByRole('tab', { name: t('stats:birthday.tabs.month') })
				.click()
			await filterByUnit(page, 'Đại đội 1')
			await expect(rowFor(page, 'Phan Đình Khánh')).toBeVisible()
			await expect(rowFor(page, 'Lương Văn Hạ')).toHaveCount(0)

			await page.getByRole('combobox').first().click()
			await page
				.getByRole('option', {
					name: t('stats:period.month', { month: otherMonthNum }),
					exact: true
				})
				.click()
			await expect(rowFor(page, 'Lương Văn Hạ')).toBeVisible()
			await expect(rowFor(page, 'Phan Đình Khánh')).toHaveCount(0)
		}
	)

	await story.step(
		'Sinh nhật theo quý: mặc định quý hiện tại, đổi sang quý của người kia thì đổi vai',
		async () => {
			await page
				.getByRole('tab', { name: t('stats:birthday.tabs.quarter') })
				.click()
			await filterByUnit(page, 'Đại đội 1')
			await expect(rowFor(page, 'Phan Đình Khánh')).toBeVisible()
			await expect(rowFor(page, 'Lương Văn Hạ')).toHaveCount(0)

			await page.getByRole('combobox').first().click()
			await page
				.getByRole('option', {
					name: t('stats:period.quarter', {
						quarter: otherQuarterNum
					}),
					exact: true
				})
				.click()
			await expect(rowFor(page, 'Lương Văn Hạ')).toBeVisible()
			await expect(rowFor(page, 'Phan Đình Khánh')).toHaveCount(0)
		}
	)

	await story.step(
		'Báo cáo chất lượng chính trị cập nhật: tổng quân số tăng thêm hai',
		async () => {
			await page.goto('/thong-ke-chinh-tri')
			await expect
				.poll(() => kpiValue(page, t('stats:report.totalPersonnel')))
				.toBe(personnelBefore + 2)
		}
	)

	await story.step(
		'Tab Chi tiết: bảng thống kê theo dân tộc/tôn giáo/văn hoá hiển thị dữ liệu thật',
		async () => {
			await page
				.getByRole('button', { name: t('stats:report.tabs.detailed') })
				.click()
			await expect(
				page.getByRole('columnheader', { name: 'Kinh', exact: true })
			).toBeVisible()
			await expect(page.getByText(t('stats:table.title'))).toBeVisible()
		}
	)

	await story.step(
		'Tab Biểu đồ: các biểu đồ theo đơn vị/lớp hiển thị',
		async () => {
			await page
				.getByRole('button', { name: t('stats:report.tabs.charts') })
				.click()
			await expect(page.getByText(t('stats:charts.byUnit'))).toBeVisible()
		}
	)

	await story.step(
		'Xuất báo cáo chính trị ra Excel; nút Xuất PDF vẫn đang phát triển nên bị khoá',
		async () => {
			await page
				.getByRole('button', { name: t('stats:report.exportExcel') })
				.click()
			await dialog(page)
				.getByLabel(t('stats:exportDialog.titleLabel'))
				.fill('Báo cáo chất lượng chính trị')
			const [download] = await Promise.all([
				page.waitForEvent('download'),
				dialog(page)
					.getByRole('button', {
						name: t('stats:exportDialog.confirm')
					})
					.click()
			])
			expect(download.suggestedFilename()).toMatch(/\.xlsx$/)

			// Radix wraps the disabled button in its own tooltip-trigger button
			// (disabled elements don't fire the hover events a tooltip needs) -
			// so both the wrapper and the real inner button match this role/name;
			// the real one (with the `disabled` attribute) is the last match.
			await expect(
				page
					.getByRole('button', { name: t('stats:report.exportPdf') })
					.last()
			).toBeDisabled()
		}
	)
})

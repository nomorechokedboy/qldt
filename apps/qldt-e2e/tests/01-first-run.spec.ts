import { ADMIN, ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import { choose, login } from '../support/ui'

test('first run: root unit, first administrator, sign in', async ({
	page,
	story
}) => {
	await page.goto('/')
	await story.chapter(
		'Khởi tạo hệ thống lần đầu',
		'Đơn vị gốc → quản trị viên đầu tiên → đăng nhập'
	)

	await story.step(
		'Hệ thống trống nên tự chuyển tới màn hình khởi tạo đơn vị gốc',
		async () => {
			await expect(page).toHaveURL(/khoi-tao-don-vi/)
			await expect(
				page.getByText(t('units:initialize.rootUnit.title')).first()
			).toBeVisible()
		}
	)

	await story.step(
		'Nhập tên, mã định danh và cấp của đơn vị gốc',
		async () => {
			await page
				.getByLabel(t('units:initialize.rootUnit.name'))
				.fill('Tiểu đoàn 8 Pháo binh')
			await page
				.getByLabel(t('units:initialize.rootUnit.alias'))
				.fill('d8')
			await choose(
				page,
				page.locator('#root-unit-level'),
				t('units:levels.battalion')
			)
		}
	)

	await story.step('Khởi tạo đơn vị gốc', async () => {
		await page
			.getByRole('button', {
				name: t('units:initialize.rootUnit.submit')
			})
			.click()
		await expect(page).toHaveURL(/khoi-tao-qtv/)
	})

	await story.step(
		'Tạo tài khoản quản trị viên đầu tiên; mật khẩu yếu bị từ chối ngay khi gõ',
		async () => {
			await page
				.getByLabel(t('units:initialize.admin.displayName'))
				.fill(ADMIN.displayName)
			await page
				.getByLabel(t('units:initialize.admin.username'))
				.fill(ADMIN.username)
			await page
				.getByLabel(t('units:initialize.admin.password'), {
					exact: true
				})
				.fill('abc')
			await expect(
				page.getByText(t('units:initialize.admin.passwordMin'))
			).toBeVisible()
			await page
				.getByLabel(t('units:initialize.admin.password'), {
					exact: true
				})
				.fill(ADMIN.password)
			await page
				.getByLabel(t('units:initialize.admin.confirmPassword'))
				.fill('Khac@12345')
			await expect(
				page.getByText(t('units:initialize.admin.confirmMismatch'))
			).toBeVisible()
			await page
				.getByLabel(t('units:initialize.admin.confirmPassword'))
				.fill(ADMIN.password)
		}
	)

	await story.step('Khởi tạo quản trị viên', async () => {
		await page
			.getByRole('button', {
				name: t('units:initialize.admin.submit'),
				exact: true
			})
			.click()
		await expect(page).toHaveURL(/login/)
	})

	await story.step('Đăng nhập bằng tài khoản vừa tạo', async () => {
		await login(
			page,
			{
				username: t('auth:login.username'),
				password: t('auth:login.password'),
				submit: t('auth:login.submit')
			},
			ADMIN
		)
		await expect(page).not.toHaveURL(/login|khoi-tao/)
		await page.context().storageState({ path: ADMIN_STATE })
	})
})

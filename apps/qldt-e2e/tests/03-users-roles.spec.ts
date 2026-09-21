import { ADMIN, ADMIN_STATE, expect, test } from '../support/story'
import { t } from '../support/text'
import { assignRole, createUser, login, signOut } from '../support/ui'

test.use({ storageState: ADMIN_STATE })

const loginLabels = () => ({
	username: t('auth:login.username'),
	password: t('auth:login.password'),
	submit: t('auth:login.submit')
})

const COMMANDER = {
	displayName: 'Trần Văn Bình',
	username: 'binh.c1',
	password: 'Binh@12345'
}
const REVIEWER = {
	displayName: 'Lê Văn Cường',
	username: 'cuong.c1',
	password: 'Cuong@12345'
}

test('users and roles: roles, accounts, and what each account can see', async ({
	page,
	story
}) => {
	await page.goto('/vai-tro')
	await story.chapter(
		'Người dùng & phân quyền',
		'Vai trò → tài khoản → kiểm tra quyền truy cập'
	)

	await story.step(
		'Hệ thống có sẵn các vai trò: quản trị, chỉ huy tiểu đoàn, chỉ huy đại đội, người xem',
		async () => {
			for (const name of [
				'admin',
				'battalion_commander',
				'company_commander',
				'viewer'
			]) {
				await expect(
					page.getByText(name, { exact: true })
				).toBeVisible()
			}
		}
	)

	await story.step(
		'Tạo vai trò mới cho cán bộ chỉ được xem quân số',
		async () => {
			await page
				.getByRole('button', { name: t('admin:roles.create.trigger') })
				.click()
			const dialog = page.getByRole('dialog')
			await dialog
				.getByLabel(t('admin:roles.fields.name'))
				.fill('unit_reviewer')
			await dialog
				.getByLabel(t('admin:roles.fields.description'))
				.fill('Cán bộ rà soát - Chỉ xem quân nhân và đơn vị')
			await dialog
				.getByRole('button', { name: t('admin:roles.create.action') })
				.click()
			await dialog.waitFor({ state: 'hidden' })
			await expect(
				page.getByText('unit_reviewer', { exact: true })
			).toBeVisible()
		}
	)

	await story.step(
		'Gán quyền cho vai trò: chỉ quyền xem quân nhân, đơn vị và lớp',
		async () => {
			const card = page
				.locator('[data-slot=card]')
				.filter({ hasText: 'unit_reviewer' })
			await card
				.getByRole('button', {
					name: t('admin:permissions.assign.trigger')
				})
				.click()
			const dialog = page.getByRole('dialog')
			for (const tag of ['students:read', 'units:read', 'classes:read']) {
				await dialog
					.getByRole('checkbox', { name: new RegExp(tag) })
					.check()
			}
			await story.pause(1200)
			await dialog
				.getByRole('button', { name: t('admin:common.save') })
				.click()
			await dialog.waitFor({ state: 'hidden' })
			await expect(
				card.getByText(t('admin:roles.permissionCount', { count: 3 }))
			).toBeVisible()
		}
	)

	await story.step('Thêm tài khoản chỉ huy Đại đội 1', async () => {
		await page.goto('/list-user')
		await createUser(page, t, {
			...COMMANDER,
			unit: /^Đại đội 1/,
			rank: 'Đại úy',
			position: 'Đại đội trưởng'
		})
		await expect(
			page.getByRole('row').filter({ hasText: COMMANDER.username })
		).toBeVisible()
	})

	await story.step(
		'Phân vai trò "Chỉ huy đại đội" cho tài khoản vừa tạo',
		async () => {
			await assignRole(page, t, COMMANDER.username, 'company_commander')
		}
	)

	await story.step(
		'Thêm tài khoản thứ hai và phân vai trò tự tạo',
		async () => {
			await createUser(page, t, {
				...REVIEWER,
				unit: /^Đại đội 1/,
				rank: 'Thượng úy',
				position: 'Phó đại đội trưởng'
			})
			await assignRole(page, t, REVIEWER.username, 'unit_reviewer')
			await expect(
				page.getByRole('row').filter({ hasText: REVIEWER.username })
			).toBeVisible()
		}
	)

	await story.step('Đăng xuất', async () => {
		await signOut(page, t)
	})

	await story.step('Đăng nhập sai mật khẩu bị từ chối', async () => {
		await login(page, loginLabels(), {
			username: COMMANDER.username,
			password: 'sai-mat-khau'
		})
		await expect(
			page.getByText(t('auth:login.failed')).first()
		).toBeVisible()
	})

	await story.step(
		'Đăng nhập bằng tài khoản chỉ huy đại đội: chỉ thấy đơn vị của mình, không có mục quản trị',
		async () => {
			await login(page, loginLabels(), COMMANDER)
			await expect(page).not.toHaveURL(/login/)
			const sidebar = page.getByRole('complementary')
			await expect(sidebar.getByText('Đại đội 1').first()).toBeVisible()
			await expect(sidebar.getByText('Đại đội 2 Hỏa lực')).toHaveCount(0)
			await expect(
				sidebar.getByText(t('nav:groups.userAdmin'))
			).toHaveCount(0)
		}
	)

	await story.step(
		'Gõ thẳng địa chỉ trang quản trị vẫn bị chặn',
		async () => {
			await page.goto('/vai-tro')
			await expect(
				page.getByText(t('admin:access.deniedTitle'))
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

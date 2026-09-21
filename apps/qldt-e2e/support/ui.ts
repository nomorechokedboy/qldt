import type { Locator, Page } from '@playwright/test'

// Radix Select: open the trigger, click the option in the popup.
export async function choose(
	page: Page,
	trigger: Locator,
	option: string | RegExp
) {
	await trigger.click()
	await page.getByRole('option', { name: option }).first().click()
}

// Log in through the real form.
export async function login(
	page: Page,
	labels: { username: string; password: string; submit: string },
	account: { username: string; password: string }
) {
	await page
		.getByLabel(labels.username, { exact: true })
		.fill(account.username)
	await page
		.getByLabel(labels.password, { exact: true })
		.fill(account.password)
	await page.getByRole('button', { name: labels.submit }).click()
}

// Fill the "add unit" dialog on /quan-ly-don-vi.
export async function createUnit(
	page: Page,
	text: (key: string) => string,
	unit: { name: string; alias: string; level: string; parent?: string }
) {
	await page
		.getByRole('button', { name: text('units:form.addButton') })
		.click()
	const dialog = page.getByRole('dialog')
	await dialog.getByLabel(text('units:form.name')).fill(unit.name)
	await dialog.getByLabel(text('units:form.alias')).fill(unit.alias)
	await choose(
		page,
		dialog.getByRole('combobox', { name: text('units:form.level') }),
		unit.level
	)
	if (unit.parent) {
		await choose(
			page,
			dialog.getByRole('combobox', { name: text('units:form.parent') }),
			unit.parent
		)
	}
	await dialog
		.getByRole('button', { name: text('units:form.add'), exact: true })
		.click()
	await dialog.waitFor({ state: 'hidden' })
}

// Sign out through the account menu (top right).
export async function signOut(page: Page, text: (key: string) => string) {
	await page.getByRole('banner').getByRole('button').last().click()
	await page.getByRole('menuitem', { name: 'Đăng xuất' }).click()
	await page
		.getByRole('heading', { name: text('auth:login.title') })
		.waitFor()
}

// Fill the "add user" dialog on /list-user.
export async function createUser(
	page: Page,
	text: (key: string) => string,
	user: {
		displayName: string
		username: string
		password: string
		unit: RegExp | string
		rank: string
		position: string
	}
) {
	await page.getByRole('button', { name: text('admin:users.add') }).click()
	const dialog = page.getByRole('dialog')
	await dialog
		.getByLabel(text('admin:users.fields.displayName'))
		.fill(user.displayName)
	await dialog
		.getByLabel(text('admin:users.fields.username'))
		.fill(user.username)
	await dialog
		.getByLabel(text('admin:users.fields.password'), { exact: true })
		.fill(user.password)
	await choose(
		page,
		dialog.getByRole('combobox', {
			name: text('admin:users.fields.selectUnit')
		}),
		user.unit
	)
	await choose(
		page,
		dialog.getByRole('combobox', { name: text('admin:users.fields.rank') }),
		user.rank
	)
	await choose(
		page,
		dialog.getByRole('combobox', {
			name: text('admin:users.fields.position')
		}),
		user.position
	)
	await choose(
		page,
		dialog.getByRole('combobox', {
			name: text('admin:users.fields.accountType')
		}),
		text('admin:users.accountTypes.regular')
	)
	await dialog
		.getByRole('button', { name: text('admin:common.add'), exact: true })
		.click()
	await dialog.waitFor({ state: 'hidden' })
}

// Give a user a role from the row menu on /list-user.
export async function assignRole(
	page: Page,
	text: (key: string) => string,
	username: string,
	roleName: string
) {
	await page
		.getByRole('row')
		.filter({ hasText: username })
		.getByRole('button')
		.last()
		.click()
	await page
		.getByRole('menuitem', {
			name: text('admin:users.actions.assignRoles')
		})
		.click()
	const dialog = page.getByRole('dialog')
	await dialog
		.getByRole('checkbox', { name: new RegExp(`${roleName}$`) })
		.check()
	await dialog
		.getByRole('button', { name: text('admin:assignRoles.save') })
		.click()
	await dialog.waitFor({ state: 'hidden' })
}

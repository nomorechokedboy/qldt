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

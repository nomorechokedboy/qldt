import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockFetch } from '@/test/fetch-mock'
import { ExportUnitRosterExtractDialog } from './export-unit-roster-extract-dialog'

// Auth state and the docx preview are outside what is under test: the
// dialog's job is to ask the server for the roster of exactly one unit.
vi.mock('@/hooks/useAuth', () => ({
	default: () => ({ user: { displayName: 'Nguyen Van A', rank: '1/' } })
}))
vi.mock('@/components/docx-preview-dialog-lazy', () => ({
	LazyDocxPreviewDialog: ({ open }: { open: boolean }) =>
		open ? <div data-testid='preview' /> : null
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn() } }))

afterEach(() => {
	vi.unstubAllGlobals()
})

function renderDialog(unitId: number, unitName = 'Dai doi 1') {
	const onOpenChange = vi.fn()
	render(
		<ExportUnitRosterExtractDialog
			open
			onOpenChange={onOpenChange}
			unitId={unitId}
			defaultFilename={`roster-${unitId}`}
			defaultValues={{ unitName, underUnitName: 'Tieu doan 1' }}
		/>
	)
	return { onOpenChange }
}

const submit = async () => {
	fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }))
}

describe('ExportUnitRosterExtractDialog', () => {
	it('asks for the roster of the unit it was opened for, by id', async () => {
		const { requests } = mockFetch()
		renderDialog(21)

		await submit()

		await waitFor(() => expect(requests).toHaveLength(1))
		expect(requests[0].method).toBe('POST')
		expect(requests[0].path).toBe('/students/export-roster')
		expect(requests[0].body).toMatchObject({ unitId: 21 })
	})

	it('identifies the unit only by id, never by alias or level', async () => {
		const { requests } = mockFetch()
		renderDialog(21)

		await submit()

		await waitFor(() => expect(requests).toHaveLength(1))
		expect(requests[0].body).not.toHaveProperty('unitAlias')
		expect(requests[0].body).not.toHaveProperty('unitLevel')
	})

	it('sends the header details shown in the form', async () => {
		const { requests } = mockFetch()
		renderDialog(21, 'Dai doi 1')

		await submit()

		await waitFor(() => expect(requests).toHaveLength(1))
		expect(requests[0].body).toMatchObject({
			unitName: 'Dai doi 1',
			underUnitName: 'Tieu doan 1',
			commanderName: 'Nguyen Van A',
			commanderRank: '1/'
		})
	})

	it('each company exports with its own id, not the first matching one', async () => {
		const { requests } = mockFetch()

		const first = render(
			<ExportUnitRosterExtractDialog
				open
				onOpenChange={() => {}}
				unitId={2}
				defaultFilename='c1'
				defaultValues={{ unitName: 'C1', underUnitName: 'D1' }}
			/>
		)
		await submit()
		await waitFor(() => expect(requests).toHaveLength(1))
		first.unmount()

		render(
			<ExportUnitRosterExtractDialog
				open
				onOpenChange={() => {}}
				unitId={3}
				defaultFilename='c2'
				defaultValues={{ unitName: 'C2', underUnitName: 'D1' }}
			/>
		)
		await submit()
		await waitFor(() => expect(requests).toHaveLength(2))

		expect(
			requests.map((r) => (r.body as { unitId: number }).unitId)
		).toEqual([2, 3])
	})

	it('closes and previews the document after a successful export', async () => {
		mockFetch()
		const { onOpenChange } = renderDialog(21)

		await submit()

		await waitFor(() => expect(screen.getByTestId('preview')).toBeTruthy())
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('stays open and shows no preview when the server rejects the request', async () => {
		mockFetch(() => ({
			status: 404,
			body: { code: 'not_found', message: 'unit with id: 21 not found' }
		}))
		const { onOpenChange } = renderDialog(21)

		await submit()

		const { toast } = await import('sonner')
		await waitFor(() => expect(toast.error).toHaveBeenCalled())
		expect(screen.queryByTestId('preview')).toBeNull()
		expect(onOpenChange).not.toHaveBeenCalledWith(false)
	})
})

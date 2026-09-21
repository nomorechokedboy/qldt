import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Student } from '@/types'
import useTrooperPicker from './use-trooper-picker'

const student = (id: number, fullName: string) => ({ id, fullName }) as Student

const nguyen = student(1, 'Nguyễn Văn An')
const tran = student(2, 'Trần Thị Bình')
const dang = student(3, 'Đặng Văn Cường')
const roster = [nguyen, tran, dang]

type Override = { note?: string }

const setup = (candidates: Student[] = roster) =>
	renderHook(({ list }) => useTrooperPicker<Override>(list), {
		initialProps: { list: candidates }
	})

describe('useTrooperPicker', () => {
	it('starts with nobody selected', () => {
		const { result } = setup()

		expect(result.current.selectedIds.size).toBe(0)
		expect(result.current.visible).toEqual(roster)
		expect(result.current.allVisibleSelected).toBe(false)
		expect(result.current.someVisibleSelected).toBe(false)
	})

	it('applies several toggles made in the same batch', () => {
		const { result } = setup()

		act(() => {
			result.current.toggle(1)
			result.current.toggle(2)
			result.current.toggle(1)
		})

		expect([...result.current.selectedIds]).toEqual([2])
	})

	it('narrows what is visible by an accent-insensitive name search', () => {
		const { result } = setup()

		act(() => result.current.setSearch('dang van'))

		expect(result.current.visible).toEqual([dang])
	})

	it('keeps a trooper selected while a search hides them', () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setSearch('tran'))

		expect(result.current.visible).toEqual([tran])
		expect(result.current.selectedIds.has(1)).toBe(true)
	})

	it('selects and clears only the troopers currently shown', () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setSearch('tran'))
		act(() => result.current.toggleAllVisible(true))

		expect([...result.current.selectedIds].sort()).toEqual([1, 2])
		expect(result.current.allVisibleSelected).toBe(true)

		act(() => result.current.toggleAllVisible(false))

		expect([...result.current.selectedIds]).toEqual([1])
	})

	it('reports a partial selection of the visible troopers', () => {
		const { result } = setup()

		act(() => result.current.toggle(3))

		expect(result.current.someVisibleSelected).toBe(true)
		expect(result.current.allVisibleSelected).toBe(false)
	})

	it('merges override patches for a trooper', () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setCustomized(1, true))
		act(() => result.current.setOverride(1, { note: 'a' }))
		act(() => result.current.setOverride(1, {}))

		expect(result.current.overrides.get(1)).toEqual({ note: 'a' })
	})

	it("drops a trooper's override when they are deselected", () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setCustomized(1, true))
		act(() => result.current.toggle(1))
		act(() => result.current.toggle(1))

		expect(result.current.selectedIds.has(1)).toBe(true)
		expect(result.current.overrides.has(1)).toBe(false)
	})

	it('drops overrides when select-all is turned off', () => {
		const { result } = setup()

		act(() => result.current.toggleAllVisible(true))
		act(() => result.current.setCustomized(2, true))
		act(() => result.current.toggleAllVisible(false))

		expect(result.current.overrides.size).toBe(0)
	})

	it('clears every override but keeps the selection', () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setCustomized(1, true))
		act(() => result.current.clearOverrides())

		expect(result.current.overrides.size).toBe(0)
		expect(result.current.selectedIds.has(1)).toBe(true)
	})

	it('retains only the allowed troopers and their overrides', () => {
		const { result } = setup()

		act(() => result.current.toggleAllVisible(true))
		act(() => result.current.setCustomized(1, true))
		act(() => result.current.setCustomized(2, true))
		act(() => result.current.retainOnly(new Set([2, 3])))

		expect([...result.current.selectedIds].sort()).toEqual([2, 3])
		expect([...result.current.overrides.keys()]).toEqual([2])
	})

	it('resets selection, overrides and search together', () => {
		const { result } = setup()

		act(() => result.current.toggle(1))
		act(() => result.current.setCustomized(1, true))
		act(() => result.current.setSearch('tran'))
		act(() => result.current.reset())

		expect(result.current.selectedIds.size).toBe(0)
		expect(result.current.overrides.size).toBe(0)
		expect(result.current.search).toBe('')
		expect(result.current.visible).toEqual(roster)
	})

	it('checks real membership, not just the count, when the roster changes', () => {
		const { result, rerender } = setup([nguyen, tran])

		act(() => result.current.toggleAllVisible(true))
		expect(result.current.allVisibleSelected).toBe(true)

		// Same size as before, but a different trooper who was never selected.
		rerender({ list: [nguyen, dang] })

		expect(result.current.allVisibleSelected).toBe(false)
		expect(result.current.someVisibleSelected).toBe(true)
	})

	describe('showing only the selected', () => {
		it('hides everyone who is not selected', () => {
			const { result } = setup()
			act(() => result.current.toggle(2))

			act(() => result.current.setOnlySelected(true))

			expect(result.current.visible).toEqual([tran])
		})

		it('combines with the name search', () => {
			const { result } = setup()
			act(() => {
				result.current.toggle(1)
				result.current.toggle(2)
			})

			act(() => {
				result.current.setOnlySelected(true)
				result.current.setSearch('tran')
			})

			expect(result.current.visible).toEqual([tran])
		})

		it('shows everyone again when switched off, keeping the selection', () => {
			const { result } = setup()
			act(() => {
				result.current.toggle(1)
				result.current.setOnlySelected(true)
			})

			act(() => result.current.setOnlySelected(false))

			expect(result.current.visible).toEqual(roster)
			expect([...result.current.selectedIds]).toEqual([1])
		})

		it('is switched off by a reset', () => {
			const { result } = setup()
			act(() => result.current.setOnlySelected(true))

			act(() => result.current.reset())

			expect(result.current.onlySelected).toBe(false)
		})
	})
})

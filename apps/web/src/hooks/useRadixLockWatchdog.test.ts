import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRadixLockWatchdog } from './useRadixLockWatchdog'

afterEach(() => {
	document.body.removeAttribute('data-scroll-locked')
	document.body.style.pointerEvents = ''
	document.body.innerHTML = ''
})

const lockBody = () => {
	document.body.setAttribute('data-scroll-locked', '1')
	document.body.style.pointerEvents = 'none'
}

describe('useRadixLockWatchdog', () => {
	it('clears a stray lock once no Radix layer is open', async () => {
		renderHook(() => useRadixLockWatchdog())

		lockBody()

		await waitFor(
			() => {
				expect(document.body.hasAttribute('data-scroll-locked')).toBe(
					false
				)
			},
			{ timeout: 3000 }
		)
		expect(document.body.style.pointerEvents).toBe('')
	})

	it('clears a lock that goes stray with no further attribute changes', async () => {
		// The exact failure this guards against: whatever should have
		// decremented the lock never touches document.body again, so a
		// watchdog that only reacts to body mutations would never get a
		// second chance to look. Lock it once, then wait — nothing else
		// touches the body afterwards.
		renderHook(() => useRadixLockWatchdog())
		lockBody()

		await waitFor(
			() => {
				expect(document.body.hasAttribute('data-scroll-locked')).toBe(
					false
				)
			},
			{ timeout: 3000 }
		)
	})

	it('leaves a genuinely open dialog’s lock alone', async () => {
		renderHook(() => useRadixLockWatchdog())

		const dialog = document.createElement('div')
		dialog.setAttribute('role', 'dialog')
		dialog.setAttribute('data-state', 'open')
		document.body.appendChild(dialog)
		lockBody()

		// Give the watchdog several poll cycles to (not) act.
		await new Promise((resolve) => setTimeout(resolve, 1500))

		expect(document.body.hasAttribute('data-scroll-locked')).toBe(true)
		expect(document.body.style.pointerEvents).toBe('none')
	})

	it('does not clear a lock that only briefly looks stray (mid-close animation)', async () => {
		renderHook(() => useRadixLockWatchdog())

		const dialog = document.createElement('div')
		dialog.setAttribute('role', 'dialog')
		dialog.setAttribute('data-state', 'open')
		document.body.appendChild(dialog)
		lockBody()

		// Simulate the dialog flipping to "closed" for a normal animation
		// duration, then finishing — well under the sustained-stray
		// threshold the watchdog requires before it acts.
		await new Promise((resolve) => setTimeout(resolve, 200))
		dialog.setAttribute('data-state', 'closed')
		await new Promise((resolve) => setTimeout(resolve, 250))
		dialog.remove()
		document.body.removeAttribute('data-scroll-locked')
		document.body.style.pointerEvents = ''

		expect(document.body.hasAttribute('data-scroll-locked')).toBe(false)
	})

	it('stops watching once unmounted', async () => {
		const { unmount } = renderHook(() => useRadixLockWatchdog())
		unmount()

		lockBody()
		await new Promise((resolve) => setTimeout(resolve, 1500))

		// Nothing is clearing it anymore, but nothing should crash either.
		expect(document.body.hasAttribute('data-scroll-locked')).toBe(true)
	})
})

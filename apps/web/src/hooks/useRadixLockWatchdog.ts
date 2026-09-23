import { useEffect } from 'react'

// Dialog, AlertDialog, Sheet, DropdownMenu and Select all lock body scroll
// while open, sharing one counter that Radix keeps as document.body's
// `data-scroll-locked` attribute plus an inline `pointer-events: none`.
// Several distinct interaction shapes — a menu opening a dialog in the
// same tick, two nested dialogs closing back to back, even a single
// ordinary open-then-Escape-close — have been observed stranding that
// counter above 0 forever, freezing every click on the page with no
// dialog left open to explain it (see the qldt-e2e chapter 4/8/10
// failures this traced back to). The Sheet variant is the clearest case:
// its exit animation only finishes — and only then does Radix's own
// lock-count decrement run — once the browser fires `animationend` on
// its Content element, and that event is not always reliable in an
// automated/headless browser under load.
//
// This is a defense-in-depth backstop for the class of bug, not a fix
// for whichever race or missed event causes it. It has to poll rather
// than only react to document.body's own attribute changes: the failure
// mode being guarded against is precisely that the mutation which would
// normally clear the lock never happens, so a purely reactive observer
// never gets a second chance to look.
const OPEN_LAYER_SELECTOR = [
	'[role="dialog"][data-state="open"]',
	'[role="alertdialog"][data-state="open"]',
	'[role="menu"][data-state="open"]',
	'[role="listbox"][data-state="open"]'
].join(', ')

const POLL_INTERVAL_MS = 250
// A real close animation in this codebase runs at most 300-500ms (Sheet's
// longest). Requiring the stray condition to hold for several consecutive
// polls before clearing keeps a dialog that is legitimately mid-close from
// having its lock yanked out from under it.
const STRAY_TICKS_BEFORE_CLEAR = 4

function isStray() {
	const body = document.body
	if (!body.hasAttribute('data-scroll-locked')) return false
	return !document.querySelector(OPEN_LAYER_SELECTOR)
}

function clearLock() {
	const body = document.body
	body.removeAttribute('data-scroll-locked')
	if (body.style.pointerEvents === 'none') body.style.pointerEvents = ''
}

// Mount once, near the app root.
export function useRadixLockWatchdog() {
	useEffect(() => {
		let strayTicks = 0

		const id = setInterval(() => {
			if (!isStray()) {
				strayTicks = 0
				return
			}
			strayTicks += 1
			if (strayTicks >= STRAY_TICKS_BEFORE_CLEAR) {
				clearLock()
				strayTicks = 0
			}
		}, POLL_INTERVAL_MS)

		return () => clearInterval(id)
	}, [])
}

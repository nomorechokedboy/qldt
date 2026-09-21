// Playwright's video shows the page but not the pointer, and says nothing
// about what is going on. This script, injected into every page, adds a
// visible cursor with a click ripple, a caption bar, and a full-screen
// chapter card, so a recording can be followed without a voice-over.
export const overlayScript = `
(() => {
	if (window.top !== window) return
	const KEY = '__e2e_caption'
	function mount() {
		if (document.getElementById('__e2e_overlay')) return
		const root = document.createElement('div')
		root.id = '__e2e_overlay'
		root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:Inter,system-ui,sans-serif'
		root.innerHTML = [
			'<div id="__e2e_cursor" style="position:absolute;left:-40px;top:-40px;width:26px;height:26px;transition:transform .65s cubic-bezier(.4,.1,.25,1);will-change:transform">',
			'<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg></div>',
			'<div id="__e2e_caption" style="position:absolute;left:50%;bottom:28px;transform:translateX(-50%);max-width:70%;padding:12px 22px;border-radius:10px;background:rgba(17,24,39,.88);color:#fff;font-size:22px;line-height:1.35;text-align:center;opacity:0;transition:opacity .25s"></div>',
			'<div id="__e2e_title" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(135deg,#14532d,#052e16);color:#fff;opacity:0;transition:opacity .4s"></div>'
		].join('')
		document.documentElement.appendChild(root)
		const cursor = root.querySelector('#__e2e_cursor')
		addEventListener('mousemove', (e) => {
			cursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'
		}, true)
		addEventListener('mousedown', (e) => {
			const ripple = document.createElement('div')
			ripple.style.cssText = 'position:absolute;left:' + (e.clientX - 20) + 'px;top:' + (e.clientY - 20) + 'px;width:40px;height:40px;border-radius:50%;border:3px solid #22c55e;background:rgba(34,197,94,.25);transform:scale(.3);opacity:1;transition:transform .5s ease-out,opacity .5s ease-out'
			root.appendChild(ripple)
			requestAnimationFrame(() => { ripple.style.transform = 'scale(1.6)'; ripple.style.opacity = '0' })
			setTimeout(() => ripple.remove(), 600)
		}, true)
		const saved = sessionStorage.getItem(KEY)
		if (saved) window.__e2e.caption(saved)
	}
	window.__e2e = {
		caption(text) {
			mount()
			const el = document.getElementById('__e2e_caption')
			if (text) sessionStorage.setItem(KEY, text); else sessionStorage.removeItem(KEY)
			el.textContent = text || ''
			el.style.opacity = text ? '1' : '0'
		},
		title(heading, sub) {
			mount()
			const el = document.getElementById('__e2e_title')
			if (!heading) { el.style.opacity = '0'; return }
			el.innerHTML = '<div style="font-size:54px;font-weight:700;letter-spacing:.01em;text-align:center;padding:0 80px">' + heading + '</div>' +
				(sub ? '<div style="font-size:26px;opacity:.8;text-align:center;padding:0 120px">' + sub + '</div>' : '')
			el.style.opacity = '1'
		}
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount()
})()
`

// The day/month/year segments are edited independently so that changing one
// (typing, backspacing, or selecting-and-replacing) never reflows the digits
// of the other segments -- e.g. deleting the "3" in "12/03/1990" must produce
// "12/0/1990", not corrupt the year into "12/01/990" by re-splitting the
// whole digit stream from scratch.
function parseSegments(value: string): { d: string; m: string; y: string } {
	const [d = '', m = '', y = ''] = value.split('/')
	return { d, m, y }
}

function joinSegments(d: string, m: string, y: string): string {
	let out = d
	const needSlash1 = m.length > 0 || y.length > 0 || d.length === 2
	if (needSlash1) out += `/${m}`
	const needSlash2 = needSlash1 && (m.length === 2 || y.length > 0)
	if (needSlash2) out += `/${y}`
	return out
}

// Smallest [start, end) range in `prev` that differs from `next`, found by
// trimming the common prefix and suffix -- works for any single contiguous
// edit: typing, backspace, delete, paste, or select-and-type-over.
function diffRange(prev: string, next: string) {
	let i = 0
	while (i < prev.length && i < next.length && prev[i] === next[i]) i++
	let j = 0
	while (
		j < prev.length - i &&
		j < next.length - i &&
		prev[prev.length - 1 - j] === next[next.length - 1 - j]
	)
		j++
	return { start: i, endPrev: prev.length - j, endNext: next.length - j }
}

function segmentBoundaries(d: string, m: string, y: string) {
	const joined = joinSegments(d, m, y)
	const firstSlash = joined.indexOf('/')
	const hasSlash1 = firstSlash >= 0
	const secondSlash = hasSlash1 ? joined.indexOf('/', firstSlash + 1) : -1
	return {
		joined,
		mRange: hasSlash1
			? ([firstSlash + 1, firstSlash + 1 + m.length] as const)
			: null,
		yRange:
			secondSlash >= 0
				? ([secondSlash + 1, secondSlash + 1 + y.length] as const)
				: null
	}
}

// Reformats an edited dd/mm/yyyy string without letting the edit bleed into
// unrelated segments, and reports where the caret should end up.
export function applyDateEdit(
	prevValue: string,
	inputValue: string
): { value: string; cursor: number } {
	// Select-all + delete spans every segment, which the per-segment editing
	// below would only partly clear.
	if (inputValue === '') return { value: '', cursor: 0 }

	const { d, m, y } = parseSegments(prevValue)
	const { joined, mRange, yRange } = segmentBoundaries(d, m, y)
	const { start, endPrev, endNext } = diffRange(joined, inputValue)
	const replacement = inputValue.slice(start, endNext).replace(/\D/g, '')
	const isDeletion = inputValue.length < joined.length

	let seg: 'd' | 'm' | 'y' = 'd'
	if (mRange && start >= mRange[0]) seg = 'm'
	if (yRange && start >= yRange[0]) seg = 'y'
	// Backspacing right after a slash removes the separator itself, which
	// really means "delete the last digit of the segment before it".
	if (isDeletion && mRange && start === mRange[0] && endPrev <= mRange[0])
		seg = 'd'
	if (isDeletion && yRange && start === yRange[0] && endPrev <= yRange[0])
		seg = 'm'

	const removedOnlySlash =
		isDeletion && joined.slice(start, endPrev) === '/' && replacement === ''

	let nd = d
	let nm = m
	let ny = y
	let localCursor = 0

	function spliceSegment(
		orig: string,
		range: readonly [number, number],
		maxLen: number
	) {
		const localStart = Math.max(0, Math.min(orig.length, start - range[0]))
		const localEnd = Math.max(0, Math.min(orig.length, endPrev - range[0]))
		const next = (
			orig.slice(0, localStart) +
			replacement +
			orig.slice(localEnd)
		).slice(0, maxLen)
		localCursor = Math.min(localStart + replacement.length, next.length)
		return next
	}

	if (removedOnlySlash) {
		if (seg === 'd') {
			nd = d.slice(0, -1)
			localCursor = nd.length
		} else if (seg === 'm') {
			nm = m.slice(0, -1)
			localCursor = nm.length
		}
	} else if (seg === 'd') {
		nd = spliceSegment(d, [0, d.length], 2)
	} else if (seg === 'm') {
		nm = spliceSegment(m, mRange!, 2)
	} else {
		ny = spliceSegment(y, yRange!, 4)
	}

	const value = joinSegments(nd, nm, ny)
	const newBounds = segmentBoundaries(nd, nm, ny)
	const segStart =
		seg === 'd'
			? 0
			: seg === 'm'
				? newBounds.mRange![0]
				: newBounds.yRange![0]

	let cursor = segStart + localCursor
	// Typing forward past a segment that just completed lands the cursor
	// right before the auto-inserted "/" -- hop over it so the next
	// keystroke lands in the next segment instead of pushing the slash
	// further right (this is what let users type through the whole date
	// without clicking into each segment).
	if (!isDeletion && replacement.length > 0) {
		while (value[cursor] === '/') cursor++
	}

	return { value, cursor }
}

const pad2 = (n: string) => n.padStart(2, '0')

// A whole date pasted in one go, as dd/mm/yyyy -- or null when the text is
// not one (then the ordinary masking handles whatever was pasted). Accepts
// `/`, `-`, `.` or space between the parts, no separators at all
// ("25121990"), and ISO order ("1990-12-25"). It only reshapes the text; whether
// it is a real date is for validation to say.
export function parsePastedDate(text: string): string | null {
	const t = text.trim()

	const dayFirst = t.match(/^(\d{1,2})[/\-.\s](\d{1,2})[/\-.\s](\d{4})$/)
	if (dayFirst)
		return `${pad2(dayFirst[1])}/${pad2(dayFirst[2])}/${dayFirst[3]}`

	const yearFirst = t.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
	if (yearFirst) {
		return `${pad2(yearFirst[3])}/${pad2(yearFirst[2])}/${yearFirst[1]}`
	}

	const digitsOnly = t.match(/^(\d{2})(\d{2})(\d{4})$/)
	if (digitsOnly) return `${digitsOnly[1]}/${digitsOnly[2]}/${digitsOnly[3]}`

	return null
}

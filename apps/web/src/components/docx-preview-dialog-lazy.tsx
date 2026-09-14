import { lazy, Suspense, useEffect, useState } from 'react'
import type { DocxPreviewDialogProps } from './docx-preview-dialog'

// @docx-editor.dev pulls in prosemirror and several MB of chunk deps - keep
// it out of the initial bundle and only fetch it the first time a preview is
// actually opened. Once opened, the component stays mounted (rather than
// unmounting when `open` goes false) so Radix's own close animation and the
// already-fetched chunk both survive across repeat opens.
const DocxPreviewDialog = lazy(() =>
	import('./docx-preview-dialog').then((m) => ({
		default: m.DocxPreviewDialog
	}))
)

export function LazyDocxPreviewDialog(props: DocxPreviewDialogProps) {
	const [hasOpened, setHasOpened] = useState(false)

	useEffect(() => {
		if (props.open) {
			setHasOpened(true)
		}
	}, [props.open])

	if (!hasOpened) {
		return null
	}

	return (
		<Suspense fallback={null}>
			<DocxPreviewDialog {...props} />
		</Suspense>
	)
}

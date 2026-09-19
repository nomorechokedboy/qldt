import { lazy, Suspense } from 'react'
import { ImportDialogSkeleton } from './import-dialog-skeleton'
import type { ImportStudentsDialogProps } from './import-students-dialog'

// exceljs + xlsx (and their internal chunks) are only needed while this
// dialog is open - keep them out of the initial bundle by only mounting
// (and thus importing) the real component once it's opened. The component
// itself already returns null while closed, so unmounting on close loses
// no state worth keeping.
const ImportStudentsDialog = lazy(() =>
	import('./import-students-dialog').then((m) => ({
		default: m.ImportStudentsDialog
	}))
)

export function LazyImportStudentsDialog(props: ImportStudentsDialogProps) {
	if (!props.isOpen) {
		return null
	}

	return (
		<Suspense
			fallback={
				<ImportDialogSkeleton
					isOpen={props.isOpen}
					onClose={props.onClose}
					title='Import danh sách quân nhân'
				/>
			}
		>
			<ImportStudentsDialog {...props} />
		</Suspense>
	)
}

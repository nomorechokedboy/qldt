import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Runs `onRefresh` and spins while it is pending, so a slow reload is visibly
// in progress and cannot be fired twice.
export default function RefreshButton({
	onRefresh
}: {
	onRefresh: () => unknown
}) {
	const { t } = useTranslation()
	const [pending, setPending] = useState(false)

	const handleClick = async () => {
		setPending(true)
		try {
			await onRefresh()
		} finally {
			setPending(false)
		}
	}

	return (
		<Button
			type='button'
			onClick={handleClick}
			disabled={pending}
			aria-label={t('actions.refresh')}
			title={t('actions.refresh')}
		>
			<RefreshCw className={pending ? 'animate-spin' : undefined} />
		</Button>
	)
}

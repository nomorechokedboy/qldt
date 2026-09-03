import ArtilleryIcon from '@/assets/artillery-icon.png'

interface ArtilleryEmblemProps {
	className?: string
	/** 'mark' = star + cannons only, for use inside an existing colored badge.
	 *  'badge' = adds the red roundel + gold rim, for use on a plain background. */
	variant?: 'mark' | 'badge'
}

export function ArtilleryEmblem({
	className,
	variant = 'mark'
}: ArtilleryEmblemProps) {
	const size = variant === 'mark' ? '30' : '100'
	return (
		<img
			src={ArtilleryIcon}
			alt='Lữ đoàn 75'
			width={size}
			height={size}
			className={className}
		/>
	)
}

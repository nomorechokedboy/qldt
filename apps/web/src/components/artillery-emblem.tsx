import ArtilleryIcon from '@/assets/artillery-icon.png'
import ArtilleryNoBGIcon from '@/assets/artillery-icon-no-bg.png'

interface ArtilleryEmblemProps {
	className?: string
	/** 'mark' = star + cannons only, for use inside an existing colored badge.
	 *  'badge' = adds the red roundel + gold rim, for use on a plain background. */
	variant?: 'mark' | 'badge'
	withBackground?: boolean
}

export function ArtilleryEmblem({
	className,
	variant = 'mark',
	withBackground = true
}: ArtilleryEmblemProps) {
	const size = variant === 'mark' ? '30' : '100'
	return (
		<img
			src={withBackground ? ArtilleryIcon : ArtilleryNoBGIcon}
			alt='Lữ đoàn 75'
			width={size}
			height={size}
			className={className}
		/>
	)
}

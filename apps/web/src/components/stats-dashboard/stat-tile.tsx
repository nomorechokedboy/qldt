interface StatTileProps {
	label: string
	value: number
	color: string
	// The subordinate-unit list is denser than the troop breakdown.
	size?: 'compact' | 'regular'
}

const SIZE_CLASSES = {
	compact: {
		box: 'rounded-lg border p-3 text-center',
		value: 'text-xl font-bold'
	},
	regular: {
		box: 'rounded-lg border p-4 text-center',
		value: 'text-2xl font-bold'
	}
} as const

// A bordered count with its label, coloured to match its chart slice.
export default function StatTile({
	label,
	value,
	color,
	size = 'regular'
}: StatTileProps) {
	const classes = SIZE_CLASSES[size]

	return (
		<div className={classes.box}>
			<div className={classes.value} style={{ color }}>
				{value}
			</div>
			<div className='text-xs text-muted-foreground'>{label}</div>
		</div>
	)
}

import type { ComponentType, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SectionCardProps {
	icon: ComponentType<{ className?: string }>
	title: string
	children: ReactNode
}

// The titled card every dashboard section sits in: an icon and heading over
// the section's content.
export default function SectionCard({
	icon: Icon,
	title,
	children
}: SectionCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Icon className='h-5 w-5' />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	)
}

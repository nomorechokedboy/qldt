interface UnitPageHeaderProps {
	title?: string
}

export default function UnitPageHeader({ title }: UnitPageHeaderProps) {
	return (
		<div className='flex items-center justify-between space-y-2'>
			<div>
				<h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
				<p className='text-muted-foreground'>
					Quản lý quân nhân, cơ sở vật chất và vũ khí/trang bị
				</p>
			</div>
		</div>
	)
}

import { createFileRoute, Link } from '@tanstack/react-router'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Building2, PieChart } from 'lucide-react'

export const Route = createFileRoute('/')({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<ProtectedRoute>
			<SidebarInset>
				{/* Themed background */}
				<div className='min-h-screen bg-gradient-to-br from-background via-background to-accent/40 p-6 animate-fadeIn'>
					{/* Hero */}
					<div className='flex flex-col items-center text-center space-y-4'>
						<img
							src='logo.png'
							alt='Logo'
							className='w-35 h-35 drop-shadow-md animate-fadeInUp'
						/>
						<h1 className='text-4xl font-extrabold text-foreground animate-fadeInUp delay-100'>
							Hệ thống Quản lý doanh trại
						</h1>
						<p className='text-muted-foreground max-w-2xl animate-fadeInUp delay-200'>
							Nền tảng giúp quản lý thông tin doanh trại nhanh
							chóng, dễ dàng và chính xác. Bạn có thể thêm mới,
							chỉnh sửa, tìm kiếm và thống kê quân số, vật tư và
							VKTBKT của đơn vị.
						</p>
						<div className='flex gap-4 animate-fadeInUp delay-300'>
							<Button
								size='lg'
								className='cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg transition-all'
								asChild
							>
								<Link to='/quan-ly-don-vi'>
									<Building2 className='w-5 h-5' />
									Quản lý đơn vị
								</Link>
							</Button>
							<Button
								size='lg'
								variant='outline'
								className='cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md transition-all'
								asChild
							>
								<Link to='/thong-ke-doanh-trai'>
									<PieChart className='w-5 h-5' />
									Thống kê doanh trại
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</SidebarInset>
		</ProtectedRoute>
	)
}

import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

function RootLayout() {
	return (
		<>
			<main className='bg-background mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4'>
				<div className='mt-2 flex flex-col items-center gap-1.5'>
					<h1 className='text-center text-2xl font-semibold'>
						Kiểm kê vũ khí/trang bị
					</h1>
					<div className='bg-primary h-[3px] w-10' />
				</div>
				<Outlet />
			</main>
			{import.meta.env.PROD !== true && <TanStackRouterDevtools />}
		</>
	)
}

export const Route = createRootRoute({ component: RootLayout })

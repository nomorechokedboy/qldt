import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

function RootLayout() {
	return (
		<>
			<main className='bg-background mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4'>
				<h1 className='mt-2 text-center text-xl font-bold'>
					Kiểm kê vũ khí/trang bị
				</h1>
				<Outlet />
			</main>
			{import.meta.env.PROD !== true && <TanStackRouterDevtools />}
		</>
	)
}

export const Route = createRootRoute({ component: RootLayout })

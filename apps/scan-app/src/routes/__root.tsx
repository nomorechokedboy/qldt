import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

function RootLayout() {
	// `dvh` now correctly excludes the gesture bar - MainActivity.kt no
	// longer opts into edge-to-edge, so Android reserves the system-bar
	// space itself before the WebView ever sees a viewport. Content
	// anchored to this container's bottom edge (the checklist's button
	// bar) lands exactly above the gesture bar, no JS measurement needed.
	return (
		<main className='bg-background mx-auto flex h-dvh md:max-w-full xs:max-w-md flex-col gap-4 p-4'>
			<div className='mt-2 flex flex-col items-center gap-1.5'>
				<h1 className='text-center text-2xl font-semibold'>
					Kiểm kê vũ khí/trang bị
				</h1>
				<div className='bg-primary h-[3px] w-10' />
			</div>
			<Outlet />
			{import.meta.env.PROD !== true && <TanStackRouterDevtools />}
		</main>
	)
}

export const Route = createRootRoute({ component: RootLayout })

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hcyu')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/hcyu"!</div>
}

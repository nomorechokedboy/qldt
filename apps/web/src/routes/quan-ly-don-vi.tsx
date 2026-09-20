import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/quan-ly-don-vi')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/quan-ly-don-vi"!</div>
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chuyen-dang-chinh-thuc')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/chuyen-dang-chinh-thuc"!</div>
}

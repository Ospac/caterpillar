import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "@/shared/ui/Header";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<div className="flex h-dvh flex-col">
			<Header />
			<div className="min-h-0 flex-1">
				<Outlet />
			</div>
			<TanStackRouterDevtools position="bottom-right" />
		</div>
	);
}

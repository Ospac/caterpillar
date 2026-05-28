import { Link } from "@tanstack/react-router";

function Header() {
	return (
		<nav className="p-2 flex gap-2 text-lg bg-light-green border-l border-r text-cyan-900">
			<div>🧩</div>
			<Link
				to="/"
				activeProps={{
					className: "font-bold",
				}}
				activeOptions={{ exact: true }}
			>
				Canvas
			</Link>
			<Link
				to="/about"
				activeProps={{
					className: "font-bold",
				}}
			>
				About
			</Link>
		</nav>
	);
}

export default Header;

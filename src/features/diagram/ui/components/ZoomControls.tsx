import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

import type { DiagramEdge, DiagramNode } from "../../model";

function ZoomButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="h-8 w-8 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
		>
			{label}
		</button>
	);
}

export function ZoomControls() {
	const reactFlow = useReactFlow<DiagramNode, DiagramEdge>();

	const zoomIn = useCallback(() => {
		void reactFlow.zoomIn({ duration: 200 });
	}, [reactFlow]);

	const zoomOut = useCallback(() => {
		void reactFlow.zoomOut({ duration: 200 });
	}, [reactFlow]);

	const fitView = useCallback(() => {
		void reactFlow.fitView({ duration: 200, padding: 0.2 });
	}, [reactFlow]);

	return (
		<div className="flex gap-2">
			<ZoomButton label="+" onClick={zoomIn} />
			<ZoomButton label="-" onClick={zoomOut} />
			<button
				type="button"
				onClick={fitView}
				className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
			>
				FIT
			</button>
		</div>
	);
}

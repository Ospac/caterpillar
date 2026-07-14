import { ViewportPortal } from "@xyflow/react";
import { CELL_SIZE } from "../../lib/grid";

export default function DropPreviewBox({
	position,
	span,
}: {
	position: { x: number; y: number };
	span: { cols: number; rows: number };
}) {
	return (
		<ViewportPortal>
			<div
				className="pointer-events-none absolute bg-purple-300/25"
				style={{
					width: span.cols * CELL_SIZE,
					height: span.rows * CELL_SIZE,
					transform: `translate(${position.x}px, ${position.y}px)`,
				}}
				aria-hidden="true"
			/>
		</ViewportPortal>
	);
}

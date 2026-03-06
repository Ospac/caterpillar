import { type GridStage, getStagePixelSize, NODE_SIZE } from "../../lib/grid";

export default function GridGuideOverlay({ stage }: { stage: GridStage }) {
	const size = getStagePixelSize(stage);

	return (
		<div
			className="pointer-events-none absolute left-0 top-0 z-10 border border-blue-300/70"
			style={{
				width: size,
				height: size,
				backgroundImage:
					"linear-gradient(to right, rgba(59,130,246,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.22) 1px, transparent 1px)",
				backgroundSize: `${NODE_SIZE}px ${NODE_SIZE}px`,
			}}
		/>
	);
}

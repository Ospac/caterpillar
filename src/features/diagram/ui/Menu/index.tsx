import type { GridStage } from "../../lib/geometry";
import { useCanvasStore } from "../../model/canvasStore";

interface HeaderProps {
	visibleStage: GridStage;
	occupiedCellCount: number;
	dockingCount: number;
}

export default function Menu({
	visibleStage,
	occupiedCellCount,
	dockingCount,
}: HeaderProps) {
	const mode = useCanvasStore((state) => state.mode);
	const setMode = useCanvasStore((state) => state.setMode);
	const addMenuNode = useCanvasStore((state) => state.addMenuNode);
	const isEditMode = mode === "edit";

	const handleAddNode = () => {
		if (!isEditMode) return;
		addMenuNode({
			x: 0,
			y: 0,
		});
	};

	return (
		<>
			<div className="absolute right-6 top-3 z-20 flex gap-1 border border-gray-300 bg-white p-0.5 text-xs">
				<button
					type="button"
					aria-pressed={mode === "read"}
					onClick={() => setMode("read")}
					className={`px-2.5 py-1 ${
						mode === "read" ? "bg-gray-900 text-white" : "text-gray-800"
					}`}
				>
					Read
				</button>
				<button
					type="button"
					aria-pressed={mode === "edit"}
					onClick={() => setMode("edit")}
					className={`px-2.5 py-1 ${
						mode === "edit" ? "bg-gray-900 text-white" : "text-gray-800"
					}`}
				>
					Edit
				</button>
			</div>
			<div className="absolute left-56 top-3 z-20 flex gap-2">
				<button
					type="button"
					onClick={handleAddNode}
					disabled={!isEditMode}
					className="border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Add Node
				</button>
			</div>
			<div className="absolute top-3 left-128 z-20 border border-gray-300 bg-white/90 px-2 py-1 text-[11px] text-gray-700">
				Stage: {visibleStage}x{visibleStage} | Occupied: {occupiedCellCount} |
				Docking: {dockingCount}
			</div>
		</>
	);
}

import { useShallow } from "zustand/react/shallow";
import { Button } from "@/shared/ui/button";
import { GRID_CELL_COUNT, MAX_GRID_ZOOM, MIN_GRID_ZOOM } from "../../lib/grid";
import { useCanvasStore } from "../../model/canvasStore";

interface HeaderProps {
	occupiedCellCount: number;
	dockingCount: number;
	zoom: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onZoomReset: () => void;
}

export default function Menu({
	occupiedCellCount,
	dockingCount,
	zoom,
	onZoomIn,
	onZoomOut,
	onZoomReset,
}: HeaderProps) {
	const { mode, setMode, addMenuNode } = useCanvasStore(
		useShallow((state) => ({
			mode: state.mode,
			setMode: state.setMode,
			addMenuNode: state.addMenuNode,
		})),
	);
	const isEditMode = mode === "edit";

	const handleAddNode = () => {
		if (!isEditMode) return;
		addMenuNode({
			x: 0,
			y: 0,
		});
	};

	return (
		<div>
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
			<div className="absolute right-6 top-14 z-20 flex items-center gap-1 rounded-md border border-gray-300 bg-white p-0.5 text-xs">
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onZoomOut}
					disabled={zoom <= MIN_GRID_ZOOM}
					aria-label="Zoom out"
				>
					-
				</Button>
				<span className="min-w-10 text-center tabular-nums">
					{Math.round(zoom * 100)}%
				</span>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onZoomIn}
					disabled={zoom >= MAX_GRID_ZOOM}
					aria-label="Zoom in"
				>
					+
				</Button>
				<Button type="button" variant="ghost" size="xs" onClick={onZoomReset}>
					Reset
				</Button>
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
			<div className="md:block hidden absolute top-3 left-128 z-20 border border-gray-300 bg-white/90 px-2 py-1 text-[11px] text-gray-700">
				Cells: {GRID_CELL_COUNT}x{GRID_CELL_COUNT} | Occupied:{" "}
				{occupiedCellCount} | Docking: {dockingCount}
			</div>
		</div>
	);
}

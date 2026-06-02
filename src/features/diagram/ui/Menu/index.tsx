import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import type { GridStage } from "../../lib/geometry";
import { GRID_STAGES, getNodesOutsideStage } from "../../lib/grid";
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
	const {
		mode,
		nodes,
		setMode,
		setVisibleStage,
		shrinkVisibleStage,
		addMenuNode,
	} = useCanvasStore(
		useShallow((state) => ({
			mode: state.mode,
			nodes: state.nodes,
			setMode: state.setMode,
			setVisibleStage: state.setVisibleStage,
			shrinkVisibleStage: state.shrinkVisibleStage,
			addMenuNode: state.addMenuNode,
		})),
	);
	const [pendingStage, setPendingStage] = useState<GridStage | null>(null);
	const isEditMode = mode === "edit";
	const pendingRemovedNodeCount = pendingStage
		? getNodesOutsideStage(nodes, pendingStage).length
		: 0;

	const handleAddNode = () => {
		if (!isEditMode) return;
		addMenuNode({
			x: 0,
			y: 0,
		});
	};

	const handleStageChange = (value: string) => {
		if (!isEditMode || value === "") return;

		const stage = Number(value) as GridStage;
		if (stage === visibleStage) return;

		const removedNodeCount = getNodesOutsideStage(nodes, stage).length;
		if (stage < visibleStage && removedNodeCount > 0) {
			setPendingStage(stage);
			return;
		}

		setVisibleStage(stage);
	};

	const handleConfirmStageShrink = () => {
		if (!pendingStage) return;

		shrinkVisibleStage(pendingStage);
		setPendingStage(null);
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
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={String(visibleStage)}
					onValueChange={handleStageChange}
					disabled={!isEditMode}
					aria-label="Stage size"
				>
					{GRID_STAGES.map((stage) => (
						<ToggleGroupItem
							key={stage}
							value={String(stage)}
							aria-label={`${stage} by ${stage} stage`}
						>
							{stage}x{stage}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
			<div className="md:block hidden absolute top-3 left-128 z-20 border border-gray-300 bg-white/90 px-2 py-1 text-[11px] text-gray-700">
				Stage: {visibleStage}x{visibleStage} | Occupied: {occupiedCellCount} |
				Docking: {dockingCount}
			</div>
			<AlertDialog
				open={pendingStage !== null}
				onOpenChange={(open) => {
					if (!open) setPendingStage(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>스테이지를 축소할까요?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingRemovedNodeCount}개의 노드가 삭제됩니다. 삭제된 노드에
							연결된 엣지도 함께 제거됩니다.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={handleConfirmStageShrink}
						>
							삭제 후 축소
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

import { type OnNodeDrag, type OnNodesChange, useStore } from "@xyflow/react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getNodeSpan } from "../lib/blockSpan";
import { canvasRuntimeReducer, createCanvasReducerState } from "../lib/canvasRuntimeReducer";
import { createDockedNodeState, resolveDropPosition } from "../lib/docking";
import type { GridOccupancy } from "../lib/geometry";
import { DEFAULT_GRID_DIMENSIONS } from "../lib/grid";
import { useCanvasStore } from "../model/canvasStore";
import type { DiagramNode } from "../model/nodeTypes";
import { type CanvasRuntimeState, createInitialCanvasRuntimeState } from "../model/runtime";

interface UseCanvasNodesInput {
	isEditMode: boolean;
	nodes: DiagramNode[];
	occupancy: GridOccupancy;
}

interface CanvasNodeHandlers {
	isNodeDragging: boolean;
	nodeDockingState: CanvasRuntimeState["nodeDockingState"];
	onNodesChange: OnNodesChange<DiagramNode>;
	onNodeDragStop: OnNodeDrag<DiagramNode>;
}

export function useCanvasNodes({
	isEditMode,
	nodes,
	occupancy,
}: UseCanvasNodesInput): CanvasNodeHandlers {
	const isNodeDragging = useStore((state) =>
		Array.from(state.nodeLookup.values()).some((node) => node.dragging),
	);
	const [initialRuntimeState] = useState<CanvasRuntimeState>(() =>
		createInitialCanvasRuntimeState(),
	);
	const [canvasState, dispatchCanvasState] = useReducer(
		canvasRuntimeReducer,
		initialRuntimeState,
		createCanvasReducerState,
	);
	const { nodeDockingState } = canvasState;
	const { applyNodesChange, commitNodePosition } = useCanvasStore(
		useShallow((state) => ({
			applyNodesChange: state.applyNodesChange,
			commitNodePosition: state.commitNodePosition,
		})),
	);

	const onNodesChange = useCallback<OnNodesChange<DiagramNode>>(
		(changes) => {
			if (!isEditMode) return;
			applyNodesChange(changes);
		},
		[applyNodesChange, isEditMode],
	);

	const onNodeDragStop = useCallback<OnNodeDrag<DiagramNode>>(
		(_, node) => {
			if (!isEditMode) return;

			const span = getNodeSpan(node.data.blockType);
			const currentDockingState =
				nodeDockingState[node.id] ??
				createDockedNodeState(node.position, span, DEFAULT_GRID_DIMENSIONS);
			const resolution = resolveDropPosition({
				position: node.position,
				gridDimensions: DEFAULT_GRID_DIMENSIONS,
				occupancy,
				span,
				ignoreNodeId: node.id,
				lastValidDock: currentDockingState.lastValidDock,
			});

			commitNodePosition(node.id, resolution.position);
			dispatchCanvasState({
				type: "nodeDropCommitted",
				nodeId: node.id,
				position: resolution.position,
				span,
				dockedCell: resolution.cell,
			});
		},
		[commitNodePosition, isEditMode, nodeDockingState, occupancy],
	);

	useEffect(() => {
		dispatchCanvasState({ type: "nodesSynced", nodes });
	}, [nodes]);

	return {
		isNodeDragging,
		nodeDockingState,
		onNodesChange,
		onNodeDragStop,
	};
}

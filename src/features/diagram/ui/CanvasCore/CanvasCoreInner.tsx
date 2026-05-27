import {
	type Connection,
	ConnectionMode,
	type CoordinateExtent,
	type Edge,
	type Node,
	type NodeTypes,
	type OnEdgesChange,
	type OnNodesChange,
	ReactFlow,
	type Viewport,
} from "@xyflow/react";

import { type MouseEvent, useEffect, useReducer, useState } from "react";
import { getNodeSpan } from "../../lib/blockSpan";
import { createDockedNodeState, resolveDropPosition } from "../../lib/docking";
import {
	CELL_SIZE,
	getGridOccupancy,
	getNextStage,
	getStagePixelSize,
	isNodeEscapingStage,
	MAX_GRID_STAGE,
} from "../../lib/grid";
import { useCanvasStore } from "../../model/canvasStore";
import type { DiagramNode } from "../../model/nodeTypes";
import {
	type CanvasRuntimeState,
	createInitialCanvasRuntimeState,
} from "../../model/runtime";
import BlockNode from "./BlockNode";
import {
	canvasRuntimeReducer,
	createCanvasReducerState,
} from "./canvasRuntimeReducer";
import GridGuideOverlay from "./GridGuideOverlay";
import MenuNode from "./MenuNode";

const LOCKED_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const MAX_STAGE_PIXEL_SIZE = getStagePixelSize(MAX_GRID_STAGE);
const NODE_EXTENT: CoordinateExtent = [
	[0, 0],
	[MAX_STAGE_PIXEL_SIZE, MAX_STAGE_PIXEL_SIZE],
];
const nodeTypes: NodeTypes = {
	menu: MenuNode,
	block: BlockNode,
};

export function CanvasCoreInner() {
	// 초기값을 마운트 시점에 한 번만 계산
	const [initialRuntimeState] = useState<CanvasRuntimeState>(() =>
		createInitialCanvasRuntimeState(),
	);
	const [canvasState, dispatchCanvasState] = useReducer(
		canvasRuntimeReducer,
		initialRuntimeState,
		createCanvasReducerState,
	);
	const mode = useCanvasStore((state) => state.mode);
	const nodes = useCanvasStore((state) => state.nodes);
	const edges = useCanvasStore((state) => state.edges);
	const visibleStage = useCanvasStore((state) => state.visibleStage);
	const setMode = useCanvasStore((state) => state.setMode);
	const setVisibleStage = useCanvasStore((state) => state.setVisibleStage);
	const addMenuNode = useCanvasStore((state) => state.addMenuNode);
	const connectEdge = useCanvasStore((state) => state.connectEdge);
	const removeEdge = useCanvasStore((state) => state.removeEdge);
	const applyNodesChange = useCanvasStore((state) => state.applyNodesChange);
	const applyEdgesChange = useCanvasStore((state) => state.applyEdgesChange);
	const commitNodePosition = useCanvasStore(
		(state) => state.commitNodePosition,
	);
	const { nodeDockingState, showGuide } = canvasState;
	const isEditMode = mode === "edit";

	const stagePixelSize = getStagePixelSize(visibleStage);
	const occupancy = getGridOccupancy(nodes, visibleStage);

	const onConnect = (connection: Connection) => {
		if (!isEditMode) return;
		connectEdge(connection);
	};

	const onNodesChange: OnNodesChange<DiagramNode> = (changes) => {
		if (!isEditMode) return;
		applyNodesChange(changes);
	};

	const onEdgesChange: OnEdgesChange<Edge> = (changes) => {
		if (!isEditMode) return;
		applyEdgesChange(changes);
	};

	const handleEdgeDoubleClick = (_: MouseEvent, edge: Edge) => {
		if (!isEditMode) return;
		removeEdge(edge.id);
	};

	const handleNodeDragStart = (_: MouseEvent, _node: Node) => {
		if (!isEditMode) return;
		dispatchCanvasState({ type: "dragStarted" });
	};

	const handleNodeDrag = (_: MouseEvent, node: Node) => {
		if (!isEditMode) return;

		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		if (isNodeEscapingStage(diagramNode.position, visibleStage, span)) {
			setVisibleStage(getNextStage(visibleStage));
		}
	};

	const handleNodeDragStop = (_: MouseEvent, node: Node) => {
		if (!isEditMode) return;

		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		const currentDockingState =
			nodeDockingState[diagramNode.id] ??
			createDockedNodeState(diagramNode.position, visibleStage, span);

		const resolution = resolveDropPosition({
			position: diagramNode.position,
			stage: visibleStage,
			occupancy,
			span,
			ignoreNodeId: diagramNode.id,
			lastValidDock: currentDockingState.lastValidDock,
		});

		commitNodePosition(diagramNode.id, resolution.position);

		dispatchCanvasState({
			type: "nodeDropCommitted",
			nodeId: diagramNode.id,
			position: resolution.position,
			span,
			visibleStage,
			dockedCell: resolution.cell,
		});
	};

	const handleAddNode = () => {
		if (!isEditMode) return;
		addMenuNode({
			x: 0,
			y: 0,
		});
	};

	useEffect(() => {
		dispatchCanvasState({ type: "nodesSynced", nodes, visibleStage });
	}, [nodes, visibleStage]);

	return (
		<div className="h-full w-full overflow-auto rounded-lg border border-gray-300 bg-light-green p-4">
			<div className="absolute left-6 top-3 z-20 flex gap-1 rounded border border-gray-300 bg-white p-0.5 text-xs">
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
					className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Add Node
				</button>
			</div>
			<div className="absolute top-3 left-128 z-20 rounded border border-gray-300 bg-white/90 px-2 py-1 text-[11px] text-gray-700">
				Stage: {visibleStage}x{visibleStage} | Occupied:{" "}
				{occupancy.occupiedCellCount} | Docking:{" "}
				{Object.keys(nodeDockingState).length}
			</div>
			<div
				className="relative bg-light-green"
				style={{ width: stagePixelSize, height: stagePixelSize }}
			>
				{showGuide ? <GridGuideOverlay stage={visibleStage} /> : null}

				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onEdgeDoubleClick={handleEdgeDoubleClick}
					onNodeDragStart={handleNodeDragStart}
					onNodeDrag={handleNodeDrag}
					onNodeDragStop={handleNodeDragStop}
					nodeTypes={nodeTypes}
					nodeExtent={NODE_EXTENT}
					defaultViewport={LOCKED_VIEWPORT}
					nodesDraggable={isEditMode}
					nodesConnectable={isEditMode}
					elementsSelectable={isEditMode}
					snapToGrid={false}
					snapGrid={[CELL_SIZE, CELL_SIZE]}
					autoPanOnNodeDrag={false}
					autoPanOnConnect={false}
					connectionMode={ConnectionMode.Loose}
					panOnDrag={false}
					panOnScroll={false}
					preventScrolling={false}
					zoomOnDoubleClick={false}
					zoomOnPinch={false}
					zoomOnScroll={false}
					deleteKeyCode={isEditMode ? ["Backspace", "Delete"] : null}
					proOptions={{
						hideAttribution: true,
					}}
					/* TODO: minZoom, maxZoom값을 GridGuideOverlay, nodeExtent와 통합 (2번째, 3번째 status에서 Zoom 낮추기) */
					minZoom={1}
					maxZoom={1}
				/>
			</div>
		</div>
	);
}

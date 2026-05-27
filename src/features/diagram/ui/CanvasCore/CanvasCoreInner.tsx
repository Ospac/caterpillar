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

import {
	type MouseEvent,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "react";
import { getNodeSpan } from "../../lib/blockSpan";
import { createDockedNodeState, resolveDropPosition } from "../../lib/docking";
import {
	CELL_SIZE,
	getGridOccupancy,
	getStagePixelSize,
	MAX_GRID_STAGE,
} from "../../lib/grid";
import type { BlockData, BlockType } from "../../model/blockTypes";
import { addNode } from "../../model/document";
import type { DiagramNode } from "../../model/nodeTypes";
import {
	type CanvasRuntimeState,
	createInitialCanvasRuntimeState,
} from "../../model/runtime";
import BlockNode from "./BlockNode";
import {
	canvasGraphReducer,
	createCanvasGraphState,
} from "./canvasGraphReducer";
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
	const [graphState, dispatchGraphState] = useReducer(
		canvasGraphReducer,
		initialRuntimeState,
		createCanvasGraphState,
	);

	const { nodes, edges } = graphState;
	const { visibleStage, nodeDockingState, showGuide } = canvasState;

	const stagePixelSize = getStagePixelSize(visibleStage);
	const occupancy = getGridOccupancy(nodes, visibleStage);
	const nodeIdRef = useRef(initialRuntimeState.nodes.length + 1);

	const getNextNodeId = () => {
		const id = `node-${nodeIdRef.current}`;
		nodeIdRef.current += 1;
		return id;
	};

	const onConnect = (connection: Connection) => {
		dispatchGraphState({ type: "edgeConnected", connection });
	};

	const onNodesChange: OnNodesChange<DiagramNode> = (changes) => {
		dispatchGraphState({ type: "nodesChanged", changes });
	};

	const onEdgesChange: OnEdgesChange<Edge> = (changes) => {
		dispatchGraphState({ type: "edgesChanged", changes });
	};

	const handleEdgeDoubleClick = (_: MouseEvent, edge: Edge) => {
		dispatchGraphState({ type: "edgeRemoved", edgeId: edge.id });
	};

	const handleBlockDataChange = (nodeId: string, newData: BlockData) => {
		dispatchGraphState({
			type: "blockDataChanged",
			nodeId,
			data: newData,
		});
	};

	const handleBlockEditStateChange = (nodeId: string, isEditing: boolean) => {
		dispatchGraphState({
			type: "blockEditStateChanged",
			nodeId,
			isEditing,
		});
	};

	const handleNodeDragStart = (_: MouseEvent, _node: Node) => {
		dispatchCanvasState({ type: "dragStarted" });
	};

	const handleNodeDrag = (_: MouseEvent, node: Node) => {
		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		dispatchCanvasState({
			type: "nodeDragged",
			position: diagramNode.position,
			span,
		});
	};

	const handleNodeDragStop = (_: MouseEvent, node: Node) => {
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

		dispatchGraphState({
			type: "nodePositionChanged",
			nodeId: diagramNode.id,
			position: resolution.position,
		});

		dispatchCanvasState({
			type: "nodeDropCommitted",
			nodeId: diagramNode.id,
			position: resolution.position,
			span,
			dockedCell: resolution.cell,
		});
	};

	const handleMenuTypeSelect = (menuNodeId: string, blockType: BlockType) => {
		dispatchGraphState({
			type: "menuTypeSelected",
			menuNodeId,
			blockNodeId: getNextNodeId(),
			blockType,
			onDataChange: handleBlockDataChange,
			onEditStateChange: handleBlockEditStateChange,
		});
	};

	const handleAddNode = () => {
		dispatchGraphState({
			type: "nodeAdded",
			node: addNode({
				id: getNextNodeId(),
				onTypeSelect: handleMenuTypeSelect,
				stagePixelSize,
				visibleStage,
			}),
		});
	};

	useEffect(() => {
		dispatchCanvasState({ type: "nodesSynced", nodes });
	}, [nodes]);

	return (
		<div className="h-full w-full overflow-auto rounded-lg border border-gray-300 bg-light-green p-4">
			<div className="absolute left-56 top-3 z-20 flex gap-2">
				<button
					type="button"
					onClick={handleAddNode}
					className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800"
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
					deleteKeyCode={["Backspace", "Delete"]}
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

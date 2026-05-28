import {
	type Connection,
	ConnectionMode,
	type CoordinateExtent,
	type Edge,
	type Node,
	type NodeTypes,
	type OnConnectEnd,
	type OnEdgesChange,
	type OnNodesChange,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
	type Viewport,
} from "@xyflow/react";

import {
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useReducer,
	useState,
} from "react";
import { getNodeSpan } from "../../lib/blockSpan";
import {
	canvasRuntimeReducer,
	createCanvasReducerState,
} from "../../lib/canvasRuntimeReducer";
import { createDockedNodeState, resolveDropPosition } from "../../lib/docking";
import {
	resolveEdgeDropConnectionHandles,
	resolveEdgeDropPosition,
} from "../../lib/edge";
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
import Menu from "../Menu";
import BlockNode from "./BlockNode";
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

function getClientPosition(event: MouseEvent | TouchEvent) {
	if ("changedTouches" in event) {
		const touch = event.changedTouches[0];
		return touch ? { x: touch.clientX, y: touch.clientY } : null;
	}

	return { x: event.clientX, y: event.clientY };
}

export function CanvasCore() {
	return (
		<ReactFlowProvider>
			<CanvasCoreInner />
		</ReactFlowProvider>
	);
}

function CanvasCoreInner() {
	const { screenToFlowPosition } = useReactFlow();
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

	const onConnectStart = () => {
		if (!isEditMode) return;
		dispatchCanvasState({ type: "dragStarted" });
	};

	const onConnect = (connection: Connection) => {
		if (!isEditMode) return;
		connectEdge(connection);
	};

	const onConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (!isEditMode || connectionState.isValid || !connectionState.fromNode) {
			return;
		}
		dispatchCanvasState({ type: "dragEnded" });

		const clientPosition = getClientPosition(event);
		if (!clientPosition) return;

		const flowPosition = screenToFlowPosition(clientPosition);
		const menuNodePosition = resolveEdgeDropPosition({
			position: flowPosition,
			stage: visibleStage,
			occupancy,
		});
		if (!menuNodePosition) return;

		const menuNodeId = addMenuNode(menuNodePosition);
		if (!menuNodeId) return;

		const sourceNodeId = connectionState.fromNode.id;
		const sourceNode = nodes.find((node) => node.id === sourceNodeId);
		const connectionHandles = sourceNode
			? resolveEdgeDropConnectionHandles(
					sourceNode,
					menuNodePosition,
					connectionState.fromHandle?.id ?? null,
				)
			: {
					sourceHandle: connectionState.fromHandle?.id ?? null,
					targetHandle: null,
				};
		connectEdge({
			source: sourceNodeId,
			target: menuNodeId,
			sourceHandle: connectionHandles.sourceHandle,
			targetHandle: connectionHandles.targetHandle,
		});
	};

	const onNodesChange: OnNodesChange<DiagramNode> = (changes) => {
		if (!isEditMode) return;
		applyNodesChange(changes);
	};

	const onEdgesChange: OnEdgesChange<Edge> = (changes) => {
		if (!isEditMode) return;
		applyEdgesChange(changes);
	};

	const handleEdgeDoubleClick = (_: ReactMouseEvent, edge: Edge) => {
		if (!isEditMode) return;
		removeEdge(edge.id);
	};

	const handleNodeDragStart = (_: ReactMouseEvent, _node: Node) => {
		if (!isEditMode) return;
		dispatchCanvasState({ type: "dragStarted" });
	};

	const handleNodeDrag = (_: ReactMouseEvent, node: Node) => {
		if (!isEditMode) return;

		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		if (isNodeEscapingStage(diagramNode.position, visibleStage, span)) {
			setVisibleStage(getNextStage(visibleStage));
		}
	};

	const handleNodeDragStop = (_: ReactMouseEvent, node: Node) => {
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

	useEffect(() => {
		dispatchCanvasState({ type: "nodesSynced", nodes, visibleStage });
	}, [nodes, visibleStage]);

	return (
		<div className="h-full w-full overflow-auto border border-gray-300 bg-purple-50">
			<Menu
				visibleStage={visibleStage}
				occupiedCellCount={occupancy.occupiedCellCount}
				dockingCount={Object.keys(nodeDockingState).length}
			/>
			<div
				className="relative"
				style={{ width: stagePixelSize, height: stagePixelSize }}
			>
				{showGuide ? <GridGuideOverlay stage={visibleStage} /> : null}
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnectStart={onConnectStart}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
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

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
	useConnection,
	useReactFlow,
	useStore,
	type Viewport,
} from "@xyflow/react";

import {
	type MouseEvent as ReactMouseEvent,
	useEffect,
	useReducer,
	useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { getNodeSpan } from "../../lib/blockSpan";
import {
	canvasRuntimeReducer,
	createCanvasReducerState,
} from "../../lib/canvasRuntimeReducer";
import { createDockedNodeState, resolveDropPosition } from "../../lib/docking";
import {
	getClientPosition,
	resolveEdgeDropConnectionHandles,
	resolveEdgeDropPosition,
} from "../../lib/edge";
import {
	CELL_SIZE,
	DEFAULT_GRID_DIMENSIONS,
	getGridOccupancy,
	getGridPixelSize,
} from "../../lib/grid";
import { useCanvasZoom } from "../../lib/hooks/useCanvasZoom";
import { useCanvasStore } from "../../model/canvasStore";
import type { DiagramNode } from "../../model/nodeTypes";
import {
	type CanvasRuntimeState,
	createInitialCanvasRuntimeState,
} from "../../model/runtime";
import Menu from "../Menu";
import BlockNode from "./BlockNode";
import EdgeDropOverlay from "./EdgeDropOverlay";
import GridGuideOverlay from "./GridGuideOverlay";
import MenuNode from "./MenuNode";
import NodeDropOverlay from "./NodeDropOverlay";

const GRID_PIXEL_SIZE = getGridPixelSize();
const NODE_EXTENT: CoordinateExtent = [
	[0, 0],
	[GRID_PIXEL_SIZE.width, GRID_PIXEL_SIZE.height],
];
const nodeTypes: NodeTypes = {
	menu: MenuNode,
	block: BlockNode,
};

export function CanvasCore() {
	return (
		<ReactFlowProvider>
			<CanvasCoreInner />
		</ReactFlowProvider>
	);
}

function CanvasCoreInner() {
	const { screenToFlowPosition } = useReactFlow();
	const { inProgress: isEdgeDragging } = useConnection<DiagramNode>();
	const isNodeDragging = useStore((state) =>
		Array.from(state.nodeLookup.values()).some((node) => node.dragging),
	);
	// 초기값을 마운트 시점에 한 번만 계산
	const [initialRuntimeState] = useState<CanvasRuntimeState>(() =>
		createInitialCanvasRuntimeState(),
	);
	const [canvasState, dispatchCanvasState] = useReducer(
		canvasRuntimeReducer,
		initialRuntimeState,
		createCanvasReducerState,
	);
	const { nodeDockingState } = canvasState;

	const {
		mode,
		nodes,
		edges,
		addMenuNode,
		connectEdge,
		removeEdge,
		applyNodesChange,
		applyEdgesChange,
		commitNodePosition,
	} = useCanvasStore(
		useShallow((state) => ({
			mode: state.mode,
			nodes: state.nodes,
			edges: state.edges,
			addMenuNode: state.addMenuNode,
			connectEdge: state.connectEdge,
			removeEdge: state.removeEdge,
			applyNodesChange: state.applyNodesChange,
			applyEdgesChange: state.applyEdgesChange,
			commitNodePosition: state.commitNodePosition,
		})),
	);
	const isEditMode = mode === "edit";

	const {
		scrollContainerRef,
		gridZoom,
		minGridZoom,
		maxGridZoom,
		renderedGridSize,
		isZooming,
		zoomIn,
		zoomOut,
		resetZoom,
	} = useCanvasZoom();
	const viewport: Viewport = { x: 0, y: 0, zoom: gridZoom };
	const occupancy = getGridOccupancy(nodes);
	const shouldShowGridGuide = isNodeDragging || isEdgeDragging || isZooming;

	const onConnect = (connection: Connection) => {
		if (!isEditMode) return;
		connectEdge(connection);
	};

	const onConnectEnd: OnConnectEnd = (event, connectionState) => {
		if (!isEditMode || connectionState.isValid || !connectionState.fromNode) {
			return;
		}
		const clientPosition = getClientPosition(event);
		if (!clientPosition) return;

		const flowPosition = screenToFlowPosition(clientPosition);
		const menuNodePosition = resolveEdgeDropPosition({
			position: flowPosition,
			gridDimensions: DEFAULT_GRID_DIMENSIONS,
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

	const handleNodeDragStop = (_: ReactMouseEvent, node: Node) => {
		if (!isEditMode) return;

		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		const currentDockingState =
			nodeDockingState[diagramNode.id] ??
			createDockedNodeState(
				diagramNode.position,
				span,
				DEFAULT_GRID_DIMENSIONS,
			);

		const resolution = resolveDropPosition({
			position: diagramNode.position,
			gridDimensions: DEFAULT_GRID_DIMENSIONS,
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
			dockedCell: resolution.cell,
		});
	};

	useEffect(() => {
		dispatchCanvasState({ type: "nodesSynced", nodes });
	}, [nodes]);

	return (
		<div
			ref={scrollContainerRef}
			className="h-full w-full overflow-auto border border-gray-300 bg-purple-50"
		>
			<Menu
				occupiedCellCount={occupancy.occupiedCellCount}
				dockingCount={Object.keys(nodeDockingState).length}
				zoom={gridZoom}
				zoomDisplayMin={minGridZoom}
				zoomDisplayMax={maxGridZoom}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onZoomReset={resetZoom}
			/>
			<div
				className="relative mx-auto my-0"
				style={{
					width: renderedGridSize.width,
					height: renderedGridSize.height,
				}}
			>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
					onEdgeDoubleClick={handleEdgeDoubleClick}
					onNodeDragStop={handleNodeDragStop}
					nodeTypes={nodeTypes}
					nodeExtent={NODE_EXTENT}
					viewport={viewport}
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
					minZoom={gridZoom}
					maxZoom={gridZoom}
				>
					<GridGuideOverlay visible={shouldShowGridGuide} />
					<EdgeDropOverlay isEditMode={isEditMode} occupancy={occupancy} />
					<NodeDropOverlay
						isEditMode={isEditMode}
						nodeDockingState={nodeDockingState}
						occupancy={occupancy}
					/>
				</ReactFlow>
			</div>
		</div>
	);
}

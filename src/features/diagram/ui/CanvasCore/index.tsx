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
	useCallback,
	useEffect,
	useLayoutEffect,
	useReducer,
	useRef,
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
	GRID_CELL_COUNT,
	GRID_ZOOM_BUTTON_CELL_STEP,
	getCellAlignedAnchoredScrollOffset,
	getClampedVisibleCellCount,
	getGridOccupancy,
	getGridPixelSize,
	getGridZoomForVisibleCells,
	getNextGridVisibleCellCount,
	getResponsiveGridVisibleCellCount,
	getWheelGridVisibleCellCount,
	isGridZoomWheelEvent,
} from "../../lib/grid";
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
	[GRID_PIXEL_SIZE, GRID_PIXEL_SIZE],
];
const ZOOM_GUIDE_VISIBLE_MS = 600;
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
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const pendingScrollAnchorRef = useRef<{
		flowX: number;
		flowY: number;
		anchorX: number;
		anchorY: number;
	} | null>(null);
	const zoomGuideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const [containerWidth, setContainerWidth] = useState(0);
	const [manualVisibleCellCount, setManualVisibleCellCount] = useState<
		number | null
	>(null);
	const [isZooming, setIsZooming] = useState(false);
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

	const responsiveGridVisibleCellCount =
		getResponsiveGridVisibleCellCount(containerWidth);
	const gridVisibleCellCount =
		manualVisibleCellCount ?? responsiveGridVisibleCellCount;
	const gridZoom = getGridZoomForVisibleCells(
		containerWidth,
		gridVisibleCellCount,
	);
	const renderedGridPixelSize = GRID_PIXEL_SIZE * gridZoom;
	const viewport: Viewport = { x: 0, y: 0, zoom: gridZoom };
	const occupancy = getGridOccupancy(nodes);
	const shouldShowGridGuide = isNodeDragging || isEdgeDragging || isZooming;

	const captureScrollCenter = useCallback(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const anchorX = scrollContainer.clientWidth / 2;
		const anchorY = scrollContainer.clientHeight / 2;
		pendingScrollAnchorRef.current = {
			flowX: (scrollContainer.scrollLeft + anchorX) / gridZoom,
			flowY: (scrollContainer.scrollTop + anchorY) / gridZoom,
			anchorX,
			anchorY,
		};
	}, [gridZoom]);

	const capturePointerScrollAnchor = useCallback(
		(event: WheelEvent) => {
			const scrollContainer = scrollContainerRef.current;
			if (!scrollContainer) return;

			const rect = scrollContainer.getBoundingClientRect();
			const anchorX = event.clientX - rect.left;
			const anchorY = event.clientY - rect.top;
			pendingScrollAnchorRef.current = {
				flowX: (scrollContainer.scrollLeft + anchorX) / gridZoom,
				flowY: (scrollContainer.scrollTop + anchorY) / gridZoom,
				anchorX,
				anchorY,
			};
		},
		[gridZoom],
	);

	const showZoomGuide = useCallback(() => {
		if (zoomGuideTimeoutRef.current) {
			clearTimeout(zoomGuideTimeoutRef.current);
		}

		setIsZooming(true);
		zoomGuideTimeoutRef.current = setTimeout(() => {
			setIsZooming(false);
			zoomGuideTimeoutRef.current = null;
		}, ZOOM_GUIDE_VISIBLE_MS);
	}, []);

	const updateManualVisibleCellCount = useCallback(
		(
			nextVisibleCellCount: number,
			captureScrollAnchor = captureScrollCenter,
		) => {
			const clampedVisibleCellCount = getClampedVisibleCellCount(
				containerWidth,
				nextVisibleCellCount,
			);
			if (clampedVisibleCellCount === gridVisibleCellCount) return;

			captureScrollAnchor();
			showZoomGuide();
			setManualVisibleCellCount(clampedVisibleCellCount);
		},
		[captureScrollCenter, containerWidth, gridVisibleCellCount, showZoomGuide],
	);

	const handleZoomIn = () => {
		updateManualVisibleCellCount(
			getNextGridVisibleCellCount(
				gridVisibleCellCount,
				containerWidth,
				-GRID_ZOOM_BUTTON_CELL_STEP,
			),
		);
	};

	const handleZoomOut = () => {
		updateManualVisibleCellCount(
			getNextGridVisibleCellCount(
				gridVisibleCellCount,
				containerWidth,
				GRID_ZOOM_BUTTON_CELL_STEP,
			),
		);
	};

	const handleZoomReset = () => {
		if (manualVisibleCellCount === null) return;

		if (responsiveGridVisibleCellCount === gridVisibleCellCount) {
			setManualVisibleCellCount(null);
			return;
		}

		captureScrollCenter();
		showZoomGuide();
		setManualVisibleCellCount(null);
	};

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const updateContainerWidth = () => {
			setContainerWidth(scrollContainer.clientWidth);
		};
		const observer = new ResizeObserver(updateContainerWidth);

		updateContainerWidth();
		observer.observe(scrollContainer);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const handleWheel = (event: WheelEvent) => {
			if (!isGridZoomWheelEvent(event)) return;

			event.preventDefault();
			updateManualVisibleCellCount(
				getWheelGridVisibleCellCount(
					gridVisibleCellCount,
					event.deltaY,
					containerWidth,
				),
				() => capturePointerScrollAnchor(event),
			);
		};

		scrollContainer.addEventListener("wheel", handleWheel, { passive: false });
		return () => scrollContainer.removeEventListener("wheel", handleWheel);
	}, [
		capturePointerScrollAnchor,
		containerWidth,
		gridVisibleCellCount,
		updateManualVisibleCellCount,
	]);

	useEffect(() => {
		return () => {
			if (zoomGuideTimeoutRef.current) {
				clearTimeout(zoomGuideTimeoutRef.current);
			}
		};
	}, []);

	useLayoutEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		const anchor = pendingScrollAnchorRef.current;
		if (!scrollContainer || !anchor) return;

		scrollContainer.scrollLeft = getCellAlignedAnchoredScrollOffset(
			anchor.flowX,
			anchor.anchorX,
			gridZoom,
			scrollContainer.clientWidth,
		);
		scrollContainer.scrollTop = getCellAlignedAnchoredScrollOffset(
			anchor.flowY,
			anchor.anchorY,
			gridZoom,
			scrollContainer.clientHeight,
		);
		pendingScrollAnchorRef.current = null;
	}, [gridZoom]);

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
			cellCount: GRID_CELL_COUNT,
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
			createDockedNodeState(diagramNode.position, span, GRID_CELL_COUNT);

		const resolution = resolveDropPosition({
			position: diagramNode.position,
			cellCount: GRID_CELL_COUNT,
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
				onZoomIn={handleZoomIn}
				onZoomOut={handleZoomOut}
				onZoomReset={handleZoomReset}
			/>
			<div
				className="relative mx-auto my-0"
				style={{
					width: renderedGridPixelSize,
					height: renderedGridPixelSize,
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

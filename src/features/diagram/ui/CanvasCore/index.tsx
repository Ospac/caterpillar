import {
	ConnectionMode,
	type CoordinateExtent,
	type NodeTypes,
	ReactFlow,
	ReactFlowProvider,
	type Viewport,
} from "@xyflow/react";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { CELL_SIZE, getGridOccupancy, getGridPixelSize } from "../../lib/grid";
import { useCanvasEdges } from "../../lib/hooks/useCanvasEdges";
import { useCanvasNodes } from "../../lib/hooks/useCanvasNodes";
import { useCanvasZoom } from "../../lib/hooks/useCanvasZoom";
import { useCanvasStore } from "../../model/canvasStore";
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
	const { mode, nodes, edges } = useCanvasStore(
		useShallow((state) => ({
			mode: state.mode,
			nodes: state.nodes,
			edges: state.edges,
		})),
	);
	const isEditMode = mode === "edit";
	const occupancy = useMemo(() => getGridOccupancy(nodes), [nodes]);
	const { isNodeDragging, nodeDockingState, onNodesChange, onNodeDragStop } =
		useCanvasNodes({ isEditMode, nodes, occupancy });
	const {
		isEdgeDragging,
		onConnect,
		onConnectEnd,
		onEdgesChange,
		onEdgeDoubleClick,
	} = useCanvasEdges({ isEditMode, nodes, occupancy });

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
	const shouldShowGridGuide = isNodeDragging || isEdgeDragging || isZooming;

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
					onEdgeDoubleClick={onEdgeDoubleClick}
					onNodeDragStop={onNodeDragStop}
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

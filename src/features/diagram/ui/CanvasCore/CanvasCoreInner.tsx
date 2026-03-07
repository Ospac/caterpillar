import {
	addEdge,
	type Connection,
	type CoordinateExtent,
	type Edge,
	MarkerType,
	type Node,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
	type Viewport,
} from "@xyflow/react";

import { type MouseEvent, useRef, useState } from "react";
import {
	clampPositionToStage,
	type DiagramNode,
	GRID_STAGES,
	type GridStage,
	getGridOccupancy,
	getNextStage,
	getStagePixelSize,
	isNodeOutsideStage,
	MAX_GRID_STAGE,
	NODE_SIZE,
} from "../../lib/grid";
import GridGuideOverlay from "./GridGuideOverlay";
import SquareNode from "./SquareNode";

const nodeTypes: NodeTypes = {
	square: SquareNode,
};

const INITIAL_STAGE = GRID_STAGES[0];
const LOCKED_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const initialEdges: Edge[] = [
	// {
	// 	id: "edge-1-2",
	// 	source: "node-1",
	// 	target: "node-2",
	// 	type: "smoothstep",
	// 	markerEnd: {
	// 		type: MarkerType.ArrowClosed,
	// 	},
	// },
];
const initialNodes: DiagramNode[] = [
	{
		id: "node-1",
		type: "square",
		position: clampPositionToStage({ x: 0, y: 0 }, INITIAL_STAGE),
		data: { label: "Node 1" },
	},
	{
		id: "node-2",
		type: "square",
		position: clampPositionToStage({ x: 96, y: 0 }, INITIAL_STAGE),
		data: { label: "Node 2" },
	},
];
export function CanvasCoreInner() {
	const [nodes, setNodes, onNodesChange] =
		useNodesState<DiagramNode>(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [visibleStage, setVisibleStage] = useState<GridStage>(INITIAL_STAGE);
	const [showGuide, setShowGuide] = useState(false);
	const nodeIdRef = useRef(initialNodes.length + 1);

	const stagePixelSize = getStagePixelSize(visibleStage);
	const maxStagePixelSize = getStagePixelSize(MAX_GRID_STAGE);
	const nodeExtent: CoordinateExtent = [
		[0, 0],
		[maxStagePixelSize, maxStagePixelSize],
	];

	const occupancy = getGridOccupancy(nodes);

	const onConnect = (connection: Connection) => {
		setEdges((currentEdges) =>
			addEdge(
				{
					...connection,
					type: "smoothstep",
					markerEnd: {
						type: MarkerType.ArrowClosed,
					},
				},
				currentEdges,
			),
		);
	};

	const handleEdgeDoubleClick = (_: MouseEvent, edge: Edge) => {
		setEdges((currentEdges) =>
			currentEdges.filter((currentEdge) => currentEdge.id !== edge.id),
		);
	};

	const handleNodeDragStart = () => {
		setShowGuide(true);
	};

	const handleNodeDrag = (_: MouseEvent, node: Node) => {
		setVisibleStage((currentStage) =>
			isNodeOutsideStage(node.position, currentStage)
				? getNextStage(currentStage)
				: currentStage,
		);
	};

	const handleNodeDragStop = (_: MouseEvent, node: Node) => {
		const clamped = clampPositionToStage(node.position, visibleStage);
		if (clamped.x !== node.position.x || clamped.y !== node.position.y) {
			setNodes((currentNodes) =>
				currentNodes.map((currentNode) =>
					currentNode.id === node.id
						? {
								...currentNode,
								position: clamped,
							}
						: currentNode,
				),
			);
		}
		setShowGuide(false);
	};

	const handleAddNode = () => {
		const id = `node-${nodeIdRef.current}`;
		nodeIdRef.current += 1;

		const nextNode: DiagramNode = {
			id,
			type: "square",
			position: clampPositionToStage(
				{
					x: stagePixelSize / 2 - NODE_SIZE / 2,
					y: stagePixelSize / 2 - NODE_SIZE / 2,
				},
				visibleStage,
			),
			data: {
				label: `Node ${nodeIdRef.current - 1}`,
			},
		};

		setNodes((currentNodes) => [...currentNodes, nextNode]);
	};

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
				{occupancy.occupiedCellCount} | Conflict: {occupancy.conflictCellCount}
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
					nodeExtent={nodeExtent}
					defaultViewport={LOCKED_VIEWPORT}
					snapToGrid
					snapGrid={[NODE_SIZE, NODE_SIZE]}
					autoPanOnNodeDrag={false}
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
				></ReactFlow>
			</div>
		</div>
	);
}

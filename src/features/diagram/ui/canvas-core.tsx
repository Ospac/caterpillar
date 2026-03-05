import {
	addEdge,
	Background,
	type Connection,
	type CoordinateExtent,
	type Edge,
	MarkerType,
	type Node,
	type NodeTypes,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	type Viewport,
} from "@xyflow/react";
import { type MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import {
	CELL_SIZE,
	clampPositionToStage,
	type DiagramNode,
	GRID_STAGES,
	type GridStage,
	getNextStage,
	getOccupiedCells,
	getStagePixelSize,
	isNodeOutsideStage,
	NODE_SIZE,
} from "../lib/grid";
import SquareNode from "./square-node";

const nodeTypes: NodeTypes = {
	square: SquareNode,
};

const INITIAL_STAGE = GRID_STAGES[0];
const LOCKED_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const _EDGE_TRIGGER_TOLERANCE = 2;
const EDGE_OVERDRAG_ALLOWANCE = 20;

const initialNodes: DiagramNode[] = [
	{
		id: "node-1",
		type: "square",
		position: clampPositionToStage({ x: 0, y: 0 }, INITIAL_STAGE),
		data: { label: "Node 1" },
	},
];

const initialEdges: Edge[] = [
	{
		id: "edge-1-2",
		source: "node-1",
		target: "node-2",
		type: "smoothstep",
		markerEnd: {
			type: MarkerType.ArrowClosed,
		},
	},
];

function GridGuideOverlay({ stage }: { stage: GridStage }) {
	const size = getStagePixelSize(stage);

	return (
		<div
			className="pointer-events-none absolute left-0 top-0 z-10 border border-blue-300/70"
			style={{
				width: size,
				height: size,
				backgroundImage:
					"linear-gradient(to right, rgba(59,130,246,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.22) 1px, transparent 1px)",
				backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
			}}
		/>
	);
}

function CanvasCoreInner() {
	const [nodes, setNodes, onNodesChange] =
		useNodesState<DiagramNode>(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [visibleStage, setVisibleStage] = useState<GridStage>(INITIAL_STAGE);
	const [showGuide, setShowGuide] = useState(false);
	const nodeIdRef = useRef(initialNodes.length + 1);
	const stagePixelSize = useMemo(
		() => getStagePixelSize(visibleStage),
		[visibleStage],
	);
	const nodeExtent: CoordinateExtent = [
		[0, 0],
		[
			stagePixelSize - NODE_SIZE + EDGE_OVERDRAG_ALLOWANCE,
			stagePixelSize - NODE_SIZE + EDGE_OVERDRAG_ALLOWANCE,
		],
	];

	const occupiedCells = useMemo(() => getOccupiedCells(nodes), [nodes]);

	const onConnect = useCallback(
		(connection: Connection) => {
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
		},
		[setEdges],
	);

	const handleEdgeDoubleClick = useCallback(
		(_: MouseEvent, edge: Edge) => {
			setEdges((currentEdges) =>
				currentEdges.filter((currentEdge) => currentEdge.id !== edge.id),
			);
		},
		[setEdges],
	);

	const handleNodeDragStart = useCallback(() => {
		setShowGuide(true);
	}, []);

	const handleNodeDrag = useCallback((_: MouseEvent, node: Node) => {
		setVisibleStage((currentStage) => {
			if (!isNodeOutsideStage(node.position, currentStage)) {
				return currentStage;
			}
			return getNextStage(currentStage);
		});
	}, []);

	const handleNodeDragStop = useCallback(
		(_: MouseEvent, node: Node) => {
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
		},
		[setNodes, visibleStage],
	);

	const handleAddNode = useCallback(() => {
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
	}, [setNodes, stagePixelSize, visibleStage]);

	return (
		<div className="h-full w-full overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
			<div
				className="relative border border-gray-300 bg-white"
				style={{ width: stagePixelSize, height: stagePixelSize }}
			>
				<div className="absolute left-3 top-3 z-20 flex gap-2">
					<button
						type="button"
						onClick={handleAddNode}
						className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-800"
					>
						Add Node
					</button>
				</div>

				<div className="absolute bottom-3 left-3 z-20 rounded border border-gray-300 bg-white/90 px-2 py-1 text-[11px] text-gray-700">
					Stage: {visibleStage}x{visibleStage} | Occupied: {occupiedCells.size}
				</div>

				{showGuide ? <GridGuideOverlay stage={visibleStage} /> : null}

				<ReactFlow
					nodes={nodes}
					edges={edges}
					autoPanOnNodeDrag={false}
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
					snapToGrid={true}
					panOnDrag={false}
					panOnScroll={false}
					zoomOnDoubleClick={false}
					zoomOnPinch={false}
					zoomOnScroll={false}
					deleteKeyCode={["Backspace", "Delete"]}
					proOptions={{ hideAttribution: true }}
				>
					<Background gap={100} />
				</ReactFlow>
			</div>
		</div>
	);
}

export default function CanvasCore() {
	return (
		<ReactFlowProvider>
			<CanvasCoreInner />
		</ReactFlowProvider>
	);
}

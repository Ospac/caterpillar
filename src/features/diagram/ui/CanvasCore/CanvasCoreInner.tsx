import {
	addEdge,
	type Connection,
	ConnectionMode,
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

import { type MouseEvent, useEffect, useRef, useState } from "react";
import {
	createDockedNodeState,
	resolveDropPosition,
	transitionDockedNodeState,
} from "../../lib/docking";
import {
	clampPositionToStage,
	getGridOccupancy,
	getNextStage,
	getStagePixelSize,
	isNodeCenterOutsideStage,
	MAX_GRID_STAGE,
	NODE_SIZE,
	syncNodeDockingState,
} from "../../lib/grid";
import type { DiagramNode, DockedNodeState, GridStage } from "../../lib/type";
import { createDefaultBlockData } from "../../model/block";
import {
	type CanvasRuntimeState,
	createInitialCanvasRuntimeState,
	type RuntimeNodeDockingState,
} from "../../model/runtime";
import GridGuideOverlay from "./GridGuideOverlay";
import MenuNode from "./MenuNode";

const LOCKED_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const nodeTypes: NodeTypes = {
	square: MenuNode,
};

export function CanvasCoreInner() {
	// 초기값을 마운트 시점에 한 번만 계산
	const [initialRuntimeState] = useState<CanvasRuntimeState>(() =>
		createInitialCanvasRuntimeState(),
	);
	const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(
		initialRuntimeState.nodes,
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		initialRuntimeState.edges,
	);
	const [visibleStage, setVisibleStage] = useState<GridStage>(
		initialRuntimeState.visibleStage,
	);

	const [nodeDockingState, setNodeDockingState] =
		useState<RuntimeNodeDockingState>(initialRuntimeState.nodeDockingState);
	const [showGuide, setShowGuide] = useState(false);
	const nodeIdRef = useRef(initialRuntimeState.nodes.length + 1);

	const stagePixelSize = getStagePixelSize(visibleStage);
	const maxStagePixelSize = getStagePixelSize(MAX_GRID_STAGE);
	const nodeExtent: CoordinateExtent = [
		[0, 0],
		[maxStagePixelSize, maxStagePixelSize],
	];

	const occupancy = getGridOccupancy(nodes, visibleStage);

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

	const updateNodeDockingState = (
		nodeId: string,
		position: { x: number; y: number },
		updater: (state: DockedNodeState) => DockedNodeState,
	) => {
		setNodeDockingState((currentState) => {
			const baseState =
				currentState[nodeId] ?? createDockedNodeState(position, visibleStage);

			return {
				...currentState,
				[nodeId]: updater(baseState),
			};
		});
	};

	const handleNodeDragStart = (_: MouseEvent, node: Node) => {
		setShowGuide(true);
		updateNodeDockingState(node.id, node.position, (state) =>
			transitionDockedNodeState(state, {
				type: "dragStart",
				position: node.position,
			}),
		);
	};

	const handleNodeDrag = (_: MouseEvent, node: Node) => {
		updateNodeDockingState(node.id, node.position, (state) =>
			transitionDockedNodeState(state, {
				type: "dragMove",
				position: node.position,
			}),
		);
		setVisibleStage((currentStage) =>
			isNodeCenterOutsideStage(node.position, currentStage)
				? getNextStage(currentStage)
				: currentStage,
		);
	};

	const handleNodeDragStop = (_: MouseEvent, node: Node) => {
		setVisibleStage((currentStage) => {
			const currentDockingState =
				nodeDockingState[node.id] ??
				createDockedNodeState(node.position, visibleStage);
			const resolution = resolveDropPosition({
				position: node.position,
				stage: currentStage,
				occupancy,
				ignoreNodeId: node.id,
				lastValidDock: currentDockingState.lastValidDock,
			});

			setNodes((currentNodes) =>
				currentNodes.map((currentNode) =>
					currentNode.id === node.id
						? { ...currentNode, position: resolution.position }
						: currentNode,
				),
			);

			updateNodeDockingState(node.id, resolution.position, (state) =>
				transitionDockedNodeState(state, {
					type: "dragStop",
					position: resolution.position,
					dockedCell: resolution.cell,
				}),
			);
			return currentStage; // No change to stage, just reading current value
		});
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
				...createDefaultBlockData("text", `Node ${nodeIdRef.current - 1}`),
			},
		};

		setNodes((currentNodes) => [...currentNodes, nextNode]);
	};

	useEffect(() => {
		// node를 add, delete 할때, nodeDockingState를 업데이트
		setNodeDockingState((currentState) =>
			syncNodeDockingState(currentState, nodes, visibleStage),
		);
	}, [nodes, visibleStage]);
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
					nodeExtent={nodeExtent}
					defaultViewport={LOCKED_VIEWPORT}
					snapToGrid={false}
					snapGrid={[NODE_SIZE, NODE_SIZE]}
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
				></ReactFlow>
			</div>
		</div>
	);
}

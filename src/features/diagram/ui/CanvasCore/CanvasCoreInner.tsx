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
	CELL_SIZE,
	clampPositionToStage,
	getGridOccupancy,
	getNextStage,
	getStagePixelSize,
	isNodeEscapingStage,
	MAX_GRID_STAGE,
	syncNodeDockingState,
} from "../../lib/grid";
import { getNodeSpan, WIDE_SPAN } from "../../lib/span";
import type { DockedNodeState, GridStage, NodeSpan } from "../../lib/type";
import {
	type CanvasRuntimeState,
	createInitialCanvasRuntimeState,
	type RuntimeNodeDockingState,
} from "../../model/runtime";
import type {
	BlockData,
	BlockNodeData,
	BlockType,
	DiagramNode,
} from "../../model/type";
import BlockNode from "./BlockNode";
import GridGuideOverlay from "./GridGuideOverlay";
import MenuNode from "./MenuNode";

const LOCKED_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const nodeTypes: NodeTypes = {
	menu: MenuNode,
	block: BlockNode,
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
		span: NodeSpan,
		updater: (state: DockedNodeState) => DockedNodeState,
	) => {
		setNodeDockingState((currentState) => {
			const baseState =
				currentState[nodeId] ??
				createDockedNodeState(position, visibleStage, span);

			return {
				...currentState,
				[nodeId]: updater(baseState),
			};
		});
	};

	const handleBlockDataChange = (nodeId: string, newData: BlockData) => {
		setNodes((curr) =>
			curr.map((n) => {
				if (n.id !== nodeId) return n;
				//TODO: 타입 단언 대신 타입 좁히기 적용
				const existing = n.data as BlockNodeData;
				return {
					...n,
					data: {
						...newData,
						onDataChange: existing.onDataChange,
					},
				};
			}),
		);
	};

	const handleNodeDragStart = (_: MouseEvent, node: Node) => {
		setShowGuide(true);
		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		updateNodeDockingState(
			diagramNode.id,
			diagramNode.position,
			span,
			(state) =>
				transitionDockedNodeState(state, {
					type: "dragStart",
					position: diagramNode.position,
				}),
		);
	};

	const handleNodeDrag = (_: MouseEvent, node: Node) => {
		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		updateNodeDockingState(
			diagramNode.id,
			diagramNode.position,
			span,
			(state) =>
				transitionDockedNodeState(state, {
					type: "dragMove",
					position: diagramNode.position,
				}),
		);
		setVisibleStage((currentStage) =>
			isNodeEscapingStage(diagramNode.position, currentStage, span)
				? getNextStage(currentStage)
				: currentStage,
		);
	};

	const handleNodeDragStop = (_: MouseEvent, node: Node) => {
		const diagramNode = node as DiagramNode;
		const span = getNodeSpan(diagramNode.data.blockType);
		const currentDockingState =
			nodeDockingState[diagramNode.id] ??
			createDockedNodeState(diagramNode.position, visibleStage, span);

		setVisibleStage((currentStage) => {
			const resolution = resolveDropPosition({
				position: diagramNode.position,
				stage: currentStage,
				occupancy,
				span,
				ignoreNodeId: diagramNode.id,
				lastValidDock: currentDockingState.lastValidDock,
			});
			setNodes((currentNodes) =>
				currentNodes.map((currentNode) =>
					currentNode.id === diagramNode.id
						? { ...currentNode, position: resolution.position }
						: currentNode,
				),
			);

			updateNodeDockingState(
				diagramNode.id,
				resolution.position,
				span,
				(state) =>
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

	const handleMenuTypeSelect = (menuNodeId: string, blockType: BlockType) => {
		const id = `node-${nodeIdRef.current}`;
		nodeIdRef.current += 1;

		setNodes((currentNodes) => {
			const menuNode = currentNodes.find((n) => n.id === menuNodeId);
			if (!menuNode) return currentNodes;

			const newNode: DiagramNode = {
				id,
				type: "block",
				position: menuNode.position,
				data: {
					blockType,
					title: "",
					secondary: "",
					onDataChange: (newData: BlockData) =>
						handleBlockDataChange(id, newData),
					initialEditing: true,
				} as BlockNodeData,
			};

			return [...currentNodes.filter((n) => n.id !== menuNodeId), newNode];
		});
	};

	const handleAddNode = () => {
		const id = `node-${nodeIdRef.current}`;
		nodeIdRef.current += 1;

		const nextNode: DiagramNode = {
			id,
			type: "menu",
			position: clampPositionToStage(
				{
					x: stagePixelSize / 2 - CELL_SIZE,
					y: stagePixelSize / 2 - CELL_SIZE,
				},
				visibleStage,
				WIDE_SPAN,
			),
			data: {
				blockType: "menu",
				onTypeSelect: (blockType) => handleMenuTypeSelect(id, blockType),
			},
		};

		setNodes((currentNodes) => [...currentNodes, nextNode]);
	};

	useEffect(() => {
		// TODO: node를 add, delete 할때, nodeDockingState를 업데이트하는 로직 -> 핸들러에 위치 시키기(you might not need an effect)
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
				></ReactFlow>
			</div>
		</div>
	);
}

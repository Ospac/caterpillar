import {
	type Edge,
	type EdgeMouseHandler,
	type OnConnect,
	type OnConnectEnd,
	type OnEdgesChange,
	useConnection,
	useReactFlow,
} from "@xyflow/react";
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCanvasStore } from "../../model/canvasStore";
import type { DiagramNode } from "../../model/nodeTypes";
import {
	getClientPosition,
	resolveEdgeDropConnectionHandles,
	resolveEdgeDropPosition,
} from "../edge";
import type { GridOccupancy } from "../geometry";
import { DEFAULT_GRID_DIMENSIONS } from "../grid";

interface UseCanvasEdgesInput {
	isEditMode: boolean;
	nodes: DiagramNode[];
	occupancy: GridOccupancy;
}

interface CanvasEdgeHandlers {
	isEdgeDragging: boolean;
	onConnect: OnConnect;
	onConnectEnd: OnConnectEnd;
	onEdgesChange: OnEdgesChange<Edge>;
	onEdgeDoubleClick: EdgeMouseHandler<Edge>;
}

export function useCanvasEdges({
	isEditMode,
	nodes,
	occupancy,
}: UseCanvasEdgesInput): CanvasEdgeHandlers {
	const { screenToFlowPosition } = useReactFlow();
	const { inProgress: isEdgeDragging } = useConnection<DiagramNode>();
	const { addMenuNode, connectEdge, removeEdge, applyEdgesChange } =
		useCanvasStore(
			useShallow((state) => ({
				addMenuNode: state.addMenuNode,
				connectEdge: state.connectEdge,
				removeEdge: state.removeEdge,
				applyEdgesChange: state.applyEdgesChange,
			})),
		);

	const onConnect = useCallback<OnConnect>(
		(connection) => {
			if (!isEditMode) return;
			connectEdge(connection);
		},
		[connectEdge, isEditMode],
	);

	const onConnectEnd = useCallback<OnConnectEnd>(
		(event, connectionState) => {
			if (!isEditMode || connectionState.isValid || !connectionState.fromNode) {
				return;
			}

			const clientPosition = getClientPosition(event);
			if (!clientPosition) return;

			const menuNodePosition = resolveEdgeDropPosition({
				position: screenToFlowPosition(clientPosition),
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
		},
		[
			addMenuNode,
			connectEdge,
			isEditMode,
			nodes,
			occupancy,
			screenToFlowPosition,
		],
	);

	const onEdgesChange = useCallback<OnEdgesChange<Edge>>(
		(changes) => {
			if (!isEditMode) return;
			applyEdgesChange(changes);
		},
		[applyEdgesChange, isEditMode],
	);

	const onEdgeDoubleClick = useCallback<EdgeMouseHandler<Edge>>(
		(_, edge) => {
			if (!isEditMode) return;
			removeEdge(edge.id);
		},
		[isEditMode, removeEdge],
	);

	return {
		isEdgeDragging,
		onConnect,
		onConnectEnd,
		onEdgesChange,
		onEdgeDoubleClick,
	};
}

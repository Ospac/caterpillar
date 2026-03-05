import type { Connection, Edge, EdgeMouseHandler } from "@xyflow/react";
import {
	addEdge,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import type { RefObject } from "react";
import { useCallback, useRef } from "react";

import {
	createTextNode,
	type DiagramEdge,
	type DiagramNode,
	getInitialNodeSequence,
	initialEdges,
	initialNodes,
} from "./index";

type UseDiagramGraphParams = {
	wrapperRef: RefObject<HTMLDivElement | null>;
};

export function useDiagramGraph({ wrapperRef }: UseDiagramGraphParams) {
	const [nodes, setNodes, onNodesChange] =
		useNodesState<DiagramNode>(initialNodes);
	const [edges, setEdges, onEdgesChange] =
		useEdgesState<DiagramEdge>(initialEdges);
	const reactFlow = useReactFlow<DiagramNode, DiagramEdge>();
	const nodeSequenceRef = useRef(getInitialNodeSequence(initialNodes));

	const onConnect = useCallback(
		(connection: Connection) => {
			setEdges((currentEdges) => addEdge(connection, currentEdges));
		},
		[setEdges],
	);

	const onEdgeDoubleClick = useCallback<EdgeMouseHandler<Edge>>(
		(event, edge) => {
			event.preventDefault();
			setEdges((currentEdges) =>
				currentEdges.filter((currentEdge) => currentEdge.id !== edge.id),
			);
		},
		[setEdges],
	);

	const addNodeAtCenter = useCallback(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) {
			return;
		}

		const bounds = wrapper.getBoundingClientRect();
		const centerPoint = {
			x: bounds.left + bounds.width / 2,
			y: bounds.top + bounds.height / 2,
		};
		const position = reactFlow.screenToFlowPosition(centerPoint);
		const nodeId = `node-${nodeSequenceRef.current}`;
		nodeSequenceRef.current += 1;

		setNodes((currentNodes) => [
			...currentNodes,
			createTextNode(nodeId, position),
		]);
	}, [reactFlow, setNodes, wrapperRef]);

	return {
		addNodeAtCenter,
		edges,
		nodes,
		onConnect,
		onEdgeDoubleClick,
		onEdgesChange,
		onNodesChange,
	};
}

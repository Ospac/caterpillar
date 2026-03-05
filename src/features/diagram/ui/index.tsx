import { Background, ReactFlow, type NodeTypes } from "@xyflow/react";
import { useMemo, useRef } from "react";

import { useDiagramGraph } from "../model/useDiagramGraph";
import { AddNodeButton } from "./components/AddNodeButton";
import { TextNode } from "./components/TextNode";
import { ZoomControls } from "./components/ZoomControls";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
	textNode: TextNode,
};

function DiagramCanvasInner() {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const {
		addNodeAtCenter,
		edges,
		nodes,
		onConnect,
		onEdgeDoubleClick,
		onEdgesChange,
		onNodesChange,
	} = useDiagramGraph({ wrapperRef });

	const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);

	return (
		<div ref={wrapperRef} className="h-full w-full">
			<div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
				<div className="pointer-events-auto">
					<AddNodeButton onClick={addNodeAtCenter} />
				</div>
				<div className="pointer-events-auto">
					<ZoomControls />
				</div>
			</div>

			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onEdgeDoubleClick={onEdgeDoubleClick}
				fitView
				fitViewOptions={fitViewOptions}
				deleteKeyCode="Delete"
				zoomOnDoubleClick={false}
				zoomOnPinch={false}
				zoomOnScroll={false}
				proOptions={{ hideAttribution: true }}
			>
				<Background gap={20} size={1} />
			</ReactFlow>
		</div>
	);
}

export function DiagramCanvas() {
	return (
		<div className="relative h-full w-full overflow-hidden rounded-md border border-slate-300 bg-slate-100">
			<DiagramCanvasInner />
		</div>
	);
}

import type { Edge } from "@xyflow/react";
import { GRID_STAGES } from "../lib/grid";
import type { DiagramNode, GridStage, XYPosition } from "../lib/type";
import { validateBlockData } from "./block";
import type { CanvasRuntimeState } from "./runtime";

export type NodeItem = {
	id: string;
	type: string;
	position: XYPosition;
	data: DiagramNode["data"];
};

export type EdgeItem = {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string | null;
	targetHandle?: string | null;
	type?: Edge["type"];
};

export type CanvasDocument = {
	visibleStage: GridStage;
	nodes: NodeItem[];
	edges: EdgeItem[];
};

export type ParsedCanvasDocument = Pick<
	CanvasRuntimeState,
	"nodes" | "edges" | "visibleStage"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isGridStage(value: unknown): value is GridStage {
	return typeof value === "number" && GRID_STAGES.includes(value as GridStage);
}

function isXYPosition(value: unknown): value is XYPosition {
	return (
		isRecord(value) &&
		typeof value.x === "number" &&
		typeof value.y === "number"
	);
}

// TODO: 각 검증 분기별로 null을 반환하는게 아니라, 에러 발생 및 처리 필요
function parseNodeItem(value: unknown): NodeItem | null {
	if (
		!isRecord(value) ||
		!isXYPosition(value.position) ||
		!isRecord(value.data)
	) {
		return null;
	}

	if (typeof value.id !== "string" || typeof value.type !== "string") {
		return null;
	}

	const validation = validateBlockData(value.data);
	if (validation.status === "invalid") {
		return null;
	}

	return {
		id: value.id,
		type: value.type,
		position: value.position,
		data: validation.data as DiagramNode["data"],
	};
}

function parseEdgeItem(value: unknown): EdgeItem | null {
	if (
		!isRecord(value) ||
		typeof value.id !== "string" ||
		typeof value.source !== "string" ||
		typeof value.target !== "string"
	) {
		return null;
	}

	return {
		id: value.id,
		source: value.source,
		target: value.target,
		sourceHandle:
			typeof value.sourceHandle === "string" || value.sourceHandle === null
				? value.sourceHandle
				: undefined,
		targetHandle:
			typeof value.targetHandle === "string" || value.targetHandle === null
				? value.targetHandle
				: undefined,
		type: typeof value.type === "string" ? value.type : undefined,
	};
}

export function serializeCanvasDocument(
	runtimeState: ParsedCanvasDocument,
): CanvasDocument {
	return {
		visibleStage: runtimeState.visibleStage,
		nodes: runtimeState.nodes.map((node) => ({
			id: node.id,
			type: node.type ?? "square",
			position: node.position,
			data: node.data,
		})),
		edges: runtimeState.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle,
			targetHandle: edge.targetHandle,
			type: edge.type,
		})),
	};
}

// TODO: 각 검증 분기별로 null을 반환하는게 아니라, 에러 발생 및 처리 필요
export function parseCanvasDocument(
	input: unknown,
): ParsedCanvasDocument | null {
	if (!isRecord(input) || !isGridStage(input.visibleStage)) {
		return null;
	}

	if (!Array.isArray(input.nodes) || !Array.isArray(input.edges)) {
		return null;
	}

	const nodes = input.nodes
		.map((node) => parseNodeItem(node))
		.filter((node): node is NodeItem => node !== null);
	const edges = input.edges
		.map((edge) => parseEdgeItem(edge))
		.filter((edge): edge is EdgeItem => edge !== null);

	if (
		nodes.length !== input.nodes.length ||
		edges.length !== input.edges.length
	) {
		return null;
	}

	return {
		visibleStage: input.visibleStage,
		nodes,
		edges,
	};
}

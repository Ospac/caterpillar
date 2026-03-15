import type { Edge, Viewport } from "@xyflow/react";
import type { DiagramNode, GridStage, XYPosition } from "../lib/type";
import { GRID_STAGES } from "../lib/grid";
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
	viewport: Viewport | null;
	nodes: NodeItem[];
	edges: EdgeItem[];
};

export type ParsedCanvasDocument = Pick<
	CanvasRuntimeState,
	"nodes" | "edges" | "visibleStage" | "viewport"
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

function parseViewport(value: unknown): Viewport | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (
		isRecord(value) &&
		typeof value.x === "number" &&
		typeof value.y === "number" &&
		typeof value.zoom === "number"
	) {
		return {
			x: value.x,
			y: value.y,
			zoom: value.zoom,
		};
	}

	return null;
}

function parseNodeItem(value: unknown): NodeItem | null {
	if (!isRecord(value) || !isXYPosition(value.position) || !isRecord(value.data)) {
		return null;
	}

	if (typeof value.id !== "string" || typeof value.type !== "string") {
		return null;
	}

	return {
		id: value.id,
		type: value.type,
		position: value.position,
		data: value.data as DiagramNode["data"],
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
		viewport: runtimeState.viewport,
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

export function parseCanvasDocument(input: unknown): ParsedCanvasDocument | null {
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

	if (nodes.length !== input.nodes.length || edges.length !== input.edges.length) {
		return null;
	}

	return {
		visibleStage: input.visibleStage,
		viewport: parseViewport(input.viewport),
		nodes,
		edges,
	};
}

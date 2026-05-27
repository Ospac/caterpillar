import type { Edge } from "@xyflow/react";
import { WIDE_SPAN } from "../lib/blockSpan";
import type { GridStage, XYPosition } from "../lib/geometry";
import { CELL_SIZE, clampPositionToStage, GRID_STAGES } from "../lib/grid";
import { validateBlockData } from "./block";
import type { BlockData, BlockType } from "./blockTypes";
import type { DiagramNode, DiagramNodeType } from "./nodeTypes";
import type { CanvasRuntimeState } from "./runtime";

const DIAGRAM_NODE_TYPES: ReadonlySet<string> = new Set<DiagramNodeType>([
	"menu",
	"block",
]);

function isDiagramNodeType(value: unknown): value is DiagramNodeType {
	return typeof value === "string" && DIAGRAM_NODE_TYPES.has(value);
}

export type NodeItem = {
	id: string;
	type: DiagramNodeType;
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
		Number.isFinite(value.x) &&
		typeof value.y === "number" &&
		Number.isFinite(value.y)
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

	if (typeof value.id !== "string" || !isDiagramNodeType(value.type)) {
		return null;
	}

	let data: DiagramNode["data"];

	if (value.type === "menu") {
		if (value.data.blockType !== "menu") {
			return null;
		}
		data = { blockType: "menu" };
	} else {
		const validation = validateBlockData(value.data);
		if (validation.status === "invalid") {
			return null;
		}
		data = validation.data as DiagramNode["data"];
	}

	return {
		id: value.id,
		type: value.type,
		position: value.position,
		data,
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

function serializeNodeData(node: DiagramNode): DiagramNode["data"] {
	if (node.type === "menu") {
		return { blockType: "menu" };
	}

	const validation = validateBlockData(node.data);
	if (validation.status === "invalid") {
		throw new Error(validation.reason);
	}

	return validation.data;
}

export function serializeCanvasDocument(
	runtimeState: ParsedCanvasDocument,
): CanvasDocument {
	return {
		visibleStage: runtimeState.visibleStage,
		nodes: runtimeState.nodes.map((node) => ({
			id: node.id,
			type: node.type ?? "menu",
			position: node.position,
			data: serializeNodeData(node),
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

interface MakeBlockNodeWhenMenuTypeSelectOptions {
	id: string;
	blockType: BlockType;
	menuNodePosition: XYPosition;
	onDataChange: (id: string, newData: BlockData) => void;
	onEditStateChange: (id: string, isEditing: boolean) => void;
}
export const makeBlockNodeWhenMenuTypeSelect = ({
	id,
	blockType,
	menuNodePosition,
	onDataChange,
	onEditStateChange,
}: MakeBlockNodeWhenMenuTypeSelectOptions): DiagramNode => {
	return {
		id,
		type: "block",
		position: menuNodePosition,
		data: {
			blockType,
			title: "",
			secondary: "",
			onDataChange: (newData: BlockData) => onDataChange(id, newData),
			onEditStateChange: (isEditing: boolean) =>
				onEditStateChange(id, isEditing),
			initialEditing: true,
		},
	};
};

interface AddNodeOptions {
	id: string;
	onTypeSelect: (id: string, blockType: BlockType) => void;
	position: XYPosition;
	visibleStage: GridStage;
}

export const addNode = ({
	id,
	onTypeSelect,
	position,
	visibleStage,
}: AddNodeOptions): DiagramNode => {
	return {
		id,
		type: "menu",
		position: clampPositionToStage(position, visibleStage, WIDE_SPAN),
		data: {
			blockType: "menu",
			onTypeSelect: (blockType) => onTypeSelect(id, blockType),
		},
	};
};

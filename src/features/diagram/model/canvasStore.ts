import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type Edge,
	type EdgeChange,
	MarkerType,
	type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { GridStage, XYPosition } from "../lib/geometry";
import { GRID_STAGES } from "../lib/grid";
import type { BlockData, BlockType } from "./blockTypes";
import {
	addNode,
	type CanvasDocument,
	makeBlockNodeWhenMenuTypeSelect,
	type ParsedCanvasDocument,
	serializeCanvasDocument,
} from "./document";
import type { DiagramNode } from "./nodeTypes";
import { isBlockNode } from "./nodeTypes";

export type CanvasMode = "read" | "edit";
export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

type CanvasStoreState = {
	mode: CanvasMode;
	nodes: DiagramNode[];
	edges: Edge[];
	visibleStage: GridStage;
	dirty: boolean;
	lastSavedAt: string | null;
	saveStatus: CanvasSaveStatus;
	nextNodeIndex: number;
};

type CanvasStoreActions = {
	setMode: (mode: CanvasMode) => void;
	setVisibleStage: (stage: GridStage) => void;
	addMenuNode: (position: XYPosition) => string | null;
	selectMenuType: (menuNodeId: string, blockType: BlockType) => void;
	updateBlockData: (nodeId: string, data: BlockData) => void;
	connectEdge: (connection: Connection) => void;
	removeEdge: (edgeId: string) => void;
	applyNodesChange: (changes: NodeChange<DiagramNode>[]) => void;
	applyEdgesChange: (changes: EdgeChange<Edge>[]) => void;
	commitNodePosition: (nodeId: string, position: XYPosition) => void;
	serializeDocument: () => CanvasDocument;
	loadDocument: (document: ParsedCanvasDocument) => void;
	markSaving: () => void;
	markSaved: (savedAt: string) => void;
	markSaveError: () => void;
};

export type CanvasStore = CanvasStoreState & CanvasStoreActions;

const INITIAL_STAGE = GRID_STAGES[0];

function isEditMode({ mode }: CanvasStoreState): boolean {
	return mode === "edit";
}

function getNextNodeId(state: CanvasStoreState): string {
	return `node-${state.nextNodeIndex}`;
}

function getNextNodeIndex(nodes: DiagramNode[]): number {
	return nodes.reduce((maxIndex, node) => {
		const match = /^node-(\d+)$/.exec(node.id);
		if (!match) return maxIndex;
		return Math.max(maxIndex, Number(match[1]) + 1);
	}, 1);
}

function hasPersistentNodeChange(changes: NodeChange<DiagramNode>[]): boolean {
	return changes.some(
		(change) =>
			change.type === "add" ||
			change.type === "remove" ||
			change.type === "replace" ||
			change.type === "position",
	);
}

function hasPersistentEdgeChange(changes: EdgeChange<Edge>[]): boolean {
	return changes.some((change) => change.type !== "select");
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
	mode: "read",
	nodes: [],
	edges: [],
	visibleStage: INITIAL_STAGE,
	dirty: false,
	lastSavedAt: null,
	saveStatus: "idle",
	nextNodeIndex: 1,
	setMode: (mode) => set({ mode }),
	setVisibleStage: (stage) =>
		set((state) =>
			state.visibleStage === stage
				? state
				: { visibleStage: stage, dirty: true, saveStatus: "idle" },
		),
	addMenuNode: (position) => {
		const currentState = get();
		if (!isEditMode(currentState)) return null;

		const id = getNextNodeId(currentState);
		set((state) => {
			if (!isEditMode(state)) return state;
			return {
				nodes: [
					...state.nodes,
					addNode({
						id,
						position,
						visibleStage: state.visibleStage,
					}),
				],
				nextNodeIndex: state.nextNodeIndex + 1,
				dirty: true,
				saveStatus: "idle",
			};
		});

		return id;
	},
	selectMenuType: (menuNodeId, blockType) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			const menuNode = state.nodes.find((node) => node.id === menuNodeId);
			if (!menuNode) return state;

			const id = getNextNodeId(state);
			return {
				nodes: [
					...state.nodes.filter((node) => node.id !== menuNodeId),
					makeBlockNodeWhenMenuTypeSelect({
						id,
						blockType,
						menuNodePosition: menuNode.position,
					}),
				],
				nextNodeIndex: state.nextNodeIndex + 1,
				dirty: true,
				saveStatus: "idle",
			};
		}),
	updateBlockData: (nodeId, data) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			return {
				nodes: state.nodes.map((node) => {
					if (node.id !== nodeId || !isBlockNode(node)) return node;
					return {
						...node,
						data: {
							...data,
							initialEditing: node.data.initialEditing,
						},
					};
				}),
				dirty: true,
				saveStatus: "idle",
			};
		}),
	connectEdge: (connection) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			return {
				edges: addEdge(
					{
						...connection,
						type: "smoothstep",
						markerEnd: {
							type: MarkerType.ArrowClosed,
						},
					},
					state.edges,
				),
				dirty: true,
				saveStatus: "idle",
			};
		}),
	removeEdge: (edgeId) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			return {
				edges: state.edges.filter((edge) => edge.id !== edgeId),
				dirty: true,
				saveStatus: "idle",
			};
		}),
	applyNodesChange: (changes) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			const dirty = state.dirty || hasPersistentNodeChange(changes);
			return {
				nodes: applyNodeChanges(changes, state.nodes),
				dirty,
				saveStatus: dirty ? "idle" : state.saveStatus,
			};
		}),
	applyEdgesChange: (changes) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			const dirty = state.dirty || hasPersistentEdgeChange(changes);
			return {
				edges: applyEdgeChanges(changes, state.edges),
				dirty,
				saveStatus: dirty ? "idle" : state.saveStatus,
			};
		}),
	commitNodePosition: (nodeId, position) =>
		set((state) => {
			if (!isEditMode(state)) return state;
			return {
				nodes: state.nodes.map((node) =>
					node.id === nodeId ? { ...node, position } : node,
				),
				dirty: true,
				saveStatus: "idle",
			};
		}),
	serializeDocument: () =>
		serializeCanvasDocument({
			visibleStage: get().visibleStage,
			nodes: get().nodes,
			edges: get().edges,
		}),
	loadDocument: (document) =>
		set({
			nodes: document.nodes,
			edges: document.edges,
			visibleStage: document.visibleStage,
			nextNodeIndex: getNextNodeIndex(document.nodes),
			dirty: false,
			saveStatus: "idle",
		}),
	markSaving: () => set({ saveStatus: "saving" }),
	markSaved: (savedAt) =>
		set({ dirty: false, lastSavedAt: savedAt, saveStatus: "saved" }),
	markSaveError: () => set({ saveStatus: "error" }),
}));

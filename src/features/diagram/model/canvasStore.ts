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
import { createJSONStorage, persist } from "zustand/middleware";
import type { XYPosition } from "../lib/geometry";
import type { BlockData, BlockType } from "./blockTypes";

import {
	addNode,
	type CanvasDocument,
	makeBlockNodeWhenMenuTypeSelect,
	type ParsedCanvasDocument,
	parseCanvasDocument,
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
	dirty: boolean;
	lastSavedAt: string | null;
	saveStatus: CanvasSaveStatus;
	nextNodeIndex: number;
};

type CanvasStoreActions = {
	setMode: (mode: CanvasMode) => void;
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

export const useCanvasStore = create<CanvasStore>()(
	persist(
		(set, get) => ({
			mode: "edit",
			nodes: [],
			edges: [],
			dirty: false,
			lastSavedAt: null,
			saveStatus: "idle",
			nextNodeIndex: 1,
			setMode: (mode) => set({ mode }),
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

					return {
						nodes: [
							...state.nodes.filter((node) => node.id !== menuNodeId),
							makeBlockNodeWhenMenuTypeSelect({
								id: menuNodeId,
								blockType,
								menuNodePosition: menuNode.position,
							}),
						],
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
					nodes: get().nodes,
					edges: get().edges,
				}),
			loadDocument: (document) =>
				set({
					nodes: document.nodes,
					edges: document.edges,
					nextNodeIndex: getNextNodeIndex(document.nodes),
					dirty: false,
					saveStatus: "idle",
				}),
			markSaving: () => set({ saveStatus: "saving" }),
			markSaved: (savedAt) =>
				set({ dirty: false, lastSavedAt: savedAt, saveStatus: "saved" }),
			markSaveError: () => set({ saveStatus: "error" }),
		}),
		{
			partialize: (state) => ({
				nodes: serializeCanvasDocument(state).nodes,
				edges: serializeCanvasDocument(state).edges,
			}),
			merge: (persistedState, currentState) => {
				const document = parseCanvasDocument(persistedState);

				if (!document) {
					return currentState;
				}

				return {
					...currentState,
					nodes: document.nodes,
					edges: document.edges,
					nextNodeIndex: getNextNodeIndex(document.nodes),
				};
			},
			version: 0,
			name: "canvas-store",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

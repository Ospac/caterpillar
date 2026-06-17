import { beforeEach, describe, expect, it } from "@rstest/core";
import type { Connection } from "@xyflow/react";
import { CELL_SIZE, GRID_COLUMN_COUNT, GRID_ROW_COUNT } from "../../lib/grid";
import { useCanvasStore } from "../canvasStore";
import { isBlockNode } from "../nodeTypes";

describe("canvasStore", () => {
	beforeEach(() => {
		const store = useCanvasStore.getState();
		store.loadDocument({ nodes: [], edges: [] });
		store.setMode("read");
	});

	it("read mode에서는 문서 변경 명령을 무시한다", () => {
		const store = useCanvasStore.getState();

		const nodeId = store.addMenuNode({ x: 0, y: 0 });

		expect(nodeId).toBeNull();
		expect(useCanvasStore.getState().nodes).toEqual([]);
		expect(useCanvasStore.getState().dirty).toBe(false);
	});

	it("edit mode에서 메뉴 노드를 추가하고 타입 선택으로 블록 노드로 교체한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");
		const nodeId = store.addMenuNode({ x: 0, y: 0 });

		expect(nodeId).toBe("node-1");
		const menuNode = useCanvasStore.getState().nodes[0];
		expect(menuNode).toMatchObject({
			id: "node-1",
			type: "menu",
			data: { blockType: "menu" },
		});

		if (!menuNode) {
			throw new Error("Expected a menu node");
		}
		useCanvasStore.getState().selectMenuType(menuNode.id, "text");

		const blockNode = useCanvasStore.getState().nodes[0];
		expect(blockNode && isBlockNode(blockNode)).toBe(true);
		expect(blockNode).toMatchObject({
			id: "node-1",
			type: "block",
			position: { x: 0, y: 0 },
			data: {
				blockType: "text",
				initialEditing: true,
			},
		});
		expect(useCanvasStore.getState().dirty).toBe(true);
	});

	it("메뉴 노드를 블록 노드로 교체해도 연결된 엣지와 다음 노드 ID를 유지한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");
		const sourceNodeId = store.addMenuNode({ x: 0, y: 0 });
		const menuNodeId = store.addMenuNode({ x: 2 * CELL_SIZE, y: 0 });
		if (!sourceNodeId || !menuNodeId) {
			throw new Error("Expected menu nodes");
		}

		useCanvasStore.getState().connectEdge({
			source: sourceNodeId,
			target: menuNodeId,
			sourceHandle: "right",
			targetHandle: "left",
		} satisfies Connection);
		const edge = useCanvasStore.getState().edges[0];
		if (!edge) {
			throw new Error("Expected an edge");
		}

		useCanvasStore.getState().selectMenuType(menuNodeId, "text");

		expect(useCanvasStore.getState().edges).toEqual([edge]);
		expect(useCanvasStore.getState().nodes).toContainEqual(
			expect.objectContaining({
				id: menuNodeId,
				type: "block",
			}),
		);
		expect(
			useCanvasStore.getState().addMenuNode({ x: 4 * CELL_SIZE, y: 0 }),
		).toBe("node-3");
	});

	it("블록 데이터와 엣지를 갱신하고 문서 shape로 직렬화한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");
		store.addMenuNode({ x: 0, y: 0 });
		const menuNode = useCanvasStore.getState().nodes[0];
		if (!menuNode) {
			throw new Error("Expected a menu node");
		}
		useCanvasStore.getState().selectMenuType(menuNode.id, "text");
		const blockNode = useCanvasStore.getState().nodes[0];
		if (!blockNode) {
			throw new Error("Expected a block node");
		}

		useCanvasStore
			.getState()
			.updateBlockData(blockNode.id, { blockType: "text", text: "Updated" });
		useCanvasStore.getState().connectEdge({
			source: blockNode.id,
			target: "target-1",
			sourceHandle: null,
			targetHandle: null,
		} satisfies Connection);
		const edge = useCanvasStore.getState().edges[0];
		if (!edge) {
			throw new Error("Expected an edge");
		}

		expect(useCanvasStore.getState().serializeDocument()).toEqual({
			nodes: [
				{
					id: "node-1",
					type: "block",
					position: { x: 0, y: 0 },
					data: { blockType: "text", text: "Updated" },
				},
			],
			edges: [
				{
					id: edge.id,
					source: "node-1",
					target: "target-1",
					sourceHandle: undefined,
					targetHandle: undefined,
					type: "smoothstep",
				},
			],
		});
	});

	it("메뉴 노드 추가 위치는 30x15 canvas 경계 안으로 제한한다", () => {
		const store = useCanvasStore.getState();
		store.setMode("edit");

		useCanvasStore.getState().addMenuNode({
			x: GRID_COLUMN_COUNT * CELL_SIZE,
			y: GRID_ROW_COUNT * CELL_SIZE,
		});

		expect(useCanvasStore.getState().nodes[0]).toMatchObject({
			position: {
				x: (GRID_COLUMN_COUNT - 2) * CELL_SIZE,
				y: (GRID_ROW_COUNT - 2) * CELL_SIZE,
			},
		});
	});
});

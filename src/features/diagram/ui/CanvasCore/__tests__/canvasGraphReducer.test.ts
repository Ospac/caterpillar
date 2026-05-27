import { describe, expect, it } from "@rstest/core";

import type { BlockData } from "../../../model/blockTypes";
import type { DiagramNode } from "../../../model/nodeTypes";
import { isBlockNode } from "../../../model/nodeTypes";
import { canvasGraphReducer, type CanvasGraphState } from "../canvasGraphReducer";

describe("canvasGraphReducer", () => {
	const menuNode: DiagramNode = {
		id: "menu-1",
		type: "menu",
		position: { x: 216, y: 324 },
		data: {
			blockType: "menu",
			onTypeSelect: () => {},
		},
	};

	const state: CanvasGraphState = {
		nodes: [menuNode],
		edges: [],
	};

	it("현재 state의 menu node를 선택한 block node로 교체한다", () => {
		const nextState = canvasGraphReducer(state, {
			type: "menuTypeSelected",
			menuNodeId: "menu-1",
			blockNodeId: "block-1",
			blockType: "text",
			onDataChange: () => {},
			onEditStateChange: () => {},
		});

		expect(nextState.nodes).toHaveLength(1);
		expect(nextState.nodes[0]).toMatchObject({
			id: "block-1",
			type: "block",
			position: menuNode.position,
			data: {
				blockType: "text",
				initialEditing: true,
			},
		});
		const blockNode = nextState.nodes[0];
		expect(blockNode && isBlockNode(blockNode)).toBe(true);
		if (!blockNode || !isBlockNode(blockNode)) {
			throw new Error("Expected menu node to be replaced with a block node");
		}
		expect(blockNode.data.onDataChange).toEqual(expect.any(Function));
		expect(blockNode.data.onEditStateChange).toEqual(expect.any(Function));
	});

	it("menu node가 없으면 state를 변경하지 않는다", () => {
		const onDataChange = (_id: string, _data: BlockData) => {};
		const onEditStateChange = (_id: string, _isEditing: boolean) => {};

		const nextState = canvasGraphReducer(state, {
			type: "menuTypeSelected",
			menuNodeId: "missing",
			blockNodeId: "block-1",
			blockType: "text",
			onDataChange,
			onEditStateChange,
		});

		expect(nextState).toBe(state);
	});
});

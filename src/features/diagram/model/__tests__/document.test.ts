import { describe, expect, it } from "@rstest/core";
import { CELL_SIZE } from "../../lib/grid";
import {
	type CanvasDocument,
	type ParsedCanvasDocument,
	parseCanvasDocument,
	serializeCanvasDocument,
} from "../document";

describe("document(model)", () => {
	const documentFixture: CanvasDocument = {
		nodes: [
			{
				id: "node-1",
				type: "block",
				position: { x: 0, y: 0 },
				data: { blockType: "text", title: "Node 1", secondary: "" },
			},
		],
		edges: [
			{
				id: "edge-1",
				source: "node-1",
				target: "node-2",
				type: "smoothstep",
			},
		],
	};

	it("현재 document shape를 파싱한다", () => {
		expect(parseCanvasDocument(documentFixture)).toEqual(documentFixture);
	});

	it("필수 필드가 없으면 null을 반환한다", () => {
		expect(
			parseCanvasDocument({
				nodes: [{ id: "node-1" }],
				edges: [],
			}),
		).toBeNull();
	});

	it("블록 데이터는 validation 결과를 반영해 보정한다", () => {
		expect(
			parseCanvasDocument({
				nodes: [
					{
						id: "node-1",
						type: "block",
						position: { x: 0, y: 0 },
						data: { blockType: "link", title: "", secondary: "" },
					},
				],
				edges: [],
			}),
		).toEqual({
			nodes: [
				{
					id: "node-1",
					type: "block",
					position: { x: 0, y: 0 },
					data: {
						blockType: "link",
						title: "link",
						secondary: "",
					},
				},
			],
			edges: [],
		});
	});

	it("node position에 NaN 또는 Infinity가 있으면 null을 반환한다", () => {
		expect(
			parseCanvasDocument({
				nodes: [
					{
						id: "node-1",
						type: "block",
						position: { x: Number.NaN, y: 0 },
						data: { blockType: "text", title: "Node 1", secondary: "" },
					},
				],
				edges: [],
			}),
		).toBeNull();

		expect(
			parseCanvasDocument({
				nodes: [
					{
						id: "node-1",
						type: "block",
						position: { x: 0, y: Number.POSITIVE_INFINITY },
						data: { blockType: "text", title: "Node 1", secondary: "" },
					},
				],
				edges: [],
			}),
		).toBeNull();
	});

	it("런타임 상태를 document shape로 직렬화한다", () => {
		const parsed = parseCanvasDocument(documentFixture);
		expect(parsed).not.toBeNull();

		expect(serializeCanvasDocument(parsed as ParsedCanvasDocument)).toEqual(
			documentFixture,
		);
	});

	it("직렬화할 때 런타임 콜백은 저장하지 않는다", () => {
		expect(
			serializeCanvasDocument({
				nodes: [
					{
						id: "node-1",
						type: "block",
						position: { x: 0, y: 0 },
						data: {
							blockType: "text",
							title: "Node 1",
							secondary: "",
							initialEditing: true,
						},
					},
					{
						id: "node-2",
						type: "menu",
						position: { x: CELL_SIZE, y: CELL_SIZE },
						data: {
							blockType: "menu",
						},
					},
				],
				edges: [],
			}),
		).toEqual({
			nodes: [
				{
					id: "node-1",
					type: "block",
					position: { x: 0, y: 0 },
					data: { blockType: "text", title: "Node 1", secondary: "" },
				},
				{
					id: "node-2",
					type: "menu",
					position: { x: CELL_SIZE, y: CELL_SIZE },
					data: { blockType: "menu" },
				},
			],
			edges: [],
		});
	});
});

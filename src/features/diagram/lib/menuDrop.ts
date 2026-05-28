import { getNodeSpan } from "./blockSpan";
import { resolveDropPosition } from "./docking";
import type { GridOccupancy, GridStage, XYPosition } from "./geometry";

type ResolveMenuNodeDropPositionInput = {
	position: XYPosition;
	stage: GridStage;
	occupancy: GridOccupancy;
};

export function resolveMenuNodeDropPosition({
	position,
	stage,
	occupancy,
}: ResolveMenuNodeDropPositionInput): XYPosition | null {
	const resolution = resolveDropPosition({
		position,
		stage,
		occupancy,
		span: getNodeSpan("menu"),
		lastValidDock: null,
	});

	return resolution.cell ? resolution.position : null;
}

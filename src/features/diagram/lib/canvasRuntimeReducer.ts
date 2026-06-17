import type { DiagramNode } from "../model/nodeTypes";
import type { CanvasRuntimeState } from "../model/runtime";
import { commitDockedNodeState, createDockedNodeState } from "./docking";
import type { CellCoord, NodeSpan, XYPosition } from "./geometry";
import { GRID_CELL_COUNT, syncNodeDockingState } from "./grid";

export type CanvasReducerState = Pick<CanvasRuntimeState, "nodeDockingState">;

export type CanvasReducerAction =
	| {
			type: "nodeDropCommitted";
			nodeId: string;
			position: XYPosition;
			span: NodeSpan;
			dockedCell: CellCoord | null;
	  }
	| {
			type: "nodesSynced";
			nodes: DiagramNode[];
	  };

export function createCanvasReducerState(
	initialRuntimeState: CanvasRuntimeState,
): CanvasReducerState {
	return {
		nodeDockingState: initialRuntimeState.nodeDockingState,
	};
}

export function canvasRuntimeReducer(
	state: CanvasReducerState,
	action: CanvasReducerAction,
): CanvasReducerState {
	switch (action.type) {
		case "nodeDropCommitted": {
			const currentDockingState =
				state.nodeDockingState[action.nodeId] ??
				createDockedNodeState(action.position, action.span, GRID_CELL_COUNT);

			return {
				...state,
				nodeDockingState: {
					...state.nodeDockingState,
					[action.nodeId]: commitDockedNodeState(
						currentDockingState,
						action.dockedCell,
					),
				},
			};
		}
		case "nodesSynced": {
			const nodeDockingState = syncNodeDockingState(
				state.nodeDockingState,
				action.nodes,
				GRID_CELL_COUNT,
			);

			return nodeDockingState === state.nodeDockingState
				? state
				: { ...state, nodeDockingState };
		}
	}
}

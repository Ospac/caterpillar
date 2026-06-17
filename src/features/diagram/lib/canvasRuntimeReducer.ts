import type { DiagramNode } from "../model/nodeTypes";
import type { CanvasRuntimeState } from "../model/runtime";
import { commitDockedNodeState, createDockedNodeState } from "./docking";
import type { CellCoord, NodeSpan, XYPosition } from "./geometry";
import { DEFAULT_GRID_DIMENSIONS, syncNodeDockingState } from "./grid";

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
				createDockedNodeState(
					action.position,
					action.span,
					DEFAULT_GRID_DIMENSIONS,
				);

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
				DEFAULT_GRID_DIMENSIONS,
			);

			return nodeDockingState === state.nodeDockingState
				? state
				: { ...state, nodeDockingState };
		}
	}
}

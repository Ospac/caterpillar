import type { DiagramNode } from "../model/nodeTypes";
import type { CanvasRuntimeState } from "../model/runtime";
import { commitDockedNodeState, createDockedNodeState } from "./docking";
import type { CellCoord, GridStage, NodeSpan, XYPosition } from "./geometry";
import { syncNodeDockingState } from "./grid";

export type CanvasReducerState = Pick<
	CanvasRuntimeState,
	"nodeDockingState"
> & {
	showGuide: boolean;
};

export type CanvasReducerAction =
	| { type: "dragStarted" }
	| { type: "dragEnded" }
	| {
			type: "nodeDropCommitted";
			nodeId: string;
			position: XYPosition;
			span: NodeSpan;
			visibleStage: GridStage;
			dockedCell: CellCoord | null;
	  }
	| {
			type: "nodesSynced";
			nodes: DiagramNode[];
			visibleStage: GridStage;
	  };

export function createCanvasReducerState(
	initialRuntimeState: CanvasRuntimeState,
): CanvasReducerState {
	return {
		nodeDockingState: initialRuntimeState.nodeDockingState,
		showGuide: false,
	};
}

export function canvasRuntimeReducer(
	state: CanvasReducerState,
	action: CanvasReducerAction,
): CanvasReducerState {
	switch (action.type) {
		case "dragStarted":
			return state.showGuide ? state : { ...state, showGuide: true };
		case "dragEnded":
			return !state.showGuide ? state : { ...state, showGuide: false };
		case "nodeDropCommitted": {
			const currentDockingState =
				state.nodeDockingState[action.nodeId] ??
				createDockedNodeState(
					action.position,
					action.visibleStage,
					action.span,
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
				showGuide: false,
			};
		}
		case "nodesSynced": {
			const nodeDockingState = syncNodeDockingState(
				state.nodeDockingState,
				action.nodes,
				action.visibleStage,
			);

			return nodeDockingState === state.nodeDockingState
				? state
				: { ...state, nodeDockingState };
		}
	}
}

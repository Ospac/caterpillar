import {
	commitDockedNodeState,
	createDockedNodeState,
} from "../../lib/docking";
import type { CellCoord, NodeSpan, XYPosition } from "../../lib/geometry";
import {
	getNextStage,
	isNodeEscapingStage,
	syncNodeDockingState,
} from "../../lib/grid";
import type { DiagramNode } from "../../model/nodeTypes";
import type { CanvasRuntimeState } from "../../model/runtime";

export type CanvasReducerState = Pick<
	CanvasRuntimeState,
	"visibleStage" | "nodeDockingState"
> & {
	showGuide: boolean;
};

export type CanvasReducerAction =
	| { type: "dragStarted" }
	| {
			type: "nodeDragged";
			position: XYPosition;
			span: NodeSpan;
	  }
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
		visibleStage: initialRuntimeState.visibleStage,
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
		case "nodeDragged": {
			const nextStage = isNodeEscapingStage(
				action.position,
				state.visibleStage,
				action.span,
			)
				? getNextStage(state.visibleStage)
				: state.visibleStage;

			return nextStage === state.visibleStage
				? state
				: { ...state, visibleStage: nextStage };
		}
		case "nodeDropCommitted": {
			const currentDockingState =
				state.nodeDockingState[action.nodeId] ??
				createDockedNodeState(action.position, state.visibleStage, action.span);

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
				state.visibleStage,
			);

			return nodeDockingState === state.nodeDockingState
				? state
				: { ...state, nodeDockingState };
		}
	}
}

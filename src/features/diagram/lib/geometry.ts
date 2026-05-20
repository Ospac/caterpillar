import type { DROP_REASONS, FALLBACK_STRATEGIES } from "./docking";
import type { GRID_STAGES } from "./grid";

// Node 자유 이동은 XYPosition을 사용하고, drop시 grid snap을 위해 CellCoord 좌표계를 사용한다.
export type CellCoord = {
  col: number;
  row: number;
};

export type NodeSpan = {
  cols: number;
  rows: number;
};
export type XYPosition = {
  x: number;
  y: number;
};

export type DockedNodeState = {
  dockedCell: CellCoord | null;
  lastValidDock: CellCoord | null;
};

export type GridStage = (typeof GRID_STAGES)[number];

export type GridOccupancy = {
  occupiedCellCount: number;
  cellToNodeId: Map<string, string>;
  conflictedCellKeys: Set<string>;
};

export type FallbackStrategy =
  (typeof FALLBACK_STRATEGIES)[keyof typeof FALLBACK_STRATEGIES];

export type FallbackResult = {
  position: XYPosition;
  strategy: FallbackStrategy;
  cell: CellCoord | null;
};

export type FallbackResolution = FallbackResult | null;

export type DockingInput = {
  position: XYPosition;
  stage: GridStage;
  occupancy: GridOccupancy;
  span: NodeSpan;
  ignoreNodeId?: string;
  lastValidDock: CellCoord | null;
};

export type DropReason = (typeof DROP_REASONS)[keyof typeof DROP_REASONS];

export type DropResolutionBase = {
  reason: DropReason;
  usedFallback: boolean;
};
export type ResolveDropResult = DropResolutionBase & {
  position: XYPosition;
  cell: CellCoord | null;
  strategy?: FallbackStrategy;
};
export type FallbackInput = DockingInput & {
  reason: DropReason;
};

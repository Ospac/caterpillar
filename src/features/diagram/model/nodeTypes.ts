import type { Node } from "@xyflow/react";
import type { BlockData, BlockType } from "./blockTypes";

export type MenuNodeData = {
  blockType: "menu";
  onTypeSelect?: (blockType: BlockType) => void;
};

export type BlockNodeData = BlockData & {
  onDataChange?: (newData: BlockData) => void;
  initialEditing?: boolean;
};

export type DiagramNodeData = BlockNodeData | MenuNodeData;

export type DiagramNodeType = "menu" | "block";

export type DiagramNode = Node<DiagramNodeData, DiagramNodeType>;

export function isBlockNode(node: DiagramNode): node is DiagramNode & {
  type: "block";
  data: BlockNodeData;
} {
  return node.type === "block" && node.data.blockType !== "menu";
}

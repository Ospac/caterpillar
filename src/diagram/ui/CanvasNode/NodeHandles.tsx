import { Handle, Position } from "@xyflow/react";
import { Fragment } from "react";

export function NodeHandles() {
	return (
		<Fragment>
			<Handle type="source" position={Position.Top} id="top" />
			<Handle type="source" position={Position.Bottom} id="bottom" />
			<Handle type="source" position={Position.Left} id="left" />
			<Handle type="source" position={Position.Right} id="right" />
		</Fragment>
	);
}

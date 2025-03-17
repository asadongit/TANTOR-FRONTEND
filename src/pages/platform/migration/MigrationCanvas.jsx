import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import { SourceNode } from "./nodes/SourceNode";
import { TargetNode } from "./nodes/TargetNode";
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import { useTableContext } from "../react-flow/context/TableContext";
import TableDrawer from "../react-flow/dialog/TableDrawer";
import { MigrationSidebar } from "./MigrationSidebar";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const MigrationCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { openDrawer } = useTableContext();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = {
        x: event.clientX - 500,
        y: event.clientY - 80,
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: type, tables: [] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    };
  }, [onNodeDelete]);

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls className="fill-white stroke-black" />
        <Panel position="top-left">
          <MigrationSidebar />
        </Panel>
      </ReactFlow>
      <DrawerContainer />
      <TableDrawer nodes={nodes} setNodes={setNodes} />
    </div>
  );
};
export default MigrationCanvas;

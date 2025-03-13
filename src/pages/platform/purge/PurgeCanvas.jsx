import { useCallback, useEffect } from "react";
import ReactFlow, { addEdge, Controls, useEdgesState, useNodesState } from "reactflow";
import { DefineNodePurge } from "../purge/purge-nodes/DefineNodePurge";
import { SourceNode } from "../purge/purge-nodes/SourceNodePurge";
import { TargetNode } from "../purge/purge-nodes/TargetNodePurge";
import { SchedulerNode } from "../purge/purge-nodes/SchedulerNodePurge"
import { DrawerContainer } from "../migration/drawers/DrawerContainer";
import TableDrawer from "../migration/dialog/TableDrawer";


const nodeTypes = {
  define : DefineNodePurge,
  source : SourceNode,
  target : TargetNode,
  schedule : SchedulerNode
};

let id = 0;
const getId = () => `node_+${id++}`

function PurgeCanvas() {

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if(!type) return;

    const position = {
      x : event.clientX - 500,
      y : event.clientY - 80
    };

    const newNode = {
      id : getId(),
      type,
      position,
      data : { 
        lable : type,
        tables : []
      }
    }

    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const onNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
  }, [setNodes, setEdges]);

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    }
  }, [onNodeDelete]);

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes = {nodes}
        edges = {edges}
        onNodesChange = {onNodesChange}
        onEdgesChange = {onEdgesChange}
        onConnect = {onConnect}
        onDragOver = {onDragOver}
        onDrop = {onDrop}
        nodeTypes = {nodeTypes}
        className="bg-gray-50"
      >
        <Controls className="fill-white stroke-black" />
      </ReactFlow>
      <DrawerContainer />
      <TableDrawer nodes={nodes} setNodes={setNodes}/>
    </div>
  )
}

export default PurgeCanvas;
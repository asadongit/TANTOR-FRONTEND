import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DefineNode } from './nodes/DefineNode';
import { ViewNode } from './nodes/ViewNode';
import { SupervisedMLNode } from './nodes/SupervisedMLNode';
import { UnsupervisedMLNode } from './nodes/UnsupervisedMLNode';
import { ModelMetricsNode } from './nodes/ModelMetricsNode';
import { DataProfilingNode } from './nodes/DataProfilingNode';
import { DataPreparationNode } from './nodes/DataPreparationNode';
import { DrawerContainer } from './drawers/DrawerContainer';

const nodeTypes = {
  define: DefineNode,
  viewCsv: ViewNode,
  supervisedMl: SupervisedMLNode,
  unsupervisedMl: UnsupervisedMLNode,
  modelMetrics: ModelMetricsNode,
  dataProfiling: DataProfilingNode,
  dataPreparation: DataPreparationNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const MigrationCanvas = () => {
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

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 320,
        y: event.clientY - 40,
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]);

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
        className="bg-gray-100"
      >
        <Background color="#374151" gap={16} />
        <Controls className="fill-white stroke-black" />
      </ReactFlow>
      <DrawerContainer />
    </div>
  );
}
export default MigrationCanvas;

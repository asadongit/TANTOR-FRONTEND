/*eslint-disable*/
import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SourceViewNode } from './nodes/sourceViewNode';
import {ConnectionNode} from './nodes/connectionNode'
import {ConsolidationNode} from './nodes/consolidationNode'
import { DrawerContainer } from './drawers/DrawerContainer';
import { useStateContext } from '../../../context/contextProvider';

const nodeTypes = {
  sourceView: SourceViewNode,
  connection:ConnectionNode,
  consolidation:ConsolidationNode
};

let id = 0;
const getId = () => `node_${id++}`;

export function ViewCanvas() {

  const { handleConsolidationPayload,joinPayload  } = useStateContext("");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const getFirstNodeId = () => {
    if (nodes.length === 0) return null; // No nodes available
  
    // Find the node with the smallest numerical ID
    const sortedNodes = [...nodes].sort((a, b) => {
      const idA = parseInt(a.id.split('_')[1], 10); // Extract the numeric part
      const idB = parseInt(b.id.split('_')[1], 10); // Extract the numeric part
      return idA - idB;
    });
  
    return sortedNodes[0]?.id; // Return the ID of the first node
  };

  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges]
  // );


  const onConnect = (params) => {
    const { source, target } = params; 
    handleConsolidationPayload({ source, target })
    console.log("Connecting:", { source, target }); 
    setEdges((eds) => addEdge(params, eds));
  };

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


  const handleClick =()=>{
    const firstNodeId = getFirstNodeId();
  console.log("First node ID is:", firstNodeId);
    console.log("join payload is ===>",joinPayload)
  }

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
        zoom={0.25}
        className="bg-gray-50"
      >
        {/* <Background color="#374151" gap={16} /> */}
        <Controls className="fill-black stroke-black" />
      </ReactFlow>
      <DrawerContainer />
      <button
        onClick={handleClick}
        className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow"
      >
        Combine and Save Data
      </button>
    </div>
  );
}


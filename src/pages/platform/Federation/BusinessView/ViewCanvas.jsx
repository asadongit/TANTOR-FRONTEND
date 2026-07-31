/*eslint-disable*/
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SourceViewNode } from '../nodes/sourceViewNode';
import { ConnectionNode } from '../nodes/connectionNode'
import { ConsolidationNode } from '../nodes/consolidationNode'
import { DrawerContainer } from '../drawers/DrawerContainer';
import { useStateContext } from '../context/contextViewProvider';
import { ToastProvider } from '../context/ToastContext';

const nodeTypes = {
  sourceView: SourceViewNode,
  connection: ConnectionNode,
  consolidation: ConsolidationNode
};

let id = 0;
const getId = () => `node_${id++}`;

export function ViewCanvas() {

  const { handleConsolidationPayload, removeConsolidationPayloadByNode, nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, isEditMode, reactFlowInstance, setReactFlowInstance } = useStateContext("");

  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    const editFlowDataStr = sessionStorage.getItem("editFlowData");
    
    if (isEditMode && editFlowDataStr) {
      try {
        const editFlowData = JSON.parse(editFlowDataStr);
        if (editFlowData.nodes) {
          setNodes(editFlowData.nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              _isRestoring: true
            }
          })));
        }
        if (editFlowData.edges) {
          setEdges(editFlowData.edges);
          editFlowData.edges.forEach(edge => {
            handleConsolidationPayload({ source: edge.source, target: edge.target });
          });
        }
        hasRestoredRef.current = true;
      } catch (err) {
        console.error("Failed to parse edit flow data", err);
      }
    }
  }, [setNodes, setEdges, handleConsolidationPayload, isEditMode]);


  // const onConnect = useCallback(
  //   (params) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges]
  // );


  const onConnect = (params) => {
    const { source, target } = params;
    handleConsolidationPayload({ source, target })
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
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: type },
        style: {
          width: 100,  // Fixed width
          height: 100  // Fixed height
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, reactFlowInstance]
  );

  const onNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== nodeId && edge.target !== nodeId
    ));
    removeConsolidationPayloadByNode(nodeId);
  }, [setNodes, setEdges, removeConsolidationPayloadByNode]);

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    };
  }, [onNodeDelete]);


  return (
    <div className="h-full relative">
      <div className="fixed left-1 bottom-16 transform -translate-y-1/2">
        <Controls className="fill-black text-black stroke-black" />
      </div>

      <ToastProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            setReactFlowInstance(instance);
            if (isEditMode) {
              const dataStr = sessionStorage.getItem("editFlowData");
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.viewport) {
                    instance.setViewport(data.viewport);
                  } else {
                    window.requestAnimationFrame(() => instance.fitView({ maxZoom: 1 }));
                  }
                } catch(e) {}
              }
            }
          }}
          className="bg-gray-50"
        >
          <MiniMap />
        </ReactFlow>
      </ToastProvider>
      <DrawerContainer />
    </div>
  );
}
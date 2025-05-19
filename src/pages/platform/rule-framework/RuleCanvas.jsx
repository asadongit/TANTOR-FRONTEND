import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { DefineNode } from "./nodes/DefineNode";
import SourceNode from "./nodes/SourceNode";
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import RuleFilter from "../react-flow/dialog/RuleFilter";
import { RuleSidebar } from "./RuleSidebar";
import { toast } from "react-hot-toast";
import RuleSummary from "./RuleSummary";
import { useStateContext } from "../Federation/context/contextViewProvider";

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const RuleCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRuleSummaryOpen, setIsRuleSummaryOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState(null);
  const [filterData, setFilterData] = useState(null);
  const { handleFinalPayload, finalPayload } = useStateContext();

  // Add effect to watch for showRuleSummary flag in nodes
  useEffect(() => {
    const sourceNode = nodes.find(node => node.type === 'source');
    if (sourceNode?.data?.showRuleSummary) {
      setIsRuleSummaryOpen(true);
      // Reset the flag
      setNodes(nds => 
        nds.map(node => 
          node.id === sourceNode.id 
            ? { ...node, data: { ...node.data, showRuleSummary: false } }
            : node
        )
      );
    }
  }, [nodes, setNodes]);

  // Ensure all Define nodes always have the correct onDataChange handler (patch on mount and whenever handleFinalPayload changes)
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'define') {
          return {
            ...node,
            data: {
              ...node.data,
              onDataChange: (newData) => {
                console.log('[RuleCanvas] onDataChange for DefineNode:', newData);
                setNodes((nds2) =>
                  nds2.map((n) =>
                    n.id === node.id
                      ? { ...n, data: { ...n.data, ...newData } }
                      : n
                  )
                );
                // Sync to finalPayload for summary
                handleFinalPayload({
                  name: newData.name,
                  description: newData.description,
                });
              },
            },
          };
        }
        return node;
      })
    );
  }, [setNodes, handleFinalPayload]);

  const onConnect = useCallback(
    (params) => {
      // Only allow connection from define to source
      if (params.source && params.target) {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        if (sourceNode?.type === 'define' && targetNode?.type === 'source') {
          setEdges((eds) => addEdge(params, eds));
          
          // When connecting, update the source node with define node data
          setNodes((nds) =>
            nds.map((node) =>
              node.id === targetNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      ruleName: sourceNode.data.name,
                      ruleDescription: sourceNode.data.description,
                      columns: node.data.columns || [],
                      isConnectedToDefine: true
                    }
                  }
                : node
            )
          );
          // Also update finalPayload for summary
          handleFinalPayload((prev) => ({
            ...prev,
            name: sourceNode.data.name,
            description: sourceNode.data.description,
          }));
        } else {
          toast.error('Invalid connection. Define node must connect to Source node.');
        }
      }
    },
    [setEdges, nodes, setNodes, handleFinalPayload]
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

      // Check if we already have a node of this type
      const existingNode = nodes.find(n => n.type === type);
      if (existingNode) {
        toast.error(`Only one ${type} node is allowed.`);
        return;
      }

      const baseData = {
        onDataChange: (newData) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNode.id
                ? { ...node, data: { ...node.data, ...newData } }
                : node
            )
          );

          // If this is a define node update, propagate to connected source nodes
          if (newData.nodeType === 'define') {
            const connectedEdges = edges.filter(e => e.source === newNode.id);
            connectedEdges.forEach(edge => {
              const sourceNode = nodes.find(n => n.id === edge.target);
              if (sourceNode) {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === sourceNode.id
                      ? {
                          ...node,
                          data: {
                            ...node.data,
                            ruleName: newData.name,
                            ruleDescription: newData.description,
                            isConnectedToDefine: true
                          }
                        }
                      : node
                  )
                );
              }
            });
            // --- ADD: Sync to finalPayload for summary ---
            console.log(' ', {
              name: newData.name,
              description: newData.description
            });
            handleFinalPayload((prev) => ({
              ...prev,
              name: newData.name,
              description: newData.description
            }));
          }

          // If this is a source node update, update filterData
          if (newData.nodeType === 'source' && newData.columns) {
            setFilterData(prev => ({
              ...prev,
              columns: newData.columns
            }));
          }
        },
        getNodes: () => nodes,
        isConnectedToDefine: false
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          ...baseData,
          label: type
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, nodes, edges, handleFinalPayload]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      if (nodeToDelete?.type === 'define') {
        // Update connected source nodes when define node is deleted
        const connectedEdges = edges.filter(e => e.source === nodeId);
        connectedEdges.forEach(edge => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === edge.target
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      ruleName: '',
                      ruleDescription: '',
                      isConnectedToDefine: false
                    }
                  }
                : node
            )
          );
        });
        // --- ADD: Clear from finalPayload when define node is deleted ---
        handleFinalPayload((prev) => ({
          ...prev,
          name: '',
          description: ''
        }));
      }
      
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges, nodes, edges, handleFinalPayload]
  );

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    return () => {
      window.deleteNode = undefined;
    };
  }, [onNodeDelete]);

  return (
    <>
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
            <RuleSidebar />
          </Panel>
        </ReactFlow>
        <DrawerContainer />
        <RuleFilter 
          nodes={nodes} 
          setNodes={setNodes}
          filterData={filterData}
          setFilterData={setFilterData}
        />
      </div>
      {isRuleSummaryOpen && (
        <RuleSummary 
          setIsOpen={setIsRuleSummaryOpen}
          selectedFact={selectedFact}
          filterData={filterData}
          nodes={nodes}
          setNodes={setNodes}
        />
      )}
    </>
  );
};

export default RuleCanvas;

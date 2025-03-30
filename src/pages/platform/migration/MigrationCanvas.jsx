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

      const baseData = {
        onDataChange: (newData) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNode.id ? { ...node, data: { ...node.data, ...newData } } : node
            )
          );
        },
      };

      const typeSpecificData = {
        source: { connection: '', schema: '', tables: [] },
        target: { connection: '', schema: '', settings: { type: 'Prefix/Suffix', value: '' } },
        define: { name: '', description: '' },
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          ...baseData,
          ...typeSpecificData[type],
          label: type,
        },
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


  const handleTargetSubmit = useCallback((targetNodeId) => {
    // Find the target node using the provided ID
    const targetNode = nodes.find(node => 
      node.id === targetNodeId && node.type === 'target'
    );
    
    if (!targetNode) {
      console.error('Target node not found');
      return;
    }
  
    // Rest of the payload construction remains the same
    const sourceEdges = edges.filter(edge => edge.target === targetNodeId);
    const sourceNodes = nodes.filter(node => 
      sourceEdges.some(edge => edge.source === node.id)
    );
  
    const sourcesPayload = sourceNodes.map(sourceNode => {
      const defineEdges = edges.filter(edge => edge.target === sourceNode.id);
      const defineNodes = nodes.filter(node =>
        defineEdges.some(edge => edge.source === node.id)
      );
  
      return {
        connection: sourceNode.data.connection,
        schema: sourceNode.data.schema,
        tables: sourceNode.data.tables,
        defines: defineNodes.map(defineNode => ({
          name: defineNode.data.name,
          description: defineNode.data.description
        }))
      };
    });
  
    const payload = {
      target: {
        connection: targetNode.data.connection,
        schema: targetNode.data.schema,
        settings: targetNode.data.settings
      },
      sources: sourcesPayload
    };
  
    // Call dummy API
    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Migration submitted:', data);
        alert('Migration submitted successfully!');
      })
      .catch(error => {
        console.error('Submission error:', error);
        alert('Error submitting migration');
      });
  }, [nodes, edges]);

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    window.handleTargetSubmit = handleTargetSubmit;
    return () => {
      window.deleteNode = undefined;
      window.handleTargetSubmit = undefined;
    };
  }, [onNodeDelete, handleTargetSubmit]);

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

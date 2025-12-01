import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactFlow, { addEdge, Controls, Panel, useEdgesState, useNodesState } from "reactflow";
import { DefineNodePurge } from "../purge/purge-nodes/DefineNodePurge";
import { SourceNode } from "../purge/purge-nodes/SourceNodePurge";
import { TargetNode } from "../purge/purge-nodes/TargetNodePurge";
import { SchedulerNode } from "../purge/purge-nodes/SchedulerNodePurge"
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import PurgeDrawer from "../react-flow/dialog/PurgeDrawer"
import PurgeSidebar from "./PurgeSidebar";
import PurgeFooter from "./PurgeFooter";
import { createPipeline } from "../cdc/components/CreatePipeline";
import { useStateContext } from "../react-flow/context/ContextProvider";
import toast from "react-hot-toast";


const nodeTypes = {
  define : DefineNodePurge,
  source : SourceNode,
  target : TargetNode,
  schedule : SchedulerNode
};

let id = 0;
const getId = () => `node_+${id++}`

// Utility to serialize the full React Flow graph for Purge (nodes, edges, positions, user data)
function getPurgeFlowGraph(nodes, edges) {
  return {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data, // all user-entered data for the node
      // add other node properties if needed
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      // add other edge properties if needed
    })),
  };
}

function PurgeCanvas() {
  const location = useLocation();
  const ui_json = location.state?.ui_json;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const {isVisibleFooter, handleIsVisibleFooter, handleDefineNodeName, handleDefineNodeDesc, handleSourceConnectionName, handleSourceSchemaName, handleSelectedTables, handleTargetConnectionName} = useStateContext("");

  // Pre-populate nodes from ui_json on mount (edit flow)
  useEffect(() => {
    if (ui_json) {
      const initialNodes = [];
      const initialEdges = [];
      let y = 50;
      // Use saved positions if available, else default
      // Define node
      if (ui_json.defineNode) {
        initialNodes.push({
          id: 'define',
          type: 'define',
          position: ui_json.defineNode.position || { x: 100, y },
          data: { ...ui_json.defineNode },
        });
        if (ui_json.defineNode.name) handleDefineNodeName(ui_json.defineNode.name);
        if (ui_json.defineNode.desc) handleDefineNodeDesc(ui_json.defineNode.desc);
        y += 120;
      }
      // Source node
      if (ui_json.sourceNode) {
        initialNodes.push({
          id: 'source',
          type: 'source',
          position: ui_json.sourceNode.position || { x: 350, y: 50 },
          data: { ...ui_json.sourceNode },
        });
        // Pre-populate context for Source node
        if (ui_json.sourceNode.connectionName) handleSourceConnectionName(ui_json.sourceNode.connectionName);
        if (ui_json.sourceNode.schemaName) handleSourceSchemaName(ui_json.sourceNode.schemaName);
        if (ui_json.sourceNode.selectedTables) handleSelectedTables(ui_json.sourceNode.selectedTables);
        y += 120;
      }
      // Target node
      if (ui_json.targetNode) {
        initialNodes.push({
          id: 'target',
          type: 'target',
          position: ui_json.targetNode.position || { x: 600, y: 50 },
          data: { ...ui_json.targetNode },
        });
        // Pre-populate context for Target node
        if (ui_json.targetNode.connectionName) handleTargetConnectionName(ui_json.targetNode.connectionName);
        y += 120;
      }
      // Scheduler node (if present)
      if (ui_json.scheduleNode) {
        initialNodes.push({
          id: 'schedule',
          type: 'schedule',
          position: ui_json.scheduleNode.position || { x: 850, y: 50 },
          data: { ...ui_json.scheduleNode },
        });
      }
      // Add default edges if all nodes present
      if (ui_json.defineNode && ui_json.sourceNode) {
        initialEdges.push({ id: 'e1', source: 'define', target: 'source' });
      }
      if (ui_json.sourceNode && ui_json.targetNode) {
        initialEdges.push({ id: 'e2', source: 'source', target: 'target' });
      }
      setNodes(initialNodes);
      setEdges(initialEdges);
      setTimeout(() => {
        if (window.openDrawer) {
          if (ui_json.defineNode) window.openDrawer('define');
          if (ui_json.sourceNode) window.openDrawer('source');
          if (ui_json.targetNode) window.openDrawer('target');
          if (ui_json.scheduleNode) window.openDrawer('schedule');
        }
      }, 300);
    }
  }, [ui_json, setNodes, setEdges, handleDefineNodeName, handleDefineNodeDesc, handleSourceConnectionName, handleSourceSchemaName, handleSelectedTables, handleTargetConnectionName])

  useEffect(() => {
  if (ui_json) return;

  const { nodes: autoNodes, edges: autoEdges } = createPipeline("purge", "purge_1");

  setNodes(autoNodes);
  setEdges(autoEdges);
}, [ui_json, setNodes, setEdges]);

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

  const handleConnectNode = useCallback(() => {
    return toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          toast.dismiss();

          const defineNodes = nodes.filter((n) => n.type === "define");
          const sourceNodes = nodes.filter((n) => n.type === "source");
          const targetNodes = nodes.filter((n) => n.type === "target");

          const validationErrors = [];

          // Validate connections
          const hasDefineSource = edges.some(
            (e) =>
              e.source === defineNodes[0]?.id &&
              e.target === sourceNodes[0]?.id
          );
          const hasSourceTarget = edges.some(
            (e) =>
              e.source === sourceNodes[0]?.id &&
              e.target === targetNodes[0]?.id
          );

          if (!hasDefineSource)
            validationErrors.push("Connect Define node to Source node");
          if (!hasSourceTarget)
            validationErrors.push("Connect Source node to Target node");

          if (validationErrors.length > 0) {
            throw new Error(validationErrors.join("\n"));
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      }),
      {
        loading: <b>Validating....</b>,
        success: () => {
          toast.success("All nodes saved successfully!",
            {
              duration: 2000,
              position: "top-center",
              icon: "✅", 
            }
          );
          return "";
        },
        error: (err) => (
          <div className="text-sm">
            <b className="text-red-600">Submission failed:</b>
            {err.message.split("\n").map((line, idx) => (
              <div key={idx} className="mt-1 flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{line}</span>
              </div>
            ))}
          </div>
        ),
      }
    )
  }, [nodes, edges])

  useEffect(() => {
    window.deleteNode = onNodeDelete;
    window.handleConnectNode = handleConnectNode;
    // Expose the utility globally for PurgeFooter to use
    window.getPurgeFlowGraph = () => getPurgeFlowGraph(nodes, edges);
    return () => {
      window.deleteNode = undefined;
      window.handleConnectNode = undefined;
      window.getPurgeFlowGraph = undefined;
    }
  }, [onNodeDelete, handleConnectNode, nodes, edges]);

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
        <Panel position="top-left">
          <PurgeSidebar />
        </Panel>
        {isVisibleFooter && (<Panel position="bottom-right" className="w-full">
          <PurgeFooter onCancel = {() => handleIsVisibleFooter(false)}/>
        </Panel>)}
      </ReactFlow>
      <DrawerContainer />
      <PurgeDrawer nodes={nodes} setNodes={setNodes}/>
    </div>
  )
}

export default PurgeCanvas;
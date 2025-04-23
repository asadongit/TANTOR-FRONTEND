import { useCallback, useEffect } from "react";
import ReactFlow, { addEdge, Controls, Panel, useEdgesState, useNodesState } from "reactflow";
import { DefineNodePurge } from "../purge/purge-nodes/DefineNodePurge";
import { SourceNode } from "../purge/purge-nodes/SourceNodePurge";
import { TargetNode } from "../purge/purge-nodes/TargetNodePurge";
import { SchedulerNode } from "../purge/purge-nodes/SchedulerNodePurge"
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import PurgeDrawer from "../react-flow/dialog/PurgeDrawer"
import PurgeSidebar from "./PurgeSidebar";
import PurgeFooter from "./PurgeFooter";
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

function PurgeCanvas() {

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const {isVisibleFooter, handleIsVisibleFooter} = useStateContext("");

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
    return () => {
      window.deleteNode = undefined;
      window.handleConnectNode = undefined;
    }
  }, [onNodeDelete, handleConnectNode]);

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
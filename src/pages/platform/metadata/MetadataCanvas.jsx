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
import TableDrawer from "../react-flow/dialog/TableDrawer";
import { MetadataSidebar } from "./MetadataSidebar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// import { useUserInfo } from '../hooks/useUserInfo';

const nodeTypes = {
  define: DefineNode,
  source: SourceNode,
  target: TargetNode,
};

const hostname = import.meta.env.VITE_FAST_API;
const token = import.meta.env.VITE_ACCESS_TOKEN;

let id = 0;
const getId = () => `node_${id++}`;

const MigrationCanvas = () => {
  const navigate = useNavigate();

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
              node.id === newNode.id
                ? { ...node, data: { ...node.data, ...newData } }
                : node
            )
          );
        },
      };

      const typeSpecificData = {
        source: { connection: "", schema: "", tables: [] },
        target: {
          connection: "",
          schema: "",
          settings: { type: "Prefix/Suffix", value: "" },
        },
        define: { name: "", description: "" },
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

  const handleTargetSubmit = useCallback(
    (targetNodeId) => {
      return toast.promise(
        new Promise(async (resolve, reject) => {
          try {
            // Clear existing toasts
            toast.dismiss();

            // Get nodes and edges
            const defineNodes = nodes.filter((n) => n.type === "define");
            const sourceNodes = nodes.filter((n) => n.type === "source");
            const targetNodes = nodes.filter((n) => n.type === "target");

            // Validate node counts
            const validationErrors = [];
            if (defineNodes.length !== 1)
              validationErrors.push("Exactly one Define node required");
            if (sourceNodes.length !== 1)
              validationErrors.push("Exactly one Source node required");
            if (targetNodes.length !== 1)
              validationErrors.push("Exactly one Target node required");

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

            // Validate Define node data
            const defineData = defineNodes[0]?.data || {};
            if (!defineData.metadata_name)
              validationErrors.push("Define Node: Metadata name is required");
            if (!defineData.description)
              validationErrors.push("Define Node: Description is required");

            // Validate Source node data
            const sourceData = sourceNodes[0]?.data || {};
            if (!sourceData.connectionId)
              validationErrors.push("Source Node: Connection required");
            if (!sourceData.schema)
              validationErrors.push("Source Node: Schema required");
            if (!sourceData.tables?.length)
              validationErrors.push("Source Node: Tables required");

            // Validate Target node data
            const targetData = targetNodes[0]?.data || {};
            if (!targetData.connectionId)
              validationErrors.push("Target Node: Connection required");
            if (
              targetData.settings?.type !== "Prefix/Suffix" &&
              !targetData.settings?.value
            ) {
              validationErrors.push(
                "Target Node: Prefix/Suffix value required"
              );
            }

            // Throw aggregated errors
            if (validationErrors.length > 0) {
              throw new Error(validationErrors.join("\n"));
            }

            // Get username from token
            const getUsername = () => {
              try {
                const token = localStorage.getItem("token");
                const payload = JSON.parse(atob(token.split(".")[1]));
                return payload.username || "unknown";
              } catch {
                return "unknown";
              }
            };

            // Prepare table list with transformations
            const table_list = sourceData.tables.map((table) => ({
              [table]: `${
                targetData.settings.type.includes("Prefix")
                  ? targetData.settings.value
                  : ""
              }${table}${
                targetData.settings.type.includes("Suffix")
                  ? targetData.settings.value
                  : ""
              }`,
            }));

            // Construct payload
            const payload = {
              metadata_name: defineData.metadata_name,
              description: defineData.description,
              project: sessionStorage.getItem("project") || "default",
              created_by: getUsername(),
              conn_type: sourceData.connectionType,
              source_conn_id: sourceData.connectionId,
              target_conn_id: targetData.connectionId,
              table_list,
            };

            // API call
            const response = await fetch(`${hostname}/ddl-migration`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        }),
        {
          loading: <b>Validating and submitting migration...</b>,
          success: () => {
            // Show success toast for 2 seconds then redirect
            toast.success(
              "Migration submitted successfully!",
              {
                duration: 2000,
                position: "top-right",
                icon: "✅", 
              }
            );
            setTimeout(() => navigate("/Migrationcanvas"), 2000);
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
      );
    },
    [nodes, edges]
  ); // Dependencies

  // Create src/hooks/useUserInfo.js
  // export const useUserInfo = () => {
  //   const [userInfo, setUserInfo] = useState({});

  //   useEffect(() => {
  //     const token = localStorage.getItem('token');
  //     if (token) {
  //       const payload = JSON.parse(atob(token.split('.')[1]));
  //       setUserInfo({
  //         username: payload.username,
  //         // other claims...
  //       });
  //     }
  //   }, []);

  //   return userInfo;
  // };

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
          <MetadataSidebar />
        </Panel>
      </ReactFlow>
      <DrawerContainer />
      <TableDrawer nodes={nodes} setNodes={setNodes} />
    </div>
  );
};
export default MigrationCanvas;

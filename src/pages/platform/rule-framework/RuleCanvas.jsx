// STATE - 3
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import SourceNode from "./nodes/SourceNode";
import { DrawerContainer } from "../react-flow/drawers/DrawerContainer";
import RuleFilter from "../react-flow/dialog/RuleFilter";
import { RuleSidebar } from "./RuleSidebar";
import { toast } from "react-hot-toast";
import RuleSummary from "./RuleSummary";
import { generateSQLQuery } from "../../../services/sqlQueryService";
import { ClipboardSignature } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const nodeTypes = {
  source: SourceNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const RuleCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRuleSummaryOpen, setIsRuleSummaryOpen] = useState(false);
  const [ruleSummaryData, setRuleSummaryData] = useState(null);
  const [selectedFact, setSelectedFact] = useState(null);
  const [filterData, setFilterData] = useState(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [dimensionFilters, setDimensionFilters] = useState([]);
  const [timeTransformationFilters,setTimeTransformationFilters] = useState([]);
  const [filterQuery,setFilterQuery] = useState("");


  const {mode, ruleData} = useLocation().state || {mode: "CREATE"};
  const {hostnameV1, token} = useAuth();

  const navigate = useNavigate();

  // NEW CODE
  useEffect(() => {

    if(mode.toUpperCase() !== "EDIT") return;
    
    const ruleId = ruleData?.id;
    if(!ruleId){
      toast.error("Rule ID not found.");
      return;
    }

    (async () => {
      const headers = {"Content-Type": "application/json", "Authorization": `Bearer ${token}`};
      try{

        const response = await fetch(`${window._env_?.VITE_REPORTING_BACKEND_API}/ruleJson?rule_id=${ruleId}`, {headers});
        if(!response.ok){
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || "Error occured when trying to fetch existing rule.");
        }
        
        const ruleJson = await response.json();
        if(ruleJson === null)
           throw new Error("Rule JSON not found!");
        
        const sourceNode = ruleJson.find((nd) => nd.type === "source");
        if(!sourceNode) 
          throw new Error("Invalid Rule JSON!");
        
        const updatedNodes = ruleJson.map(node => {
        if(node.type === "source") {
          return {
            ...node,
            data: {
              ...node.data,
              mode: mode,
              ruleId: ruleId,
              onDataChange: (newData) => {
                setNodes(nds => nds.map(n => 
                  n.id === node.id ? { ...n, data: { ...n.data, ...newData } } : n
                ));
              }
            }
          };
        }
        return node;
      });

        if(!updatedNodes) throw new Error("Error trying to show existing rule/node data");
        
        setNodes(updatedNodes);
      }catch(error){
        console.error(error);
        toast.error(error.message);
        setTimeout(() => {navigate("/config/rule");},2000)
      }
    })();
  }, [mode, ruleData, token, hostnameV1, setNodes]);
// NEW CODE








  // Add effect to watch for showRuleSummary flag in nodes
  useEffect(() => {
  const sourceNode = nodes.find(
    (node) => node.type === "source" && node.data.showRuleSummary
  );
  if (sourceNode) {
     setRuleSummaryData({
      nodeId: sourceNode.id,
      selectedFact: sourceNode.data.selectedFact,
      filterConditions: sourceNode.data.filterConditions,
      ruleName: sourceNode.data.ruleName,
      ruleId: sourceNode.data.ruleId,
      ruleDescription: sourceNode.data.ruleDescription,
      dimensionFilters: sourceNode.data.dimensionFilters || [],
      timeTransformationFilters: sourceNode.data.timeTransformationFilters || [],
    });
    setIsRuleSummaryOpen(true);

    // Reset the flag
    setNodes((nds) =>
      nds.map((node) =>
        node.id === sourceNode.id
          ? { ...node, data: { ...node.data, showRuleSummary: false } }
          : node
      )
    );
  }
}, [nodes, setNodes]);

  // Ensure source nodes have the correct onDataChange handler
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "source") {
          return {
            ...node,
            data: {
              ...node.data,
              onDataChange: (newData) => {
                setNodes((nds2) =>
                  nds2.map((n) =>
                    n.id === node.id
                      ? { ...n, data: { ...n.data, ...newData } }
                      : n
                  )
                );
              },
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Simplify onConnect since we only have one node type
  const onConnect = useCallback(
    (params) => {
      toast.error('Connections are not supported in this view');
    },
    []
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

      // Only allow source nodes
      if (type !== "source") {
        toast.error('Only source nodes are allowed');
        return;
      }

      // Check if we already have a node
      if (nodes.length > 0) {
        toast.error(`Only one node is allowed.`);
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
        },
        getNodes: () => nodes,
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          ...baseData,
          label: type,
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, nodes]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
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
          nodes={nodes}
          mode={mode}
          {...ruleSummaryData}
        />
      )}
    </>
  );
};

export default RuleCanvas;
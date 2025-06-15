// STATE - 3
import React, { useCallback, useEffect, useState } from "react";
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
// import { useStateContext } from "../Federation/context/contextViewProvider";
import { generateSQLQuery } from "../../../services/sqlQueryService";
import { ClipboardSignature } from "lucide-react";

const nodeTypes = {
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
  const [previewData, setPreviewData] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [dimensionFilters, setDimensionFilters] = useState([]);
  const [timeTransformationFilters,setTimeTransformationFilters] = useState([]);

  // const { handleFinalPayload, finalPayload } = useStateContext();

  // Add effect to watch for showRuleSummary flag in nodes
  useEffect(() => {
  const sourceNode = nodes.find(
    (node) => node.type === "source" && node.data.showRuleSummary
  );
  if (sourceNode) {
    console.log("SOURCE NODE ", sourceNode.data);
    setIsRuleSummaryOpen(true);
    setSelectedFact(sourceNode.data.selectedFact);
    setFilterData(sourceNode.data.filterConditions);
    setRuleName(sourceNode.data.ruleName);
    setRuleDescription(sourceNode.data.ruleDescription);
    setDimensionFilters(sourceNode.data.dimensionFilters || []);
    setTimeTransformationFilters(sourceNode.data.timeTransformationFilters || []);


    let sqlPreview = "";

    if(sourceNode.data.dimensionQuery)
      sqlPreview += `(${sourceNode.data.dimensionQuery})`
    if(sourceNode.data.timeTransformationQuery) {
      sqlPreview += sqlPreview.length > 0 ? " AND " : ""
      sqlPreview += `(${sourceNode.data.timeTransformationQuery})`;
    }

    setPreviewData(generateSQLQuery({
      tableName:sourceNode.data.fct_name, 
      selectedColumns: sourceNode.data.filterConditions.columns, 
      complexQuery: sqlPreview
    }));


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
                
                // Sync to finalPayload for summary
                // if (newData.ruleName || newData.ruleDescription) {
                //   handleFinalPayload({
                //     name: newData.ruleName || node.data.ruleName,
                //     description: newData.ruleDescription || node.data.ruleDescription,
                //   });
                // }
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

          // Sync to finalPayload for summary
          // if (newData.ruleName || newData.ruleDescription) {
          //   handleFinalPayload({
          //     name: newData.ruleName || '',
          //     description: newData.ruleDescription || ''
          //   });
          // }
        },
        getNodes: () => nodes,
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
    [setNodes, nodes]
  );

  const onNodeDelete = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      // Clear final payload when node is deleted
      // handleFinalPayload({
      //   name: '',
      //   description: ''
      // });
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
          selectedFact={selectedFact}
          filterData={filterData}
          previewData={previewData}
          nodes={nodes}
          setNodes={setNodes}
          setFilterData={setFilterData}
          ruleName={ruleName}
          ruleDescription={ruleDescription}
          dimensionFilters={dimensionFilters}
          timeTransformationFilters={timeTransformationFilters}
        />
      )}
    </>
  );
};

export default RuleCanvas;
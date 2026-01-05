import React, { useEffect, useRef, useState } from "react";
import {
  Network,
  Workflow,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Plus,
  ArrowRightLeft,
} from "lucide-react";
import { useWorkflow } from "./context/WorkflowContext";

export function CDCSidebar({ initialCanvasType }) {
  const { addPipeline, addNode, setNodes, setPipelines, editMode } = useWorkflow();
  const [collapsed, setCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(null);
  const hasRun = useRef(false);
  const [canvasType, setCanvasType] = useState(initialCanvasType || "cdc");

  const handleModeToggle = () => {
    const newType = canvasType === "cdc" ? "metadata" : "cdc";
    setCanvasType(newType);
    hasRun.current = false;
  };

  const cdcNodes = [
    {
      type: "define",
      label: "Define",
      iconType: "iconify",
      icon: "material-symbols:contract-outline",
      color: "purple",
    },
    {
      type: "source",
      label: "Source",
      iconType: "iconify",
      icon: "material-symbols:analytics-outline",
      color: "purple",
    },
    {
      type: "target",
      label: "Target",
      iconType: "iconify",
      icon: "material-symbols:ads-click",
      color: "purple",
    },
    {
      type: "schedule",
      label: "Schedule",
      iconType: "iconify",
      icon: "material-symbols:alarm-outline",
      color: "purple",
    }
  ];

  const metadataNodes = [
    {
      type: "metadataDefine",
      label: "Define",
      iconType: "iconify",
      icon: "material-symbols:contract-outline",
      color: "purple",
    },
    {
      type: "metadataSource",
      label: "Source",
      iconType: "iconify",
      icon: "material-symbols:analytics-outline",
      color: "purple",
    },
    {
      type: "metadataTarget",
      label: "Target",
      iconType: "iconify",
      icon: "material-symbols:ads-click",
      color: "purple",
    }
  ];

  const nodes = canvasType === "metadata" ? metadataNodes : cdcNodes;

  useEffect(() => {
    if (!hasRun.current && canvasType) {
      setNodes([]);
      setPipelines({});
      addPipeline(canvasType);
      hasRun.current = true;
    }
  }, [canvasType, addPipeline]);

  useEffect(() => {
    if (initialCanvasType && initialCanvasType !== canvasType) {
      setCanvasType(initialCanvasType);
    }
  }, [initialCanvasType]);

  const handleNodeDrag = (nodeType) => (e) => {
    e.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: nodeType,
        category: canvasType || "default",
        isPipeline: false,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className={`
      z-10
      absolute
      top-4
      left-4
      transition-all
      duration-300
      ease-in-out
      border
      border-gray-300
      shadow-lg
      rounded-lg
      bg-white
      ${collapsed ? "w-20" : "w-[225px]"}
    `}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <Workflow className="w-5 h-5 text-purple-600" />
            <span className="text-gray-800 text-md font-bold">
              {canvasType === "metadata" ? "METADATA" : "CDC"}
            </span>
            {editMode && (
              <span className="text-sm font-medium text-gray-500">(Edit Mode)</span>
            )}
          </div>
        )}
        <div className="flex items-center space-x-2">
          {!editMode && (
            <button
              className="p-1 rounded-md hover:bg-gray-200 transition"
              onClick={handleModeToggle}
              title="Toggle Mode"
            >
              <ArrowRightLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <button
            className="p-1 rounded-md hover:bg-gray-200 transition"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-gray-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <div
        className={`p-3 ${
          collapsed ? "flex flex-col items-center space-y-3" : "space-y-4"
        }`}
      >
        <div
          className={`flex items-center p-3 rounded-lg border border-gray-300 transition cursor-move relative ${
            editMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          draggable={!editMode}
          onMouseEnter={() => setIsHovering("pipeline")}
          onMouseLeave={() => setIsHovering(null)}
          onDragStart={!editMode ? (e) => {
            e.dataTransfer.setData(
              "application/reactflow",
              JSON.stringify({
                category: canvasType || "default",
                isPipeline: true,
              })
            );
            e.dataTransfer.effectAllowed = "move";
          } : undefined}
          onDoubleClick={!editMode ? () => {
            addPipeline(canvasType || "default");
            setCollapsed(true);
          } : undefined}
        >
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <iconify-icon
              icon="carbon:pipelines"
              width="32"
              style={{ color: "#8e78b7" }}
              height="32"
            ></iconify-icon>

            {collapsed && isHovering === "pipeline" && (
              <div
                className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                  bg-[#8e78b7] text-white text-xs px-2 py-1 rounded-md
                  whitespace-nowrap z-30 shadow-lg"
              >
                {editMode ? 'Edit Mode - No New Pipelines' : 'Add Pipeline +'}
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center justify-between flex-grow">
              <span className="text-gray-800 text-sm font-medium ml-3">
                {editMode ? 'Edit Mode' : 'Add Pipeline'}
              </span>
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center ml-2">
                <Plus className="w-3 h-3 text-gray-600" />
              </div>
            </div>
          )}
        </div>

        <div className="w-full mb-2">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-500 " />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Custom Nodes
              </span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
          ) : (
            <div className="relative flex justify-center w-full mt-2 mb-4">
              <div className="w-12 h-px bg-gray-300 mt-3"></div>
              <div
                className="absolute w-6 h-6 rounded-full hover:bg-[#a2ebae] bg-gray-100 flex items-center justify-center
                   border border-gray-300 mb-2 transition-transform duration-200 ease-in-out hover:scale-125"
                onMouseEnter={() => setIsHovering("nodes-label")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <Layers className="w-3 h-3 text-gray-500 transition-transform duration-200 ease-in-out hover:scale-110" />
                {isHovering === "nodes-label" && (
                  <div
                    className="absolute left-full ml-2 top-0 -translate-y-1/2
                          bg-[#8e78b7] text-white text-xs px-2 py-1 rounded-md
                          whitespace-nowrap z-50 shadow-lg"
                  >
                    Custom Nodes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`${collapsed ? "space-y-3" : "space-y-2 mt-2"}`}>
          {nodes.map((node) => (
            <div
              key={node.type}
              className={`flex items-center p-3 rounded-lg border border-gray-300 transition cursor-move relative ${
                editMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              draggable={!editMode}
              onMouseEnter={() => setIsHovering(node.type)}
              onMouseLeave={() => setIsHovering(null)}
              onDragStart={!editMode ? handleNodeDrag(node.type) : undefined}
              onDoubleClick={!editMode ? () => {
                addNode && addNode(node.type, canvasType);
              } : undefined}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                {node.iconType === "iconify" ? (
                  <iconify-icon
                    icon={node.icon}
                    width="24"
                    height="24"
                    style={{ color: "#8e78b7" }}
                  ></iconify-icon>
                ) : (
                  <node.icon className="w-5 h-5 text-purple-600" />
                )}

                {collapsed && isHovering === node.type && (
                  <div
                    className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                      bg-[#8e78b7] text-white text-xs px-2 py-1 rounded-md
                      whitespace-nowrap z-30 shadow-lg "
                  >
                    {editMode ? `${node.label} (Edit Mode)` : `${node.label} +`}
                  </div>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center justify-between flex-grow">
                  <span className="text-gray-800 text-sm font-medium ml-3">
                    {node.label}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center ml-2">
                    <Plus className="w-3 h-3 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
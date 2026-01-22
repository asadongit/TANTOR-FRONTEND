import React, { useState, useEffect } from "react";
import {
  Database,
  FileSpreadsheet,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ArrowRightLeft,
  BarChart3,
  Mail,
  Layers,
} from "lucide-react";
import { useTransformation } from "./TransformationContext";

const components = [
  { id: "source", name: "Source", icon: Database },
  { id: "transformation", name: "Transformation", icon: ArrowRightLeft },
  { id: "target", name: "Target", icon: Database },
];

export const TransformationSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(null);
  const { state, dispatch, ACTION_TYPES } = useTransformation();

  const [emailLogging, setEmailLogging] = useState(
    state.properties?.email?.isEmailEnabled || false
  );
  const [forceUpdate, setForceUpdate] = useState(0);

  const transformationExists =
    Array.isArray(window.allNodes) &&
    window.allNodes.some((n) => n.type === "transformation");

  useEffect(() => {
    window.triggerSidebarUpdate = () => {
      setForceUpdate((prev) => prev + 1);
    };
    return () => {
      delete window.triggerSidebarUpdate;
    };
  }, []);

  useEffect(() => {

    if (state.properties?.email?.isEmailEnabled !== undefined) {
      if (emailLogging !== state.properties.email.isEmailEnabled) {
        setEmailLogging(state.properties.email.isEmailEnabled);
      }
    }
  }, [
    state.properties?.logging?.isLoggingEnabledForEachDataset,
    state.properties?.email?.isEmailEnabled
  ]);

  useEffect(() => {
    if (!window.allNodes) return;

    // Prevent feedback loop during restoration
    const isRestoring = window.allNodes.some(
      (node) => node.data && node.data._isRestoring
    );
    if (isRestoring) return;

    const allSourceAndTargetNodes = window.allNodes.filter(
      (node) => node.type === "source" || node.type === "target"
    );

    if (allSourceAndTargetNodes.length === 0) {
      return;
    }

    const allNodesWithLoggingEnabled = allSourceAndTargetNodes.every(
      (node) => node.data && node.data.enableCountLogging === true
    );

    const anyNodeWithLoggingEnabled = allSourceAndTargetNodes.some(
      (node) => node.data && node.data.enableCountLogging === true
    );

    if (
      state.properties?.logging?.isLoggingEnabledForEachDataset !== allNodesWithLoggingEnabled ||
      state.properties?.logging?.hasMixedNodeSettings !== (anyNodeWithLoggingEnabled && !allNodesWithLoggingEnabled)
    ) {
      dispatch({
        type: ACTION_TYPES.UPDATE_GLOBAL_PROPERTIES,
        payload: {
          logging: {
            isLoggingEnabled: true,
            isLoggingEnabledForEachDataset: allNodesWithLoggingEnabled,
            hasMixedNodeSettings: anyNodeWithLoggingEnabled && !allNodesWithLoggingEnabled,
          },
        },
      });
    }
  }, [
    window.allNodes?.length,
    window.allNodes?.map((n) => n.data?.enableCountLogging).join(","),
    forceUpdate,
    dispatch,
    ACTION_TYPES,
    // REMOVE globalCountLogging from dependencies
    state.properties?.logging?.isLoggingEnabledForEachDataset,
    state.properties?.logging?.hasMixedNodeSettings
  ]);

  const onDragStart = (event, nodeType) => {
    if (nodeType === "transformation" && transformationExists) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  // Use only the global state for checked value
  const handleGlobalCountLoggingToggle = () => {
    const newValue = !state.properties?.logging?.isLoggingEnabledForEachDataset;
    // No setGlobalCountLogging here
    dispatch({
      type: ACTION_TYPES.UPDATE_GLOBAL_PROPERTIES,
      payload: {
        logging: {
          isLoggingEnabled: true,
          isLoggingEnabledForEachDataset: newValue,
          hasMixedNodeSettings: false,
        },
      },
    });

    if (window.allNodes) {
      const sourceAndTargetNodes = window.allNodes.filter(
        (node) => node.type === "source" || node.type === "target"
      );
      sourceAndTargetNodes.forEach((node) => {
        if (node.data) {
          node.data.enableCountLogging = newValue;
          if (typeof node.data.onDataChange === "function") {
            node.data.onDataChange({ enableCountLogging: newValue });
          }
          if (typeof node.data.setEnableCountLogging === "function") {
            node.data.setEnableCountLogging(newValue);
          }
          if (node.type === "source") {
            dispatch({
              type: ACTION_TYPES.UPDATE_SOURCE,
              payload: {
                id: node.id,
                data: { enableCountLogging: newValue },
              },
            });
          } else if (node.type === "target") {
            dispatch({
              type: ACTION_TYPES.UPDATE_TARGET,
              payload: {
                id: node.id,
                data: { enableCountLogging: newValue },
              },
            });
          }
        }
      });
      window.allNodesLastUpdate = Date.now();
      if (typeof window.updateReactFlowInstance === "function") {
        window.updateReactFlowInstance();
      }
    }
  };

  const handleEmailLoggingToggle = () => {
    const newValue = !emailLogging;
    setEmailLogging(newValue);

    dispatch({
      type: ACTION_TYPES.UPDATE_GLOBAL_PROPERTIES,
      payload: {
        email: {
          isEmailEnabled: newValue,
        },
      },
    });
  };

  return (
    <aside
      className={`
        z-20
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
        ${collapsed ? "w-20" : "w-[240px]"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-[#8E77BB]" />
            <span className="text-gray-800 text-sm font-bold">TRANSFORMATION</span>
          </div>
        )}
        <button
          className="p-1 rounded-md hover:bg-gray-200 transition"
          onClick={handleToggle}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div
        className={`p-3 ${
          collapsed ? "flex flex-col items-center space-y-3" : "space-y-4"
        }`}
      >
        {/* Divider for Components */}
        <div className="w-full mb-2">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Transformation Nodes
              </span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
          ) : (
            <div className="relative flex justify-center w-full mt-2 mb-4">
              <div className="w-12 h-px bg-gray-300 mt-3"></div>
              <div
                className="absolute w-6 h-6 rounded-full hover:bg-purple-100 bg-gray-100 flex items-center justify-center
                   border border-gray-300 mb-2 transition-transform duration-200 ease-in-out hover:scale-125"
                onMouseEnter={() => setIsHovering("nodes-label")}
                onMouseLeave={() => setIsHovering(null)}
              >
                <Layers className="w-3 h-3 text-gray-500" />
                {isHovering === "nodes-label" && (
                  <div
                    className="absolute left-full ml-2 top-0 -translate-y-1/2
                          bg-[#8E77BB] text-white text-xs px-2 py-1 rounded-md
                          whitespace-nowrap z-50 shadow-lg"
                  >
                    Transformation Nodes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nodes */}
        <div className={`${collapsed ? "space-y-3" : "space-y-2 mt-2"}`}>
          {components.map((item) => {
            const isTransformation = item.id === "transformation";
            const disabled = isTransformation && transformationExists;
            return (
              <div
                key={item.id}
                className={`flex items-center p-3 rounded-lg border border-gray-300 transition cursor-move hover:bg-purple-50 hover:border-purple-300 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                draggable={!disabled}
                onMouseEnter={() => setIsHovering(item.id)}
                onMouseLeave={() => setIsHovering(null)}
                onDragStart={(e) => onDragStart(e, item.id)}
                title={
                  disabled
                    ? "Only one Transformation node is allowed"
                    : undefined
                }
              >
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <item.icon className="w-5 h-5" style={{ color: "#8e77bb" }} />
                  {collapsed && isHovering === item.id && (
                    <div
                      className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                        bg-[#8E77BB] text-white text-xs px-2 py-1 rounded-md
                        whitespace-nowrap z-30 shadow-lg"
                    >
                      {item.name} +
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex items-center justify-between flex-grow">
                    <span className="text-gray-800 text-sm font-medium ml-3">
                      {item.name}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center ml-2">
                      <Plus className="w-3 h-3 text-purple-600" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider for Properties */}
        {!collapsed && (
          <div className="w-full mb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Properties
              </span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>
          </div>
        )}

        {/* Properties */}
        {!collapsed && (
          <div className="space-y-2 mt-2">
            <label className="flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 group border-solid border-2 border-gray-300">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-[#8E77BB] transition-colors" />
                </div>
                <span className="text-black text-sm ml-1">Count logging</span>
              </div>
              <input
                type="checkbox"
                checked={state.properties?.logging?.isLoggingEnabledForEachDataset || false}
                onChange={handleGlobalCountLoggingToggle}
                className="form-checkbox h-5 w-5 text-[#8E77BB] border-gray-300 rounded focus:ring-2 focus:ring-[#8E77BB]"
              />
            </label>

            <label className="flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 group border-solid border-2 border-gray-300">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                  <Mail className="w-4 h-4 text-[#8E77BB] transition-colors" />
                </div>
                <span className="text-black text-sm ml-1">Email logging</span>
              </div>
              <input
                type="checkbox"
                checked={emailLogging}
                onChange={handleEmailLoggingToggle}
                className="form-checkbox h-5 w-5 text-[#8E77BB] border-gray-300 rounded focus:ring-2 focus:ring-[#8E77BB]"
              />
            </label>
          </div>
        )}
      </div>
    </aside>
  );
};

const nodeTypes = [
  { type: "source", label: "Source" },
  { type: "transformation", label: "Transformation" },
  { type: "target", label: "Target" },
];

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
} from "lucide-react";
import { useTransformation } from "./TransformationContext";

const components = [
  { id: "source", name: "Source", icon: Database },
  { id: "transformation", name: "Transformation", icon: ArrowRightLeft },
  { id: "target", name: "Target", icon: Database },
];

export const TransformationSidebar = () => {
  const [expanded, setExpanded] = useState(true);
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
    setExpanded(!expanded);
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
    <div className="w-25 px-1 py-2 ml-0 overflow-y-auto h-fit bg-white rounded-lg shadow-lg">
      <div className="space-y-1">
        <div className="bg-white rounded-lg overflow-hidden">
          <button
            onClick={handleToggle}
            className="w-full flex items-center justify-between p-1 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
          >
            {expanded && (
              <div className="flex items-center space-x-2">
                <span className="text-black font-medium text-lg">
                  Components
                </span>
              </div>
            )}
            {expanded ? (
              <PanelLeftClose className="w-5 h-5 text-black" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-black" />
            )}
          </button>

          <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-gray-700">
            {components.map((item) => {
              const isTransformation = item.id === "transformation";
              const disabled = isTransformation && transformationExists;
              return (
                <button
                  key={item.id}
                  id={item.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-move hover:bg-gray-50 group border-solid border-2 ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  draggable={!disabled}
                  onDragStart={(e) => onDragStart(e, item.id)}
                  disabled={disabled}
                  title={
                    disabled
                      ? "Only one Transformation node is allowed"
                      : undefined
                  }
                >
                  <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                      <item.icon className="w-4 h-4 text-[#8E77BB] transition-colors" />
                    </div>
                    {expanded && (
                      <span className="text-black text-sm ml-1">{item.name}</span>
                    )}
                  </div>
                  <span
                    className={`rounded-md hover:bg-gray-200 ${
                      expanded && "ml-3"
                    }`}
                  >
                    <Plus className="h-4 text-gray-500" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {expanded && (
          <div className="bg-white rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-1 hover:bg-gray-750 transition-colors text-left border-l-4 border-transparent hover:border-[#8E77BB]"
            >
              <div className="flex items-center space-x-2">
                <span className="text-black font-medium text-lg">
                  Properties
                </span>
              </div>
            </button>

            <div className="grid grid-cols-1 gap-2 p-2 bg-gray-850 border-gray-700">
              <label className="flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 group border-solid border-2">
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

              <label className="flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-gray-50 group border-solid border-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = [
  { type: "source", label: "Source" },
  { type: "transformation", label: "Transformation" },
  { type: "target", label: "Target" },
];

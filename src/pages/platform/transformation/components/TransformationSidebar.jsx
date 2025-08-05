import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { debounceCountLogging } from '../utils/debounce';

const components = [
  { id: "source", name: "Source", icon: Database },
  { id: "transformation", name: "Transformation", icon: ArrowRightLeft },
  { id: "target", name: "Target", icon: Database },
];

export const TransformationSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const { state, dispatch, ACTION_TYPES } = useTransformation();

  const [globalCountLogging, setGlobalCountLogging] = useState(false);
  const [emailLogging, setEmailLogging] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);

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

  // FIXED: Debounced function for global count logging updates
  const debouncedGlobalUpdate = useMemo(() => {
    return debounceCountLogging((newValue) => {
      if (isUpdatingGlobal) return;

      setIsUpdatingGlobal(true);

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

      setTimeout(() => setIsUpdatingGlobal(false), 100);
    }, 150);
  }, [dispatch, ACTION_TYPES, isUpdatingGlobal]);

  // FIXED: Improved initialization from state with proper error handling
  useEffect(() => {
    try {
      const loggingState = state.properties?.logging?.isLoggingEnabledForEachDataset;
      const emailState = state.properties?.email?.isEmailEnabled;

      if (typeof loggingState === 'boolean' && loggingState !== globalCountLogging) {
        setGlobalCountLogging(loggingState);
      }

      if (typeof emailState === 'boolean' && emailState !== emailLogging) {
        setEmailLogging(emailState);
      }
    } catch (error) {
      console.warn('Error syncing sidebar state:', error);
    }
  }, [
    state.properties?.logging?.isLoggingEnabledForEachDataset,
    state.properties?.email?.isEmailEnabled
  ]);

  // FIXED: Improved node synchronization with debouncing
  useEffect(() => {
    if (!window.allNodes || isUpdatingGlobal) return;

    try {
      const allSourceAndTargetNodes = window.allNodes.filter(
        (node) => node.type === "source" || node.type === "target"
      );

      if (allSourceAndTargetNodes.length === 0) {
        if (globalCountLogging !== false) {
          setGlobalCountLogging(false);
        }
        return;
      }

      const allNodesWithLoggingEnabled = allSourceAndTargetNodes.every(
        (node) => node.data && node.data.enableCountLogging === true
      );

      const anyNodeWithLoggingEnabled = allSourceAndTargetNodes.some(
        (node) => node.data && node.data.enableCountLogging === true
      );

      const isRestoringNodes = allSourceAndTargetNodes.some(
        (node) => node.data && node.data._isRestoring
      );

      if (!isRestoringNodes && allNodesWithLoggingEnabled !== globalCountLogging) {
        setGlobalCountLogging(allNodesWithLoggingEnabled);

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
    } catch (error) {
      console.warn('Error in node synchronization:', error);
    }
  }, [
    window.allNodes?.length,
    window.allNodes?.map((n) => n.data?.enableCountLogging).join(","),
    forceUpdate,
    dispatch,
    ACTION_TYPES,
    globalCountLogging,
    isUpdatingGlobal
  ]);

  // FIXED: Improved global count logging toggle
  const handleGlobalCountLoggingToggle = useCallback(() => {
    if (isUpdatingGlobal) return;

    const newValue = !globalCountLogging;
    setGlobalCountLogging(newValue);

    // Use debounced function for the actual update
    debouncedGlobalUpdate(newValue);
  }, [globalCountLogging, debouncedGlobalUpdate, isUpdatingGlobal]);

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
                  checked={globalCountLogging}
                  onChange={handleGlobalCountLoggingToggle}
                  disabled={isUpdatingGlobal}
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

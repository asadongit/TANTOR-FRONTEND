import React, { useState, useEffect, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { X, Pencil, Code2, ArrowRight, ArrowRightLeft } from "lucide-react";
import { useTransformation } from "../TransformationContext";

export const TransformationNode = ({ id, data }) => {
  const [buttonHovered, setButtonHovered] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceColumns, setSourceColumns] = useState([]);
  const { state } = useTransformation();

  const [isConnected, setIsConnected] = useState({
    hasSource: false,
    hasTarget: false
  });

  useEffect(() => {
    setIsConnected({
      hasSource: data && data.sourceNodes && data.sourceNodes.length > 0,
      hasTarget: data && data.targetNodes && data.targetNodes.length > 0
    });

    const editMode = sessionStorage.getItem('editMode') === 'true';
    setIsEditMode(editMode);
  }, [data]);

  useEffect(() => {
    let columns = [];

    if (data && data.sourceNodes && data.sourceNodes.length > 0) {
      data.sourceNodes.forEach(sourceNode => {
        if (sourceNode && sourceNode.data && sourceNode.data.columns) {
          const nodeColumns = Array.isArray(sourceNode.data.columns)
            ? sourceNode.data.columns.map(col => typeof col === 'object' ? col.name : col)
            : [];
          columns = [...columns, ...nodeColumns];
        }
      });
    }

    if (state && state.selectedSourceColumnsSet) {
      Object.values(state.selectedSourceColumnsSet).forEach(columnSet => {
        if (columnSet instanceof Set) {
          columns = [...columns, ...Array.from(columnSet)];
        }
      });
    }

    columns = Array.from(new Set(columns.filter(Boolean)));
    setSourceColumns(columns);

    const hasColumns = columns.length > 0;
    setIsDataReady(hasColumns && isConnected.hasSource && isConnected.hasTarget);

  }, [data, state, id, isConnected]);

  const isButtonEnabled = isConnected.hasSource &&
                          isConnected.hasTarget &&
                          isDataReady &&
                          sourceColumns.length > 0;

  const handleTransformClick = useCallback(() => {
    if (!isButtonEnabled) return;


    if (window.openTransformationDrawer) {
      window.openTransformationDrawer(id);

      if (window.allNodes) {
        window.allNodes = window.allNodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                sourceColumns,
                isDataReady
              }
            };
          }
          return node;
        });
      }
    }
  }, [id, sourceColumns, isButtonEnabled, isDataReady]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[280px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <ArrowRightLeft className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Transformation</h3>
      </div>

      <div className="space-y-3">
        <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Code2 className="w-4 h-4 text-[#8E77BB] mr-2" />
              <span className="text-[11px] font-medium text-gray-700">Transform Data</span>
            </div>
            <div className="flex items-center text-[10px] text-gray-500">
              {isConnected.hasSource && (
                <span className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Source {data.connectedSources > 0 ? `(${data.connectedSources})` : ''}
                </span>
              )}
              {isConnected.hasSource && isConnected.hasTarget && (
                <span className="mx-1">•</span>
              )}
              {isConnected.hasTarget && (
                <span className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Target {data.connectedTargets > 0 ? `(${data.connectedTargets})` : ''}
                </span>
              )}
            </div>
          </div>

          <div className="mb-3 text-center">
            {!isConnected.hasSource && !isConnected.hasTarget ? (
              <p className="text-[10px] text-gray-500">
                Please connect both source and target nodes to start the transformation.
              </p>
            ) : !isConnected.hasSource ? (
              <p className="text-[10px] text-gray-500">
                Connect a source node to continue.
              </p>
            ) : !isConnected.hasTarget ? (
              <p className="text-[10px] text-gray-500">
                Connect a target node to complete the setup.
              </p>
            ) : !isDataReady && isEditMode ? (
              <p className="text-[10px] text-blue-600">
                Loading transformation data...
              </p>
            ) : !sourceColumns.length ? (
              <p className="text-[10px] text-amber-600">
                Waiting for source columns. Please select columns in your source node.
              </p>
            ) : (
              <p className="text-[10px] text-green-600">
                Ready to transform! Click the button below.
              </p>
            )}
          </div>

          <button
            className={`w-full py-2 px-3 rounded-md flex items-center justify-center transition-all duration-200 ${
              isButtonEnabled
                ? 'bg-[#8E77BB] text-white hover:bg-[#7d68a5] shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isButtonEnabled}
            onClick={handleTransformClick}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
          >
            <span className="mr-2">
              {!isDataReady && isEditMode ? 'Loading...' : 'Transform'}
            </span>
            {isDataReady && (
              <ArrowRight
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  buttonHovered && isButtonEnabled ? 'translate-x-1' : ''
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {data.sourceNodes && data.sourceNodes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-[10px] text-gray-500">
            Sources: {data.sourceNodes.map(node => node.dfId).join(', ')}
          </span>
        </div>
      )}
      {data.targetNodes && data.targetNodes.length > 0 && (
        <div className="mt-1">
          <span className="text-[10px] text-gray-500">
            Targets: {data.targetNodes.map(node => node.dfId).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

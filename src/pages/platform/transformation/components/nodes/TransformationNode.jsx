import React, { useState, useEffect } from "react";
import { Handle, Position, useEdges } from "reactflow";
import { X, Pencil, Code2, ArrowRight } from "lucide-react";

export const TransformationNode = ({ id, data }) => {
  const [isConnected, setIsConnected] = useState({
    hasSource: false,
    hasTarget: false
  });
  const [buttonHovered, setButtonHovered] = useState(false);
  const edges = useEdges();

  useEffect(() => {
    if (data.connectedSources !== undefined && data.connectedTargets !== undefined) {
      setIsConnected({
        hasSource: data.connectedSources > 0,
        hasTarget: data.connectedTargets > 0
      });
    } else {
      const hasSourceConnection = edges.some(edge => edge.target === id);
      const hasTargetConnection = edges.some(edge => edge.source === id);

      setIsConnected({
        hasSource: hasSourceConnection,
        hasTarget: hasTargetConnection
      });
    }
  }, [edges, id, data]);

  const isButtonEnabled = isConnected.hasSource && isConnected.hasTarget;

  const handleTransformClick = () => {
    if (isButtonEnabled && window.openTransformationDrawer) {
      window.openTransformationDrawer(id);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="flex items-center space-x-3 mb-3">
        <Pencil className="w-5 h-5 text-[#96CF7B]" />
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
            <span className="mr-2">Transform</span>
            <ArrowRight
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                buttonHovered && isButtonEnabled ? 'translate-x-1' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Display source and target dataframe IDs if available */}
      {data.sourceNodes && data.sourceNodes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-[10px] text-gray-500">
            Sources: {data.sourceNodes.map(node => node.dfId).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

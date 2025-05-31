import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X } from "lucide-react";

export function DefineNode({ id, data }) {
  // Destructure props from data for clarity.
  // RuleCanvas should provide these in the 'data' prop for the node.
  const {
    name: initialName,
    description: initialDescription,
    onDataChange,
    onDeleteNode // Specific delete handler for this node instance
  } = data;

  // Use refs to track if this is the first render
  const isFirstRender = useRef(true);

  const [currentName, setCurrentName] = useState(initialName || '');
  const [currentDescription, setCurrentDescription] = useState(initialDescription || '');

  // Only update local state from props on mount or if the node id changes
  useEffect(() => {
    setCurrentName(initialName || '');
    setCurrentDescription(initialDescription || '');
    isFirstRender.current = false;
  }, [id]); // Only when node id changes

  // When local state changes, notify parent
  useEffect(() => {
    if (!isFirstRender.current && onDataChange) {
      onDataChange({
        name: currentName,
        description: currentDescription,
        nodeType: 'define',
      });
    }
    // eslint-disable-next-line
  }, [currentName, currentDescription]);

  const handleNameChange = (e) => {
    setCurrentName(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setCurrentDescription(e.target.value);
  };

  const handleDeleteClick = () => {
    if (onDeleteNode) {
      onDeleteNode(id); // Use specific handler if provided
    } else if (window.deleteNode) {
      window.deleteNode(id); // Fallback to global deleteNode
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <button
        onClick={handleDeleteClick}
        className="absolute top-1.5 right-2 p-1"
        aria-label="Delete node"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="source" position={Position.Right} isConnectable={true} />

      <div className="flex items-center space-x-3 mb-3">
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Define</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label htmlFor={`${id}-name`} className="text-xs font-semibold text-black mb-0.5 block">Name</label>
          <input
            id={`${id}-name`}
            type="text"
            value={currentName}
            onChange={handleNameChange}
            placeholder="Rule Name"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="text-xs font-semibold text-black mb-0.5 block">Description</label>
          <input
            id={`${id}-description`}
            type="text"
            value={currentDescription}
            onChange={handleDescriptionChange}
            placeholder="Add Description"
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

DefineNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    onDataChange: PropTypes.func, // Essential: for notifying RuleCanvas of data changes
    onDeleteNode: PropTypes.func, // Recommended: for node-specific delete action
  }).isRequired,
};

export default DefineNode;

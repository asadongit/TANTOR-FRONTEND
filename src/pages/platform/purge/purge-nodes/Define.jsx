import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";
import { Handle, Position } from '@xyflow/react';
import { FilePlus, X } from "lucide-react";
import { usePurgeContext } from '../PurgeContext';
import { useAuth } from '../../../../context/AuthContext';
import axios from "axios";

export default function Define({ id, data }) {
  const { purgeData, updateNodeData } = usePurgeContext();
  const { token, hostnameV2 } = useAuth();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [baseName, setBaseName] = useState("");
  const prevSourceInfoRef = useRef(null);

  const fetchUniqueName = async (baseNameToUse) => {

    try {
      const response = await axios.get(`${hostnameV2}/autonamePrefill`, {
        params: { name: baseNameToUse, type: 'purge' },
        headers: { Authorization: `Bearer ${token}` },
      });
      const uniqueName = response.data.name;
      setName(uniqueName);
      updateNodeData(id, { name: uniqueName, baseName: baseNameToUse });
    } catch (error) {
      console.error("Error fetching unique purge name:", error);
    }
  };


  useEffect(() => {
    const nodeData = purgeData[id] || {};

    if (purgeData?.isEditMode) {
      if (nodeData.name && !name) {
        setName(nodeData.name);
        setBaseName(nodeData.baseName || nodeData.name);
      }
      if (nodeData.desc && !desc) {
        setDesc(nodeData.desc);
      }
      return;
    }

    const sourceNode = purgeData?.source;

    const currentSourceInfo = sourceNode && sourceNode.connection && sourceNode.schema && sourceNode.scope
      ? `${sourceNode.connection}_${sourceNode.schema}_${sourceNode.scope}`
      : null;

    if (currentSourceInfo) {
      if (prevSourceInfoRef.current !== currentSourceInfo) {
        prevSourceInfoRef.current = currentSourceInfo;
        setBaseName(currentSourceInfo);
        fetchUniqueName(currentSourceInfo);
        return;
      }
    }

    if (nodeData.name && !name) {
      setName(nodeData.name);
      setBaseName(nodeData.baseName || nodeData.name);
    }
    
    if (nodeData.desc && !desc) {
      setDesc(nodeData.desc);
    }
  }, [purgeData, id]);

  useEffect(() => {
    const nodeData = purgeData[id] || {};
    if (nodeData.desc !== desc && desc !== undefined) {
      updateNodeData(id, { desc });
    }
  }, [desc, id, updateNodeData]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setBaseName(newName);
  };

  const handleBlur = () => {
    if (!data?.isEdit && baseName && baseName.trim()) {
      fetchUniqueName(baseName);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[300px] max-w-[380px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10 }}
      />

      <div className="flex items-center space-x-3 mb-3">
        <FilePlus className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Define</h3>
      </div>

      <div className="mb-3 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Name<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Source Name"
          onChange={handleNameChange}
          onBlur={handleBlur}
          className={`border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-gray-500 ${data?.isEdit ? "cursor-not-allowed bg-gray-100" : ""}`}
          value={name}
          disabled={purgeData?.isEditMode}
        />
      </div>

      <div className="mb-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          placeholder="Add Description"
          onChange={(e) => setDesc(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm resize-y min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-gray-500"
          value={desc}
          disabled={purgeData?.isEditMode}
        />
      </div>
    </div>
  );
}

Define.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
};
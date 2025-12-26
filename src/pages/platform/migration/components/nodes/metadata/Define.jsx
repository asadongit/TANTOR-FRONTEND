import { Handle, Position } from '@xyflow/react';
import { FilePlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useMetadata } from "../../MetadataContext";
import { useAuth } from '../../../../../../context/AuthContext';
import axios from "axios";

export default function Define({ id }) {
  const { metadataData, updateMetadataNodeData } = useMetadata();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { decodedToken, token, hostnameV1, hostnameV2 } = useAuth();
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const fetchUniqueName = async (baseName) => {
    try {
      const response = await axios.get(`${hostnameV2}/autonamePrefill`, {
        params: { name: baseName, type: 'metadata' },
        headers: { Authorization: `Bearer ${token}` },
      });
      const uniqueName = response.data.name;
      setName(uniqueName);
      updateMetadataNodeData(id, { name: uniqueName });
    } catch (error) {
      console.error("Error fetching unique metadata name:", error);
    }
  };

  useEffect(() => {
    const nodeData = metadataData[id] || {};
    if (!nodeData.name) {
      const sourceNode = Object.values(metadataData).find((node) => node.type === "source");
      if (sourceNode && sourceNode.connection && sourceNode.schema) {
        const autoName = `${sourceNode.connection}_${sourceNode.schema}`;
        setIsAutoFilled(true);
        fetchUniqueName(autoName);
      }
    } else {
      setName(nodeData.name);
      setDescription(nodeData.description || "");
    }
  }, [metadataData, id, updateMetadataNodeData]);

  useEffect(() => {
    const nodeData = metadataData[id] || {};
    if (nodeData.name !== name || nodeData.description !== description) {
      const updatedData = { type: "define", name, description };
      updateMetadataNodeData(id, updatedData);
    }
  }, [id, name, description, updateMetadataNodeData]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    setIsAutoFilled(false);
  };

  const handleBlur = () => {
    fetchUniqueName(name);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[250px] max-w-[280px] relative group">
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10 }}
      />
      <div className="flex items-center space-x-3 mb-3">
        <FilePlus className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Define Metadata</h3>
      </div>

      <div className="mb-3 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Name<span className="text-red-500">*</span>
        </label>
        <input
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter Metadata name"
          value={name}
          onChange={handleNameChange}
          onBlur={handleBlur} // Check uniqueness on blur if auto-filled
        />
      </div>
      <div className="mb-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm resize-y min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}

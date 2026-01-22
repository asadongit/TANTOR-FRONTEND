import { Handle, Position } from '@xyflow/react';
import { useMigrationContext } from '../MigrationContext';
import { FilePlus } from "lucide-react";
import { useMigrationData } from '../../../../../hooks/platform/migration';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../../context/AuthContext';

export default function Define({ id }) {
  const { migrationData, updateNodeData } = useMigrationContext();

  const { token, hostnameV2 } = useAuth();
  const previousGeneratedMigrationName = useRef(null);

  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const fetchUniqueName = async (baseName) => {
    try {
      const response = await axios.get(`${hostnameV2}/autonamePrefill`, {
        params: { name: baseName, type: 'migration' },
        headers: { Authorization: `Bearer ${token}` },
      });
      const uniqueName = response.data.name;
      updateNodeData(id, { name: uniqueName });
    } catch (error) {
      console.error("Error fetching unique migration name:", error);
    }
  };

  // Migration Auto Name
  useEffect(() => {
    const connectionName = migrationData["source"]?.connection;
    const schemaName = migrationData["source"]?.schema;
    const scope = migrationData["source"]?.scope;

    if (!connectionName || !schemaName || !scope) return;

    const currentName = migrationData[id]?.name;

    if (currentName && !isAutoFilled) return;

    const autoName = `${connectionName}_${schemaName}_${scope}`;

    if (previousGeneratedMigrationName.current === autoName) return;

    previousGeneratedMigrationName.current = autoName;
    fetchUniqueName(autoName);
    setIsAutoFilled(true);

  }, [
    migrationData["source"]?.connection,
    migrationData["source"]?.schema,
    migrationData["source"]?.scope
  ]);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[300px] max-w-[380px] relative group">
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
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter Migration name"
          value={migrationData[id]?.name || ''}
          onChange={e => {
            updateNodeData(id, { name: e.target.value });
            setIsAutoFilled(false);
          }}
        />
      </div>
      <div className="mb-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm resize-y min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter description"
          value={migrationData[id]?.description || ''}
          onChange={e => updateNodeData(id, { description: e.target.value })}
        />
      </div>
    </div>
  );
}

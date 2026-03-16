import { Handle, Position } from '@xyflow/react';
import { Database, X } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useConnections, useSchemas } from '../../../../cdc/hooks/DataFetch';
import { useMetadata } from '../../MetadataContext';
import SelectWithSearch from '../../shared/SelectWithSearch';
import { toast } from 'react-hot-toast';

const Target = ({ id }) => {
  const { metadataData, updateMetadataNodeData } = useMetadata();
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedSchema, setSelectedSchema] = useState('');
  const [settings, setSettings] = useState('As is');
  const [settingsValue, setSettingsValue] = useState('');
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
  const [transformedTables, setTransformedTables] = useState([]);

  const { data: connections, isLoading: isLoadingConnections } = useConnections('target');
  const { data: schemas, isLoading: isLoadingSchemas } = useSchemas(selectedConnection);

  const sourceNode = useMemo(() => {
    return Object.values(metadataData).find((node) => node.type === 'source');
  }, [metadataData]);

  const sourceTables = useMemo(() => {
    return sourceNode?.bulk_list || [];
  }, [sourceNode]);

  // useEffect(() => {
  //   const nodeData = metadataData[id] || {};
  //   setSelectedConnection(nodeData.connection || '');
  //   setSelectedSchema(nodeData.schema || '');
  //   setSettings(nodeData.settings || 'As is');
  //   setSettingsValue(nodeData.settingsValue || '');
  // }, [metadataData, id]);

const [cloneApplied, setCloneApplied] = useState(false);

useEffect(() => {
  if (metadataData?.action !== "CLONE") {
    setCloneApplied(true);
    return;
  }
  if (!connections?.length) return;

  const existingTargetData = metadataData?.target;
  if (!existingTargetData) return;

  const match = connections.find(c => c.connection_name === existingTargetData.connection) || null;
  setSelectedConnectionObj(match);
  setSelectedConnection(existingTargetData.connection || "");
  setSelectedSchema(existingTargetData.schema || "");
  setSettings(existingTargetData.settings || "As is");
  setSettingsValue(existingTargetData.settingsValue || "");
  setCloneApplied(true);

}, [metadataData?.action, metadataData?.target, connections]);

  useEffect(() => {
    if (!cloneApplied) return;
    
    const transformed = sourceTables.map((table) => {
      let newName = `${selectedSchema}.${table}`;
      if (settings === 'Prefix' && settingsValue) {
        newName = `${selectedSchema}.${settingsValue}${table}`;
      } else if (settings === 'Suffix' && settingsValue) {
        newName = `${selectedSchema}.${table}${settingsValue}`;
      }
      return { source: table, target: newName };
    });
    setTransformedTables(transformed);

    updateMetadataNodeData(id, {
      type: 'target',
      connection: selectedConnection,
      target_conn_id: selectedConnectionObj?.connection_id,
      connection_type: selectedConnectionObj?.connection_type,
      schema: selectedSchema,
      settings,
      settingsValue,
      transformedTables: transformed,
    });
  }, [settings, settingsValue, sourceTables, selectedConnection, selectedSchema, id, updateMetadataNodeData]);

  const handleSelectConnection = (connection) => {
    setSelectedConnectionObj(connection);
    setSelectedConnection(connection.connection_name);
    setSelectedSchema('');
  };

  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName);
  };

  const handleSettingsChange = (event) => {
    setSettings(event.target.value);
  };

  const handleSettingsValueChange = (event) => {
    const newValue = event.target.value;
    if (newValue.length > 8) {
      toast.error("Prefix/Suffix length cannot exceed 8 characters.");
      return;
    }
    if (settings === 'Prefix' || settings === 'Suffix') {
      if (/^\d/.test(newValue)) {
        const corrected = 'T' + newValue.substring(1);
        setSettingsValue(corrected);
        toast.error("Prefix cannot start with a number. Changed first character to 'T'.");
        return;
      }
      if (/^\s/.test(newValue)) {
        toast.error("Prefix/Suffix cannot start with spaces.");
        return;
      }
      if (/^[^a-zA-Z0-9_]/.test(newValue)) {
        toast.error("Prefix/Suffix cannot start with special characters.");
        return;
      }
      if (/[^a-zA-Z0-9_]/.test(newValue)) {
        toast.error("Prefix/Suffix cannot contain special characters.");
        return;
      }
    }
    setSettingsValue(newValue);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Database className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Target</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-black mb-1 block">Connection</label>
          <SelectWithSearch
            options={connections || []}
            placeholder="Select Connection"
            labelKey="connection_name"
            valueKey="connection_id"
            onSelect={handleSelectConnection}
            value={selectedConnectionObj?.connection_id}
            disabled={isLoadingConnections}
            isLoading={isLoadingConnections}
            loadingText="Loading connections..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black mb-1 block">Schema</label>
          <SelectWithSearch
            options={schemas || []}
            placeholder="Select Schema"
            labelKey="table_schema"
            valueKey="table_schema"
            onSelect={(schema) => handleSelectSchema(schema.table_schema)}
            value={selectedSchema}
            disabled={!selectedConnection || isLoadingSchemas}
            isLoading={isLoadingSchemas}
            loadingText="Loading schemas..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-black mb-1 block">Settings</label>
          <select
            className="w-full p-1 text-sm bg-white rounded border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            value={settings}
            onChange={handleSettingsChange}
          >
            <option value="As is">As is</option>
            <option value="Prefix">Prefix</option>
            <option value="Suffix">Suffix</option>
          </select>
        </div>

        {settings !== 'As is' && (
          <div>
            <label className="text-xs font-medium text-black mb-2 block">Value <span className='text-gray-500'>(Max Length 8 Characters)</span> </label>
            <input
              type="text"
              className="w-full p-1 text-sm bg-white rounded border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
              value={settingsValue}
              onChange={handleSettingsValueChange}
              placeholder="Enter value"
              maxLength="8"
            />
          </div>
        )}

        {selectedConnection && selectedSchema && (
          <div>
            <div className="text-sm font-medium text-black mb-2">Transformed Tables</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transformedTables.map((table, idx) => (
                <div key={idx} className="flex py-1">
                  <span className="text-sm text-black font-semibold">{table.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Target;


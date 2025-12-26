import { Handle, Position } from '@xyflow/react';
import { Database, X, Pencil } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useConnections, useSchemas, useTables } from '../../../../cdc/hooks/DataFetch';
import SelectWithSearch from '../../shared/SelectWithSearch';
import { useMetadata } from '../../MetadataContext';

const Source = ({ id, data, selected }) => {
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedConnectionObj, setSelectedConnectionObj] = useState(null);
  const { updateMetadataNodeData } = useMetadata();

  const { data: connections, isLoading: isLoadingConnections } = useConnections('source');
  const { data: schemas, isLoading: isLoadingSchemas } = useSchemas(selectedConnection);
  const { data: tables, isLoading: isLoadingTables } = useTables(selectedConnection, selectedSchema);

  const filteredTables = useMemo(() => {
    if (!tables || !Array.isArray(tables)) return [];
    return tables
      .filter((table) => table && table.source_table)
      .filter((table) =>
        table.source_table.toLowerCase().includes(searchTerm?.toLowerCase() || "")
      );
  }, [tables, searchTerm]);

  useEffect(() => {
    const nodeData = data || {};
    const hasChanges =
      nodeData.connection !== selectedConnection ||
      nodeData.schema !== selectedSchema ||
      JSON.stringify(nodeData.bulk_list) !== JSON.stringify(selectedItems) ||
      nodeData.source_conn_id !== selectedConnectionObj?.connection_id ||
      nodeData.source_conn_type !== selectedConnectionObj?.connection_type;

    if (hasChanges) {
      const updatedData = {
        type: "source",
        connection: selectedConnection,
        schema: selectedSchema,
        bulk_list: selectedItems,
        source_conn_id: selectedConnectionObj?.connection_id ?? null,
        source_conn_type: selectedConnectionObj?.connection_type ?? null,
      };
      updateMetadataNodeData(id, updatedData);
    }
  }, [selectedConnection, selectedSchema, selectedItems, selectedConnectionObj, id, updateMetadataNodeData, data]);

  const handleSelectConnection = (connection) => {
    setSelectedConnectionObj(connection);
    setSelectedConnection(connection.connection_name);
    setSelectedSchema("");
    setSelectedItems([]);
  };

  const handleSelectSchema = (schemaName) => {
    setSelectedSchema(schemaName);
    setSelectedItems([]);
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const validTables = filteredTables.filter((table) => table !== null);
      setSelectedItems(validTables.map((item) => item.source_table));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelection = (checked, table) => {
    setSelectedItems((prev) => {
      if (checked) {
        return [...prev, table];
      } else {
        return prev.filter((item) => item !== table);
      }
    });
  };

  const areAllSelected =
    filteredTables.length > 0 &&
    selectedItems.length === filteredTables.filter((table) => table !== null).length;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group">
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>

      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />

      <div className="flex items-center space-x-3 mb-3">
        <Database className="w-5 h-5 text-[#8E77BB]" />
        <h3 className="text-black font-medium">Source</h3>
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

        {filteredTables.length > 0 ? (
          <div>
            <div className="my-2">
              <div className="text-sm font-medium text-black mb-2">Data Set</div>
              <input
                type="search"
                placeholder="Search datasets..."
                className="w-full p-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {isLoadingTables ? (
                <div>Loading tables...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="select-all"
                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={areAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      <label htmlFor="select-all" className="text-sm font-semibold text-black">
                        Select all
                      </label>
                    </div>
                  </div>
                  {filteredTables.map((table, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`table-${idx}`}
                          checked={selectedItems.includes(table.source_table)}
                          onChange={(e) => handleItemSelection(e.target.checked, table.source_table)}
                          className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor={`table-${idx}`} className="text-sm font-semibold text-black">
                          {table.source_table}
                        </label>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No datasets found.</div>
        )}
      </div>
    </div>
  );
};

export default Source;

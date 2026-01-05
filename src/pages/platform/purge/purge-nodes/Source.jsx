import { Handle, Position } from '@xyflow/react';
import { Database, X, Pencil } from 'lucide-react';
import { usePurgeContext } from '../PurgeContext';
import { useEffect, useState } from 'react';
import SelectWithSearch from '../../migration/components/shared/SelectWithSearch';
import {
  useConnections,
  useSchemas,
  useTables,
} from "../../cdc/hooks/DataFetch";
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios';

export default function Source({ id }) {
  const { purgeData, updateNodeData } = usePurgeContext();

  const { data: connections, isLoading: isLoadingConnections } = useConnections("source");
  const { data: schemas, isLoading: isLoadingSchemas } = useSchemas(purgeData[id]?.connection);
  const { data: tables } = useTables(purgeData[id]?.connection, purgeData[id]?.schema, "bulk");

  const [subsetTables, setSubsetTables] = useState([]);

  const { token, hostnameV1 } = useAuth();

  const fetchTablesSubset = async () => {
    const connectionName = purgeData[id]?.connection || "";
    const schemaName = purgeData[id]?.schema || "";

    if (!connectionName || !schemaName) return;

    try {
      const response = await axios.get(
        `${hostnameV1}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.map((item) => ({
        ...item,
        source_table: item.table_name
      }));

      setSubsetTables(data);
    } catch (error) {
      console.error("Error fetching tables:", error);
      return [];
    }
  };

  useEffect(() => {
    if (purgeData[id]?.scope === "subset") {
      fetchTablesSubset();
    }
  }, [purgeData[id]?.scope, purgeData[id]?.connection, purgeData[id]?.schema]);

  const handleSelectConnection = (connection) => {
    if (!connection)
      updateNodeData(id, {
        connection: null,
        connection_id: null,
        connection_type: null,
        schema: null,
        scope: null,
        sourceid: null,
      });
    else
      updateNodeData(id, {
        connection: connection["connection_name"],
        connection_id: connection["connection_id"],
        connection_type: connection.connection_type,
        schema: null,
        scope: null,
        sourceid: connection["connection_id"],
      });
  };

  const handleSelectSchema = (schema) => {
    if (!schema) updateNodeData(id, { schema: null });
    else updateNodeData(id, { schema: schema });
  };

  const handleScopeChange = (scope) => {
    updateNodeData(id, {
      scope,
      sourceTables: scope === "bulk" ? [] : undefined,
      sourceTable: scope === "subset" ? null : undefined
    });
  };

  const handleBulkTableSelection = (tableMetadata) => {
    const tableName = tableMetadata.source_table;
    if (!tableName) return;

    let updatedSourceTables = purgeData[id]?.sourceTables ? [...purgeData[id].sourceTables] : [];

    if (updatedSourceTables.includes(tableName)) {
      updatedSourceTables = updatedSourceTables.filter(st => st !== tableName);
    } else {
      updatedSourceTables.push(tableName);
    }

    updateNodeData(id, { sourceTables: updatedSourceTables });
  };

  const handleSubsetTableSelection = (tableMetadata) => {
    const tableName = tableMetadata.source_table;
    if (!tableName) return;

    const existingSourceTable = purgeData[id]?.sourceTable || "";
    if (existingSourceTable && existingSourceTable === tableName)
      updateNodeData(id, { sourceTable: null });
    else
      updateNodeData(id, { sourceTable: tableName });
  };

  const [tableSearchTerm, setTableSearchTerm] = useState('');

  const getFilteredTables = () => {
    if (purgeData[id]?.scope === "bulk") {
      return tables ? tables.filter(table =>
        table.source_table.toLowerCase().includes(tableSearchTerm.toLowerCase())
      ) : [];
    } else if (purgeData[id]?.scope === "subset") {
      return subsetTables ? subsetTables.filter(table =>
        table.source_table.toLowerCase().includes(tableSearchTerm.toLowerCase())
      ) : [];
    }
    return [];
  };
  const filteredTables = getFilteredTables();

  const isSubsetFilterButtonDisabled = (table) => {
    return !purgeData[id]?.sourceTable ||
      !purgeData["target"]?.targetTable ||
      purgeData[id]?.sourceTable !== table.source_table;
  };

  const isBulkFilterButtonDisabled = (table) => {
    const targetToSourceMapping =
      purgeData?.target?.targetToSourceMapping ?? [];

    if (!targetToSourceMapping.length) {
      return true;
    }

    return !targetToSourceMapping.some(
      ({ sourceTable }) => sourceTable === table.source_table
    );
  };

  return (
    <div
      className="bg-white text-black rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[320px] relative group"
    >
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

      <div className="mb-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Connection
        </label>
        <SelectWithSearch
          options={connections || []}
          placeholder="Select Connection"
          labelKey="connection_name"
          valueKey="connection_id"
          onSelect={(connection) => handleSelectConnection(connection)}
          value={purgeData[id]?.connection_id}
          isLoading={isLoadingConnections}
          loadingText="Loading connections..."
        />

        <label className="block text-sm font-semibold text-gray-700 mb-1 mt-2">
          Schema
        </label>
        <SelectWithSearch
          options={schemas || []}
          placeholder="Select Schema"
          labelKey="table_schema"
          valueKey="table_schema"
          onSelect={(schema) => handleSelectSchema(schema.table_schema)}
          value={purgeData[id]?.schema}
          disabled={!purgeData[id]?.connection || isLoadingSchemas}
          isLoading={isLoadingSchemas}
          loadingText="Loading schemas..."
        />
      </div>

      <div className="mt-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1 mt-2">
          Purge Scope
        </label>
        <div className="flex gap-4">
          <div className="flex items-center">
            <input type="radio" id={`table-bulk-${id}`} value="bulk" checked={purgeData[id]?.scope === "bulk"} onChange={() => handleScopeChange("bulk")} disabled={!(purgeData[id]?.connection && purgeData[id]?.schema)} />
            <label className='ml-1'>Bulk</label>
          </div>
          <div className="flex items-center">
            <input type="radio" id={`table-subset-${id}`} value="subset" checked={purgeData[id]?.scope === "subset"} onChange={() => handleScopeChange("subset")} disabled={!(purgeData[id]?.connection && purgeData[id]?.schema)} />
            <label className='ml-1'>Subset</label>
          </div>
        </div>
      </div>

      {(purgeData[id]?.scope === "bulk" || purgeData[id]?.scope === "subset") && (
        <div className="mt-3">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Search Tables
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Search table names"
            value={tableSearchTerm}
            onChange={(e) => setTableSearchTerm(e.target.value)}
          />
        </div>
      )}

      {purgeData[id]?.scope === "bulk" && (
        <div className="max-h-48 overflow-y-auto space-y-2 mt-3">
          {filteredTables.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id={`select-all-${id}`}
                    className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    checked={filteredTables.length > 0 && filteredTables.every(t => purgeData[id]?.sourceTables?.includes(t.source_table))}
                    onChange={(e) => {
                      const isChecked = e.target.checked;

                      if (isChecked) {
                        const allTableNames = filteredTables.map(t => t.source_table);
                        updateNodeData(id, { sourceTables: [...(purgeData[id]?.sourceTables || []), ...allTableNames.filter(name => !purgeData[id]?.sourceTables?.includes(name))] });
                      } else {
                        const filteredNames = filteredTables.map(t => t.source_table);
                        updateNodeData(id, { sourceTables: (purgeData[id]?.sourceTables || []).filter(name => !filteredNames.includes(name)) });
                      }
                    }}
                  />
                  <label
                    htmlFor={`select-all-${id}`}
                    className="text-sm font-semibold text-black"
                  >
                    Select all
                  </label>
                </div>
              </div>
              {filteredTables.map((table, idx) => {
                const isDisabled = isBulkFilterButtonDisabled(table);

                return (
                  <div
                    key={`table-row-bulk-${idx}`}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`table-${id}-${idx}`}
                        checked={purgeData[id]?.sourceTables?.includes(table.source_table)}
                        onChange={() => handleBulkTableSelection(table)}
                        className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`table-${id}-${idx}`}
                        className="text-sm font-semibold text-black"
                      >
                        {table.source_table}
                      </label>
                    </div>

                    <button
                      onClick={() => window.openDrawer?.(table)}
                      disabled={isDisabled}
                      className={`
                        ${isDisabled
                          ? "text-gray-500 cursor-not-allowed"
                          : "text-purple-600 hover:text-purple-700"}
                        `}
                      aria-label={`Edit ${table.source_table}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-sm text-gray-700 text-center py-4">
              No Tables Available
            </div>
          )}
        </div>
      )}

      {purgeData[id]?.scope === "subset" && (
        <div className="max-h-48 overflow-y-auto space-y-2 mt-3">
          {filteredTables.length > 0 ? (
            filteredTables.map((table, idx) => {
              const isDisabled = isSubsetFilterButtonDisabled(table);
              return (
                <div
                  key={`table-row-subset-${idx}`}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`table-subset-${id}-${idx}`}
                      checked={purgeData[id]?.sourceTable === table.source_table}
                      onChange={() => handleSubsetTableSelection(table)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label
                      htmlFor={`table-subset-${id}-${idx}`}
                      className="text-sm font-semibold text-black"
                    >
                      {table.source_table}
                    </label>
                  </div>

                  <button
                    onClick={() => window.openDrawer?.(table)}
                    disabled={isDisabled}
                    className={`
                       ${isDisabled
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-purple-600 hover:text-purple-700"}
                      `}
                    aria-label={`Edit ${table.source_table}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-700 text-center py-4">
              No Tables Available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

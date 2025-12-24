import { Handle, Position } from '@xyflow/react';
import { useMigrationContext } from '../MigrationContext';
import { Database, X, Pencil } from 'lucide-react';
import {
  useConnections,
  useSchemaCount,
  useSchemas,
  useTables,
  useBulkTables,
} from "../../../cdc/hooks/DataFetch";
import SelectWithSearch from '../shared/SelectWithSearch';
import { useEffect, useState } from 'react';

export default function Target({ id }) {
  const { migrationData, updateNodeData } = useMigrationContext();

  const { data: connections, isLoading: isLoadingConnections } = useConnections("target");
  const { data: schemas, isLoading: isLoadingSchemas } = useSchemas(migrationData[id]?.connection);
  const { data: bulkTables = [] } = useBulkTables(migrationData["source"]?.connection, migrationData[id]?.connection, migrationData["source"]?.schema);
  const { data: subsetTables = [] } = useTables(migrationData[id]?.connection, migrationData[id]?.schema, "subset");

  const [tableSearchTerm, setTableSearchTerm] = useState('');

  const handleSelectConnection = (connection) => {
    if (!connection)
      updateNodeData(id, {
        connection: null,
        connection_id: null,
        connection_type: null,
        schema: null
      });
    else
      updateNodeData(id, {
        connection: connection["connection_name"],
        connection_id: connection["connection_id"],
        connection_type: connection.connection_type,
        schema: null,
      });
  }

  const handleSelectSchema = (schema) => {
    if (!schema)
      updateNodeData(id, { schema: null });
    else
      updateNodeData(id, { schema: schema });
  };

  // I have used .split because our metadata stores target table in schema.table format.
  const filterBulkTablesBasedOnSourceTableAndTargetSchema = () => {
    const selectedSourceTables = migrationData?.source?.sourceTables || [];
    const selectedSchema = migrationData[id]?.schema;

    if (!selectedSourceTables.length || !selectedSchema) return [];

    return bulkTables
      .filter(bt => selectedSourceTables.includes(bt.source_table))
      .map(ft => ({
        ...ft,
        target_tables: ft.target_tables.filter(
          tt => tt.split(".")[0] === selectedSchema
        ),
      }));
  };

  const handleParentBulkTableSelect = (bulkTable) => {
    if (!bulkTable?.source_table) return;

    const sourceTable = bulkTable.source_table;
    const targetTables = bulkTable.target_tables || [];

    const existingMappings = migrationData[id]?.targetToSourceMapping || [];

    const existingTargetsForSource = existingMappings
      .filter(m => m.sourceTable === sourceTable)
      .map(m => m.targetTable);

    const allTargetsAlreadySelected = targetTables.every(tt =>
      existingTargetsForSource.includes(tt)
    );

    let updatedMappings;

    if (allTargetsAlreadySelected) {
      updatedMappings = existingMappings.filter(
        m =>
          m.sourceTable !== sourceTable ||
          !targetTables.includes(m.targetTable)
      );
    } else {
      const newMappings = targetTables
        .filter(tt => !existingTargetsForSource.includes(tt))
        .map(tt => ({
          sourceTable,
          targetTable: tt,
        }));

      updatedMappings = [...existingMappings, ...newMappings];
    }

    updateNodeData(id, {
      targetToSourceMapping: updatedMappings,
    });
  };

  const handleSingleBulkTableSelect = (sourceTable, targetTable) => {
    if (!sourceTable || !targetTable) return;

    const existingMappings =
      migrationData[id]?.targetToSourceMapping || [];

    const mappingExists = existingMappings.some(
      m =>
        m.sourceTable === sourceTable &&
        m.targetTable === targetTable
    );

    let updatedMappings;

    if (mappingExists) {
      updatedMappings = existingMappings.filter(
        m =>
          !(
            m.sourceTable === sourceTable &&
            m.targetTable === targetTable
          )
      );
    } else {
      updatedMappings = [
        ...existingMappings,
        {
          sourceTable,
          targetTable,
        },
      ];
    }

    updateNodeData(id, {
      targetToSourceMapping: updatedMappings,
    });
  };

  const handleSubsetTableSelection = (tableMetadata) => {
    const tableName = tableMetadata.source_table;
    if (!tableName) return;

    const existingTargetTable = migrationData[id]?.targetTable || "";
    if (existingTargetTable && existingTargetTable === tableName)
      updateNodeData(id, { targetTable: null });
    else
      updateNodeData(id, { targetTable: tableName });
  }

  const isParentChecked = (bulkTable) => {
    const mappings = migrationData[id]?.targetToSourceMapping || [];

    return bulkTable.target_tables.every(tt =>
      mappings.some(
        m =>
          m.sourceTable === bulkTable.source_table &&
          m.targetTable === tt
      )
    );
  };

  const isTargetChecked = (sourceTable, targetTable) => {
    const mappings = migrationData[id]?.targetToSourceMapping || [];

    return mappings.some(
      m =>
        m.sourceTable === sourceTable &&
        m.targetTable === targetTable
    );
  };

  const filteredBulkTables = filterBulkTablesBasedOnSourceTableAndTargetSchema();


  const searchFilteredBulkTables = filteredBulkTables.filter(table =>
    table.source_table.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    table.target_tables.some(tt => tt.toLowerCase().includes(tableSearchTerm.toLowerCase()))
  );

  const searchFilteredSubsetTables = subsetTables.filter(table =>
    table.source_table.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] min-w-[320px] max-w-[500px] relative group">
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
        <h3 className="text-black font-medium">Target</h3>
      </div>
      <div className="mb-1 w-full">
        {/* Target Connection */}
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Connection
        </label>
        <SelectWithSearch
          options={connections || []}
          placeholder="Select Connection"
          labelKey="connection_name"
          valueKey="connection_id"
          onSelect={(connection) => handleSelectConnection(connection)}
          value={migrationData[id]?.connection_id}
          isLoading={isLoadingConnections}
          loadingText="Loading connections..."
        />

        {/* Target Schema */}
        <label className="block text-sm font-semibold text-gray-700 mb-1 mt-2">
          Schema
        </label>
        <SelectWithSearch
          options={schemas || []}
          placeholder="Select Schema"
          labelKey="table_schema"
          valueKey="table_schema"
          onSelect={(schema) => handleSelectSchema(schema.table_schema)}
          value={migrationData[id]?.schema}
          disabled={!migrationData[id]?.connection || isLoadingSchemas}
          isLoading={isLoadingSchemas}
          loadingText="Loading schemas..."
        />

        {migrationData["source"]?.scope === "bulk" && searchFilteredBulkTables.length > 0 && (
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

        {migrationData["source"]?.scope === "subset" && subsetTables.length > 0 && (
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

        {/* Bulk Tables when Scope == bulk */}
        {migrationData["source"]?.scope === "bulk" && (
          <div className="space-y-3 mt-3">
            {searchFilteredBulkTables.map((filteredBulkTable, idx) => (
              <div
                key={`bulk-source-${idx}`}
                className="border border-gray-200 rounded-md p-3 bg-white"
              >
                {/* Source table */}
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    type="checkbox"
                    checked={isParentChecked(filteredBulkTable)}
                    onChange={() => handleParentBulkTableSelect(filteredBulkTable)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor={`source-${idx}`}
                    className="text-sm font-semibold text-black"
                  >
                    {filteredBulkTable.source_table}
                  </label>
                </div>

                {/* Target tables */}
                <div className="ml-6 space-y-2">
                  {filteredBulkTable.target_tables.map((tt, id) => (
                    <div
                      key={`target-${idx}-${id}`}
                      className="flex items-start space-x-3"
                    >
                      <input
                        type="checkbox"
                        id={`target-${idx}-${id}`}
                        checked={isTargetChecked(filteredBulkTable.source_table, tt)}
                        onChange={() =>
                          handleSingleBulkTableSelect(
                            filteredBulkTable.source_table,
                            tt
                          )
                        }
                        className="h-4 w-4 mt-0.5 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`target-${idx}-${id}`}
                        className="text-sm text-gray-700 flex-1 break-all"
                      >
                        {tt}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {searchFilteredBulkTables.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No Tables Available
              </div>
            )}
          </div>
        )}

        {/* Subset Tables when scope == subset */}
        {migrationData["source"]?.scope === "subset" && (
          <div className="max-h-48 overflow-y-auto space-y-2 mt-3">
            {searchFilteredSubsetTables.length > 0 ? (
              searchFilteredSubsetTables.map((table, idx) => (
                <div
                  key={`table-row-subset-${idx}`}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`table-${idx}`}
                      checked={migrationData[id]?.targetTable === table.source_table}
                      onChange={() => handleSubsetTableSelection(table)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label
                      htmlFor={`table-${idx}`}
                      className="text-sm font-semibold text-black"
                    >
                      {table.source_table}
                    </label>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No Tables Available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
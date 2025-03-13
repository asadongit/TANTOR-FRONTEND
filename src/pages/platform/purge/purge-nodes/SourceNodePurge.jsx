import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X, Search, Pencil } from "lucide-react";
import { useTableContext } from '../../react-flow/context/TableContext';

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
  </div>
);

export function SourceNode({ id }) {
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const [connections, setConnections] = useState([]);
  const [schemaCount, setSchemacount] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [schemas, setSchema] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);  
  const { openDrawer } = useTableContext();  

  

  let connectionsData;
  let schemacount;
  let schemadetails;
  let tabledetails;

  const fetchOptions = useCallback(async () => {
    try {
      const cachedconnectionResponse =
        sessionStorage.getItem("connectionResponse");
      if (cachedconnectionResponse) {
        connectionsData = JSON.parse(cachedconnectionResponse);
      } else {
        const connectionResponse = await fetch(`${hostname}/connection-saves`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        connectionsData = await connectionResponse.json();
        sessionStorage.setItem(
          "connectionResponse",
          JSON.stringify(connectionsData)
        );
      }



      setConnections(connectionsData);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  const fetchschemacount = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchemacount([]); // Clear schemas when no connection selected
        return;
      }

    //   setSchemaLoading(true);

      try {

        const cachedschemacount =
        sessionStorage.getItem("schemacount");
      if (cachedschemacount) {
        schemacount = JSON.parse(cachedschemacount);
      } else {

        const response = await fetch(`${hostname}/schema/${connectionName}/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        schemacount = await response.json();
        sessionStorage.setItem(
            "schemacount",
            JSON.stringify(schemacount)
          );
        }
        setSchemacount(schemacount);
        // setSchemaLoading(false);
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setSchemacount([]); // Clear schemas on error
      }
    },
    [hostname, token]
  );


  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fetchschema = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchema([]); // Clear schemas when no connection selected
        return;
      }

      setSchemaLoading(true);

      try {

        const cachedschemalist =
        sessionStorage.getItem("schemalist");
      if (cachedschemalist) {
        schemadetails = JSON.parse(cachedschemalist);
      } else {

        const response = await fetch(`${hostname}/schema/${connectionName}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        schemadetails = await response.json();
        sessionStorage.setItem(
            "schemalist",
            JSON.stringify(schemadetails)
          );
        }
        setSchema(schemadetails);
        setSchemaLoading(false);
      } catch (error) {
        console.error("Error fetching schemas:", error);
        setSchema([]); // Clear schemas on error
      }
    },
    [hostname, token]
  );

  const fetchTables = useCallback(
    async (connectionName, schemaName) => {
      if (!connectionName || !schemaName) return;

      setLoading(true);
      try {

        const cachedtablelist =
        sessionStorage.getItem("tablelist");
      if (cachedtablelist) {
        tabledetails = JSON.parse(cachedtablelist);
      } else {
        const fetchTableResponse = await fetch(
          `${hostname}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!fetchTableResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchTableResponse.status}`);
        }

        tabledetails = await fetchTableResponse.json();
        sessionStorage.setItem(
            "tablelist",
            JSON.stringify(tabledetails)
          );
        }
        setTables(tabledetails);
        console.log("table details on source node", tabledetails)
      } catch (error) {
        console.error("Error fetching tables:", error);
        setTables([]); // Clear tables on error
      } finally {
        setLoading(false);
      }
    },
    [hostname, token]
  );


  const filteredTables = tables.filter((table) =>
    table.table_name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );


  return (
    <div
      className="bg-white rounded-lg p-4 shadow-md border-2 border-[#8E77BB] 
                             w-fit min-w-min max-w-[90vw] 
                             relative group 
                             grid grid-cols-[repeat(auto-fit,minmax(min-content,1fr))] 
                             "
    >
      <button
        onClick={() => window.deleteNode?.(id)}
        className="absolute top-1.5 right-2 p-1"
      >
        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </button>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center space-x-3 mb-3">
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>
      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Connection
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedConnection}
            onChange={(e) => {
              const connectionName = e.target.value;
              setSelectedConnection(connectionName);
              setSelectedSchema(""); // Reset schema selection
              setTables([]); // Clear previous tables
              fetchschema(connectionName);
              fetchschemacount(connectionName); 
            }}
          >
            <option value="">Select</option>
            {connections.map((connection, idx) => (
              <option key={idx} value={connection.connection_name}>
                {connection.connection_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Schema
          </label>
          <div className="flex items-center">
            <select
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              value={selectedSchema}
              onChange={(e) => {
                const schemaName = e.target.value;
                setSelectedSchema(schemaName);
                fetchTables(selectedConnection, schemaName);
              }}
              disabled={!selectedConnection || schemaLoading}
            >
              {schemaLoading ? (
                <option value="">Loading schemas...</option>
              ) : (
                <>
                  <option value="">Select Schema</option>
                  {schemas.map((schema, idx) => (
                    <option key={idx} value={schema.table_schema}>
                      {schema.table_schema}
                    </option>
                  ))}
                </>
              )}
            </select>
            {/* Loading Indicator */}
            {schemaLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            <span className="ml-5 text-black font-bold">{schemaCount.schema_count}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-3">
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Purge Scope
        </label>
        <div className="flex gap-4 items-center">
          <label className="text-xs text-black font-medium">Table</label>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-bulk"
              name="table"
              value="bulk"
              defaultChecked
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500 ml-10"
            />
            <label htmlFor="table-bulk" className="ml-2 text-xs text-gray-700">
              Bulk
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="table-subset"
              name="table"
              value="subset"
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="table-subset"
              className="ml-2 text-xs text-gray-700"
            >
              Subset
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center mt-3">
        <label className="text-xs text-black font-medium">Column</label>
        <div className="flex items-center">
          <input
            type="radio"
            id="column-bulk"
            name="column"
            value="bulk"
            defaultChecked
            className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500 ml-10"
          />
          <label htmlFor="column-bulk" className="ml-2 text-xs text-gray-700">
            Bulk
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id="column-subset"
            name="column"
            value="subset"
            className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="column-subset" className="ml-2 text-xs text-gray-700">
            Subset
          </label>
        </div>
      </div>

      {selectedConnection && selectedSchema && (
        <div>
          <div className="flex items-center gap-2 mb-0.5 mt-4">
            <Search size={14} className="text-gray-500" />
            <label className="text-xs font-semibold text-black">Data Set</label>
          </div>
          <input
            type="search"
            placeholder="Search datasets..."
            className="w-full p-2 mb-2 text-xs text-black border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {loading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      checked={selectedItems.length === filteredTables.length} // Check if all items are selected
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          setSelectedItems(
                            filteredTables
                              .filter((table) => table !== null) // Filter out null responses
                              .map((table) => table.table_name)
                          );
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-xs font-semibold text-black"
                    >
                      Select all
                    </label>
                  </div>
                </div>

                {filteredTables
                  .filter((table) => table !== null) 
                  .map((table, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`table-${idx}`}
                          checked={selectedItems.includes(table.table_name)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedItems(prev => checked 
                              ? [...prev, table.table_name]
                              : prev.filter(i => i !== table.table_name)
                            );
                          }}
                          className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`table-${idx}`}
                          className="text-xs font-semibold text-black"
                        >
                          {table.table_name}
                        </label>
                      </div>
                      <button
                        onClick={() => openDrawer(id, table)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>



                    </div>
                  ))}
              </>
            )}
          </div>
          
        </div>
      )}
      <div className="flex space-x-2 mt-4">
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
          Cancel
        </button>
        <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-10 border border-gray-700 hover:border-transparent rounded">
          OK
        </button>
      </div>


    </div>
  );
}

SourceNode.propTypes = {
  id: PropTypes.string.isRequired,
};

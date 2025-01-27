import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X, Search } from "lucide-react";

const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
    </div>
  );

export function SourceNode({ id }) {
  const hostname = import.meta.env.VITE_FAST_API;
  //   const token = localStorage.getItem('authToken');
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const [connections, setConnections] = useState([]);
  const [connectionCount, setConnectioncount] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState("");

  let connectionsData;
  let connectionCountData;
  let tabledetails;

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {

      const cachedconnectionResponse =
        localStorage.getItem("connectionResponse");
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
        localStorage.setItem("connectionResponse", JSON.stringify(connectionsData));
      }




      const cachedconnectionCountResponse = localStorage.getItem(
        "connectionCountResponse"
      );
      if (cachedconnectionCountResponse) {
        connectionCountData = JSON.parse(cachedconnectionCountResponse);
      } else {
        const connectionCountResponse = await fetch(
          `${hostname}/connection-saves/count`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        connectionCountData = await connectionCountResponse.json();
        localStorage.setItem(
          "connectionCountResponse",
          JSON.stringify(connectionCountData)
        );
      }




        const fetchTableResponse = await fetch(
          `${hostname}/connection-master-metadata/find-by-conn-name-type?conn_name=db2_both`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        tabledetails = await fetchTableResponse.json();


      setConnections(connectionsData);
      setConnectioncount(connectionCountData);
      setTables(tabledetails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching options:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, []);

  const filteredTables = tables.filter((table) =>
    table.table_name.toLowerCase().includes(searchTerm?.toLowerCase() || "")
  );

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
        <Upload className="w-5 h-5 text-[#96CF7B]" />
        <h3 className="text-black font-medium">Source</h3>
      </div>

      <div className="space-y-1.5">
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Connection
          </label>
          <select className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          value={selectedConnection}
          onChange={(e) => setSelectedConnection(e.target.value)}
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
            <select className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400">
              <option>Select</option>
              {/* {schemas.map((schema) => (
                            <option key={schema.id} value={schema.id}>
                                {schema.name}
                            </option>
                        ))} */}
            </select>
            <span className="ml-5 text-black font-bold">{connectionCount}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-3">
        <label className="text-xs font-semibold text-black mb-0.5 block">
          Migration Scope
        </label>
        {/* Table Selection */}
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
              id="table-manual"
              name="table"
              value="manual"
              className="h-3 w-3 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="table-manual"
              className="ml-2 text-xs text-gray-700"
            >
              Manual
            </label>
          </div>
        </div>
      </div>
      <button className="bg-transparent hover:bg-[#8e78b7] text-xs text-gray-700 font-semibold hover:text-white py-2 px-24 border border-gray-700 hover:border-transparent rounded mt-4">
        OK
      </button>

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
                      filteredTables.map((table) => table.table_name)
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

          {filteredTables.map((table, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`table-${idx}`}
                  checked={selectedItems.includes(table.table_name)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      setSelectedItems([...selectedItems, table.table_name]);
                    } else {
                      setSelectedItems(
                        selectedItems.filter((i) => i !== table.table_name)
                      );
                    }
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
              <button className="text-purple-600 hover:text-purple-700"></button>
            </div>
          ))}
          </>
        )}
        </div>
      </div>

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

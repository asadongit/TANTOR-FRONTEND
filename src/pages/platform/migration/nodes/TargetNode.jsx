import React, { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { Upload, X } from "lucide-react";

export function TargetNode({ id }) {
  const hostname = import.meta.env.VITE_FAST_API;
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const [connections, setConnections] = useState([]);
  const [settings, setSettings] = useState("Prefix/Suffix");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemas, setSchema] = useState([]);

  let connectionsData;
  let schemadetails;

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



  const fetchschema = useCallback(
    async (connectionName) => {
      if (!connectionName) {
        setSchema([]); // Clear schemas when no connection selected
        return;
      }

      setSchemaLoading(true);

      try {
        const cachedschemalist = sessionStorage.getItem("schemalist");
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
          sessionStorage.setItem("schemalist", JSON.stringify(schemadetails));
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

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSettingsChange = (event) => {
    setSettings(event.target.value);
  };

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
        <h3 className="text-black font-medium">Target</h3>
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
              setSelectedSchema("");
              fetchschema(connectionName);
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
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={selectedSchema}
            onChange={(e) => {
              const schemaName = e.target.value;
              setSelectedSchema(schemaName);
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
        </div>
        <div>
          <label className="text-xs font-semibold text-black mb-0.5 block">
            Settings
          </label>
          <select
            className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            value={settings}
            onChange={handleSettingsChange}
          >
            <option>Prefix/Suffix</option>
            <option>Prefix</option>
            <option>Suffix</option>
          </select>
        </div>
        {settings !== "Prefix/Suffix" && (
          <div>
            <label className="text-xs font-semibold text-black mb-0.5 block">
              Value
            </label>
            <input
              type="text"
              className="w-full p-1 text-[10px] bg-white rounded-sm border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        )}
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

TargetNode.propTypes = {
  id: PropTypes.string.isRequired,
};

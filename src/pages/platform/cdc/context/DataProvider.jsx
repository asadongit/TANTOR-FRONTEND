// TBD
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const hostname = "your-api-url"; // Replace with actual API URL
  const hostnamev2 = "your-api-url-v2"; // Replace if needed
  const token = "your-auth-token"; // Replace with actual token

  // Caching states
  const [connections, setConnections] = useState(null);
  const [schemaCountCache, setSchemaCountCache] = useState({});
  const [schemasCache, setSchemasCache] = useState({});
  const [tablesCache, setTablesCache] = useState({});
  const [ddlCache, setDdlCache] = useState({});

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch(`${hostname}/connection-saves`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`Failed to fetch connections: ${response.status}`);

        const connectionsData = await response.json();
        const filteredData = connectionsData.filter(
          (item) =>
            item.pool_type === "both" ||
            (item.pool_type === "source" && item.created_by === "sorv") ||
            item.created_by === "novhi"
        );

        setConnections(filteredData);
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };

    if (!connections) fetchConnections();
  }, [connections]);

  const fetchSchemaCount = useCallback(async (connectionName) => {
    if (!connectionName) return {};

    if (schemaCountCache[connectionName]) return schemaCountCache[connectionName]; // Return cached data

    try {
      const response = await fetch(`${hostname}/schema/${connectionName}/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch schema count: ${response.status}`);

      const schemaCountData = await response.json();
      setSchemaCountCache((prev) => ({ ...prev, [connectionName]: schemaCountData }));

      return schemaCountData;
    } catch (error) {
      console.error("Error fetching schema count:", error);
      return {};
    }
  }, [schemaCountCache]);

  const fetchSchemas = useCallback(async (connectionName) => {
    if (!connectionName) return [];

    if (schemasCache[connectionName]) return schemasCache[connectionName]; // Return cached data

    try {
      const response = await fetch(`${hostname}/schema/${connectionName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to fetch schemas: ${response.status}`);

      const schemaDetails = await response.json();
      setSchemasCache((prev) => ({ ...prev, [connectionName]: schemaDetails }));

      return schemaDetails;
    } catch (error) {
      console.error("Error fetching schemas:", error);
      return [];
    }
  }, [schemasCache]);

  const fetchTables = useCallback(async (connectionName, schemaName) => {
    if (!connectionName || !schemaName) return [];

    const cacheKey = `${connectionName}_${schemaName}`;
    if (tablesCache[cacheKey]) return tablesCache[cacheKey]; // Return cached data

    try {
      const response = await fetch(
        `${hostname}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch tables: ${response.status}`);

      const tableDetails = await response.json();
      const normalizedTables = tableDetails.map((item) => ({
        source_table: item.table_name,
        connection_name: item.connection_name,
        connection_id: item.connection_id,
        source_schema: item.source_schema,
      }));

      setTablesCache((prev) => ({ ...prev, [cacheKey]: normalizedTables }));

      return normalizedTables;
    } catch (error) {
      console.error("Error fetching tables:", error);
      return [];
    }
  }, [tablesCache]);

  const fetchDDL = useCallback(async (connectionName, schemaName) => {
    if (!connectionName || !schemaName) return [];

    const cacheKey = `${connectionName}_${schemaName}`;
    if (ddlCache[cacheKey]) return ddlCache[cacheKey]; // Return cached data

    try {
      const response = await fetch(
        `${hostnamev2}/metadata-archivals-tables?schema_name=${schemaName}&source_conn_name=${connectionName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch DDL: ${response.status}`);

      const ddlData = await response.json();
      setDdlCache((prev) => ({ ...prev, [cacheKey]: ddlData }));

      return ddlData;
    } catch (error) {
      console.error("Error fetching DDL:", error);
      return [];
    }
  }, [ddlCache]);

  return (
    <DataContext.Provider
      value={{
        connections,
        fetchSchemaCount,
        fetchSchemas,
        fetchTables,
        fetchDDL,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
const hostnameV1= import.meta.env.VITE_FAST_API;
const hostnamev2 = import.meta.env.VITE_FAST_API_V2;

const fetchConnections = async (token,decodedToken,project , poolType='both') => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/connection-saves`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-project": project
       },  });  

    return response.data.filter(
      (item) =>
        item.pool_type === "both" ||
        item.pool_type === poolType)
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
};

export const useConnections = (poolType) => {
  const { token,decodedToken,project } = useAuth();

  return useQuery({
    queryKey: [`CDCconnections-${poolType}`,project],
    queryFn: () => fetchConnections(token,decodedToken,project,poolType),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

const fetchSchemaCount = async (token, connectionName) => {
  if (!token || !connectionName) return {};

  try {
    const response = await axios.get(`${hostnameV1}/schema/${connectionName}/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching schema count:", error);
    return {};
  }
};

export const useSchemaCount = (connectionName) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["CDCschemaCount", connectionName],
    queryFn: () => fetchSchemaCount(token, connectionName),
    enabled: !!token && !!connectionName,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

const fetchSchemas = async (token, connectionName) => {
  if (!token || !connectionName) return [];

  try {
    const response = await axios.get(`${hostnameV1}/schema/${connectionName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return [];
  }
};

export const useSchemas = (connectionName) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["CDCschemas", connectionName],
    queryFn: () => fetchSchemas(token, connectionName),
    enabled: !!token && !!connectionName,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

const fetchTables = async (token, connectionName, schemaName) => {
  if (!token || !connectionName || !schemaName) return [];

  try {
    const response = await axios.get(
      `${hostnameV1}/connection-master-metadata/find-by-conn-name-type?conn_name=${connectionName}&schema_name=${schemaName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.map((item) => ({
      source_table: item.table_name,
      connection_name: item.connection_name,
      connection_id: item.connection_id,
      source_schema: item.source_schema,
    }));
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
};

export const useTables = (connectionName, schemaName,selectedMode='subset') => {
  const { token } = useAuth();

  const fetchFunction = selectedMode === 'subset'
  ? () => fetchTables(token, connectionName, schemaName)
  : () => fetchDDL(token, connectionName, schemaName);
  const queryKey = [`${selectedMode}CDCTables`, connectionName, schemaName];
  return useQuery({
    queryKey,
    queryFn: () => fetchFunction(token, connectionName, schemaName),
    enabled: !!token && !!connectionName && !!schemaName,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

const fetchDDL = async (token, connectionName, schemaName) => {
  if (!token || !connectionName || !schemaName) return [];

  try {
    const response = await axios.get(
      `${hostnamev2}/metadata-archivals-tables?schema_name=${schemaName}&source_conn_name=${connectionName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching DDL:", error);
    return [];
  }
};

export const useDDL = (connectionName, schemaName) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["CDCddl", connectionName, schemaName],
    queryFn: () => fetchDDL(token, connectionName, schemaName),
    enabled: !!token && !!connectionName && !!schemaName,
    staleTime: 30 * 1000,
    retry: 2,
  });
};









const fetchTargetDDL = async ({  token,  hostnameV2,  sourceConnection,  targetConnection,  sourceSchema,  targetSchema = null,  sourceTables = [] }) => {
  if (!token || !sourceConnection || !targetConnection || !sourceSchema) return [];

  try {
    const response = await axios.post(
      `${hostnameV2}/metadata-archivals/grouped-target-tables`,
      {
        source_conn_name: sourceConnection,
        target_conn_name: targetConnection,
        source_schema: sourceSchema,
        ...(targetSchema && { target_schema: targetSchema }), 
        ...(sourceTables.length > 0 && { selected_source_tables: sourceTables }) 
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching grouped target tables:", error);
    return [];
  }
};

export const useBulkTables = ( sourceConnection, targetConnection, sourceSchema, targetSchema = null, sourceTables = []
) => {
  const { token, hostnameV2 } = useAuth();
  return useQuery({
    queryKey: ['bulkTables', sourceConnection, targetConnection, sourceSchema, targetSchema, sourceTables
    ],
    queryFn: () => fetchTargetDDL({ token, hostnameV2, sourceConnection, targetConnection, sourceSchema, targetSchema, sourceTables }),
    enabled: !!token && !!sourceConnection && !!targetConnection && !!sourceSchema,
    staleTime: 30 * 1000,
    retry: 2,
  });
};
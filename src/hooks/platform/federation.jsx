import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { secureQuery } from "../../pages/datagovernance/DataCatalogue/Components/function";
import { useAuth } from "../../context/AuthContext";

export const useFederationDashboardData = () => {
  const { token, hostnameV1, decodedToken } = useAuth();
  const username = decodedToken?.preferred_username || "sabhyata";
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationDashboard", username, policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return { result: [] };
      const policy_id = policyIds[0];

      const res = await axios.post(
        `${hostnameV1}/user_views_summary`,
        { username, policy_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      return res.data;
    },
    enabled: !!token && !!hostnameV1 && !!username && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationPolicyIds = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["federationPolicyIds"],
    queryFn: async () => {
      const sqRes = await secureQuery({ user_query: "" }, token);
      return sqRes?.matched_policy_ids || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFederationConnections = () => {
  const { token, hostnameV1 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationConnections", policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return { connections: [], views: [], policyIds: [] };

      const res = await axios.post(
        `${hostnameV1}/connections/list`,
        { matched_policy_ids: policyIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      
      const raw = res.data;
      const connectionsRaw = Array.isArray(raw) ? raw : (raw.connections ?? []);
      const viewsRaw = Array.isArray(raw) ? [] : (raw.views ?? []);

      const connections = connectionsRaw.map((c) =>
        typeof c === "string" ? { connection_name: c } : { connection_name: c.connection_name }
      );
      return { connections, views: viewsRaw, policyIds };
    },
    enabled: !!token && !!hostnameV1 && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationBuilderViews = () => {
  const { token, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["federationBuilderViews"],
    queryFn: async () => {
      const res = await axios.get(`${hostnameV1}/get-all-views`);
      return res.data?.result || [];
    },
    enabled: !!token && !!hostnameV1,
    staleTime: 30 * 1000,
  });
};

export const useFederationConnectionsBaseNodes = () => {
  const { token, hostnameV1 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationConnectionsBaseNodes", policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return [];

      const res = await axios.post(
        `${hostnameV1}/federation/connections/list`,
        { matched_policy_ids: policyIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      return res.data.map((item) => item.connection_name);
    },
    enabled: !!token && !!hostnameV1 && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationSchemas = (connectionName) => {
  const { token, hostnameV1 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationSchemas", connectionName, policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return [];

      const res = await axios.post(
        `${hostnameV1}/schemas/list`,
        { matched_policy_ids: policyIds, connection_name: connectionName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      const connectionData = res.data.find((item) => item[connectionName]);
      return connectionData ? connectionData[connectionName] : [];
    },
    enabled: !!token && !!hostnameV1 && !!connectionName && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationTables = (connectionName, schemaName) => {
  const { token, hostnameV1 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationTables", connectionName, schemaName, policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return [];

      const res = await axios.post(
        `${hostnameV1}/tables/list`,
        { matched_policy_ids: policyIds, connection_name: connectionName, schema_name: [schemaName] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      const schemaData = res.data.schemas?.find(
        (item) => item.connection_name === connectionName && item.schema === schemaName
      );
      return schemaData?.tables || [];
    },
    enabled: !!token && !!hostnameV1 && !!connectionName && !!schemaName && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationColumns = (connectionName, schemaName, tableName) => {
  const { token, hostnameV1 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationColumns", connectionName, schemaName, tableName, policyIds],
    queryFn: async () => {
      const detailedColsRes = await axios.get(
        `${hostnameV1}/${connectionName}/schemas/${schemaName}/tables/${tableName}/columns`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      const detailedCols = detailedColsRes.data;

      if (!policyIds || policyIds.length === 0) return [];

      const allowedColsRes = await axios.post(
        `${hostnameV1}/columns/list`,
        { matched_policy_ids: policyIds, connection_name: connectionName, schema_name: [schemaName], table_name: [tableName] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      
      const allowedColumnsData = allowedColsRes.data;
      if (!allowedColumnsData || !allowedColumnsData.columns) return [];

      const allowedColumnDataMatch = allowedColumnsData.columns.find(
        (item) => item.connection_name === connectionName && item.schema === schemaName && item.table_name === tableName
      );

      if (allowedColumnDataMatch && allowedColumnDataMatch.columns) {
        return allowedColumnDataMatch.columns.map((col) => {
          const datatype = detailedCols.find((dc) => dc.column?.toLowerCase() === col.column_name?.toLowerCase())?.datatype
            || col.metadata?.DATA_TYPE
            || "unknown";
          return { column: col.column_name, datatype };
        });
      }
      return [];
    },
    enabled: !!token && !!hostnameV1 && !!connectionName && !!schemaName && !!tableName && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationBaseViewsV2 = (paramsStr) => {
  const { token, hostnameV2 } = useAuth();
  const { data: policyIds } = useFederationPolicyIds();

  return useQuery({
    queryKey: ["federationBaseViewsV2", paramsStr, policyIds],
    queryFn: async () => {
      if (!policyIds || policyIds.length === 0) return { result: [] };

      const policyParam = policyIds.map(id => `policy_id=${id}`).join('&');
      const finalParams = paramsStr ? `${paramsStr}&${policyParam}` : policyParam;

      const res = await axios.get(
        `${hostnameV2}/get-all-views_v2?${finalParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      return res.data;
    },
    enabled: !!token && !!hostnameV2 && !!paramsStr && policyIds !== undefined,
    staleTime: 30 * 1000,
  });
};

export const useFederationViewColumns = (viewName) => {
  const { token, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["federationViewColumns", viewName],
    queryFn: async () => {
      const res = await axios.post(
        `${hostnameV1}/fetch_view_columns`,
        { view_names: [viewName] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      return res.data?.result?.[viewName] || [];
    },
    enabled: !!token && !!hostnameV1 && !!viewName,
    staleTime: 30 * 1000,
  });
};

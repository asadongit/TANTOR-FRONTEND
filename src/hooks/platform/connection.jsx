import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = window._env_?.VITE_FAST_API_V2;

const fetchConnectionData = async (token, project, policyIds) => {
  if (!token) throw new Error("Token is missing");

  const params = policyIds?.length
    ? `?policy_ids=${policyIds.join(",")}`
    : "";

  const response = await axios.get(
    `${hostnamev2}/connections/counts${params}`,
    { headers: { Authorization: `Bearer ${token}`, "x-project": project } }
  );

  return response.data ?? [];
};
export const useConnectionData = () => {
  const { token, project, decodedToken } = useAuth();

  const isConnectionCreation = decodedToken?.resource_access?.darch?.roles?.some(
    r => r.toLowerCase() === 'persona:connection manager'
  );

  return useQuery({
    queryKey: ["connectionData", project, isConnectionCreation],
    queryFn: async () => {
      let policyIds = [];
      if (!isConnectionCreation) {
        const sq = await axios.post(
          `${window._env_?.VITE_FAST_API}/secure-query`,
          { user_query: "" },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        policyIds = sq.data?.matched_policy_ids ?? [];
      }
      return fetchConnectionData(token, project, policyIds);
    },
    enabled: !!token,
    staleTime: 10 * 1000,
    retry: 2,
  });
};









const fetchAllConnectionData = async (token,hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/connection-saves/all`, {
      headers: {
         Authorization: `Bearer ${token}`,
        },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useAllConnectionData = () => {
  const { token, project, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["allConnectionData",project],
    queryFn: () => fetchAllConnectionData(token,hostnameV1), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

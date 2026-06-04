import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = window._env_?.VITE_FAST_API_V2; 
const hostnamev1 = window._env_?.VITE_FAST_API;

const fetchSourceTypeCounts = async (token, modelType, project) => {
  if (!token) throw new Error("Token is missing");
  if (!modelType) throw new Error("Model type is required");


  const response = await axios.get(`${hostnamev2}/connections/source-type-counts`, {
    params: { model_type: modelType }, 
      headers: {
         Authorization: `Bearer ${token}`,
         "x-project": project
        },  });

  return response.data ?? {}; 
};

export const useSourceTypeCounts = (modelType) => {
  const { token, project } = useAuth(); 

  return useQuery({
    queryKey: ["sourceTypeCounts", modelType, project], 
    queryFn: () => fetchSourceTypeCounts(token, modelType, project),
    enabled: !!token && !!modelType, 
    staleTime: 1 * 60 * 1000, 
    retry: 2, 
  });
};


const fetchConnectionCounts = async (token, project, policyIds) => {
  if (!token) throw new Error("Token is missing");

  const params = policyIds?.length
    ? `?policy_ids=${policyIds.join(",")}`
    : "";

  const response = await axios.get(
    `${hostnamev2}/connections/dashboard-counts${params}`,
    { headers: { Authorization: `Bearer ${token}`, "x-project": project } }
  );

  return response.data ?? [];
};

export const useConnectionCardData = () => {
  const { token, project } = useAuth();
  const { data: policyIds = [] } = usePolicyIds();  // ← reuse cached result

  return useQuery({
    queryKey: ["connectionDashboard", project, policyIds],
    queryFn: () => fetchConnectionCounts(token, project, policyIds),
    enabled: !!token,
    staleTime: 3 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};



const fetchProjectCounts = async (token) => {
  if (!token) throw new Error("Token is missing");

  const response = await axios.get(`${hostnamev2}/project/dashboard-counts`, {
      headers: {
         Authorization: `Bearer ${token}`,
        },  });

  return response.data ?? [];
};

export const useProjectCardData = () => {
  const { token,project } = useAuth(); 

  return useQuery({
    queryKey: ["ProjectDashboard"],
    queryFn: () => fetchProjectCounts(token,project), 
    enabled: !!token, 
    staleTime: 3 * 60 * 1000, 
    retry: 2, 
    refetchOnWindowFocus: false, 
  });
};

const fetchRuleCounts = async (token) => {
  if (!token) throw new Error("Token is missing");

  const response = await axios.get(`${window._env_?.VITE_REPORTING_BACKEND_API}/ruleCount`, {
      headers: {
         Authorization: `Bearer ${token}`,
        },
      });

  return response.data ?? [];
};

export const useRulesCardData = () => {
  const { token,project } = useAuth(); 

  return useQuery({
    queryKey: ["RuleDashboard"],
    queryFn: () => fetchRuleCounts(token), 
    enabled: !!token, 
    staleTime: 3 * 60 * 1000, 
    retry: 2, 
    refetchOnWindowFocus: false, 
  });
};

export const usePolicyIds = () => {
  const { token, decodedToken } = useAuth();

  const isConnectionCreation = decodedToken?.resource_access?.darch?.roles?.some(
    r => r.toLowerCase() === 'persona:connection manager'
  );

  return useQuery({
    queryKey: ["policyIds", isConnectionCreation],
    queryFn: async () => {
      if (isConnectionCreation) return [];  // admins get no policy filter
      const sq = await axios.post(
        `${window._env_?.VITE_FAST_API}/secure-query`,
        { user_query: "" },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      return sq.data?.matched_policy_ids ?? [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
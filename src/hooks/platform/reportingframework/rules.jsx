import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

const hostnameV1 = window._env_?.VITE_FAST_API;

  const fetchRuleData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${window._env_?.VITE_REPORTING_BACKEND_API}/ruleList`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useRuleData = () => {
   const {token} = useAuth();
   
   return useQuery({
    queryKey: ["ruleData"],
    queryFn: () => fetchRuleData(token),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 2,
   });
}
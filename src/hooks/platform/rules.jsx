import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev1 = import.meta.env.VITE_FAST_API;

const fetchRuleData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnamev1}/ruleList`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const rawData = response.data ?? []; 
    
    const transformedData = rawData.map((item, index) => ({
      ...item,
      s_no: index + 1
    }));

    return transformedData;
  } catch (error) {
    console.error("Error fetching rule data:", error);
    return []; 
  }
};

export const useRuleData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["ruleData"],
    queryFn: () => fetchRuleData(token), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

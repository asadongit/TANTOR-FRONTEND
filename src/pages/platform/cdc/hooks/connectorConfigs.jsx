import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";

const hostnamev2 = import.meta.env.VITE_FAST_API_V2;

const fetchCDCConfigs = async (token, cdcId) => {
  if (!token || !cdcId) return null;

  try {
    const response = await axios.get(`${hostnamev2}/cdc/${cdcId}/configs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching CDC configs:", error);
  }
};

export const useCDCConfigs = (cdcId) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: [`CDCConfigs${cdcId}`, cdcId],
    queryFn: () => fetchCDCConfigs(token, cdcId),
    enabled: !!token && !!cdcId,
    staleTime: 30 * 1000,
    retry: 2,
  });
};
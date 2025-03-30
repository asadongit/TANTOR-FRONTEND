import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostname = import.meta.env.VITE_FAST_API;

const fetchReportData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostname}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useReportData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["reportData"],
    queryFn: () => fetchReportData(token), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

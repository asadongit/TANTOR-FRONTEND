import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";


const fetchReportData = async (token, hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useReportData = () => {
  const { token, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["reportData"],
    queryFn: () => fetchReportData(token, hostnameV1), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

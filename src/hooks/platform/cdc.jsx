import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";


const fetchCDCData = async (token, hostnameV2) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV2}/cdc`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useCDCData = () => {
  const { token, hostnameV2 } = useAuth();

  return useQuery({
    queryKey: ["cdcData"],
    queryFn: () => fetchCDCData(token, hostnameV2), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

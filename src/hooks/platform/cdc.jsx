import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";


const fetchCDCData = async (token, hostnameV2, decodedToken) => {
  // console.log(decodedToken.preferred_username);
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV2}/cdc?username=${decodedToken.preferred_username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? [];
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return [];
  }
};

export const deleteCDCConnectors = async (cdcId, token, hostnameV2) => {
  try {
    const response = await axios.delete(`${hostnameV2}/cdc/delete/${cdcId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting CDC:", error);
    throw new Error(error.response?.data?.detail || "Failed to delete CDC");
  }
};

export const useCDCData = () => {
  const { token, hostnameV2, decodedToken } = useAuth();

  return useQuery({
    queryKey: ["cdcData"],
    queryFn: () => fetchCDCData(token, hostnameV2, decodedToken),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

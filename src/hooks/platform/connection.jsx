import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = import.meta.env.VITE_FAST_API_V2;

const fetchConnectionData = async (token, project) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnamev2}/connections/counts`, {
      headers: {
         Authorization: `Bearer ${token}`,
         "x-project": project
        },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useConnectionData = () => {
  const { token, project } = useAuth();

  return useQuery({
    queryKey: ["connectionData",project],
    queryFn: () => fetchConnectionData(token, project), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

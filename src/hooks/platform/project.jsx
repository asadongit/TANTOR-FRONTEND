import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = import.meta.env.VITE_FAST_API_V2;

const fetchProjectData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnamev2}/projects/listing`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useProjectData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["projectData"],
    queryFn: () => fetchProjectData(token), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

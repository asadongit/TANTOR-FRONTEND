import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostname = import.meta.env.VITE_FAST_API;

const fetchArchivalData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostname}/migrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

export const useArchivalData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["ArchivalData"],
    queryFn: () => fetchArchivalData(token), 
    enabled: !!token, 
    staleTime: 30 * 1000, 
    retry: 2, 
  });
};

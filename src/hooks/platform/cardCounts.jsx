import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = import.meta.env.VITE_FAST_API_V2; 


const fetchSourceTypeCounts = async (token, modelType) => {
  if (!token) throw new Error("Token is missing");
  if (!modelType) throw new Error("Model type is required");


  const response = await axios.get(`${hostnamev2}/connections/source-type-counts`, {
    params: { model_type: modelType }, 
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data ?? {}; 
};

export const useSourceTypeCounts = (modelType) => {
  const { token } = useAuth(); 

  return useQuery({
    queryKey: ["sourceTypeCounts", modelType], 
    queryFn: () => fetchSourceTypeCounts(token, modelType),
    enabled: !!token && !!modelType, 
    staleTime: 1 * 60 * 1000, 
    retry: 2, 
  });
};


const fetchConnectionCounts = async (token) => {
  if (!token) throw new Error("Token is missing");

  const response = await axios.get(`${hostnamev2}/connections/dashboard-counts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data ?? [];
};

export const useConnectionCardData = () => {
  const { token } = useAuth(); 

  return useQuery({
    queryKey: ["connectionDashboard"],
    queryFn: () => fetchConnectionCounts(token), 
    enabled: !!token, 
    staleTime: 3 * 60 * 1000, 
    retry: 2, 
    refetchOnWindowFocus: false, 
  });
};



const fetchProjectCounts = async (token) => {
  if (!token) throw new Error("Token is missing");

  const response = await axios.get(`${hostnamev2}/project/dashboard-counts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data ?? [];
};

export const useProjectCardData = () => {
  const { token } = useAuth(); 

  return useQuery({
    queryKey: ["ProjectDashboard"],
    queryFn: () => fetchProjectCounts(token), 
    enabled: !!token, 
    staleTime: 3 * 60 * 1000, 
    retry: 2, 
    refetchOnWindowFocus: false, 
  });
};
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";


const fetchUser = async (id, token, hostnameV1) => {
  if (!id || !token) throw new Error("User ID or Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile");
  }
};

export const useFetchUser  = (userId) => {
  const { token, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["userProfile", userId], 
    queryFn: () => fetchUser(userId, token), 
    enabled: !!userId && !!token, 
    staleTime: 2* 60 * 1000, 
    retry: 2, 
  });
};

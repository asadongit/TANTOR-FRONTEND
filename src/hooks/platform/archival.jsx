import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";


const fetchArchivalData = async (token,project,hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/metadata-archivals`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-project": project,
      },
    });

    return response.data ?? [];
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return [];
  }
};

export const useArchivalData = () => {
  const { token,project,hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["ArchivalData"],
    queryFn: () => fetchArchivalData(token, project, hostnameV1),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

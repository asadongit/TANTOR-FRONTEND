import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const fetchMetadataData = async (token, project, hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    // if (project && project !== "default" && project !== "" && project !== null) {
    //   headers["x-project"] = project;
    // }

    const response = await axios.get(`${hostnameV1}/metadata-archivals`, {
      headers,
    });

    return response.data ?? [];
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return [];
  }
};

export const deleteMetadata = async (metadataId, token, hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.delete(
      `${hostnameV1}/metadata-archivals/${metadataId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting metadata:", error);
    throw error;
  }
};

export const useMetadataData = () => {
  const { token, project, hostnameV1 } = useAuth();

  return useQuery({
    queryKey: ["metadataArchivalData", project],
    queryFn: () => fetchMetadataData(token, project, hostnameV1),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 2,
  });
};

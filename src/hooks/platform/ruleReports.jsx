import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const fetchRuleReportsData = async (token, hostnameV1) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnameV1}/lineItems/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rawData = response.data ?? []; 
    
    const transformedData = rawData.map((item, index) => ({
      s_no: index + 1,
      id: item.report_id,
      name: item.report_name,
      description: item.report_desc,
      created: item.created_on,
      updated: item.updated_on,
      status: item.report_status,
      type: item.report_type,
    }));

    return transformedData;
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};

  export const useRuleReportsData = () => {
    const { token, hostnameV1 } = useAuth();
  
    return useQuery({
      queryKey: ["ruleReportsData"],
      queryFn: () => fetchRuleReportsData(token, hostnameV1), 
      enabled: !!token, 
      staleTime: 30 * 1000, 
      retry: 2, 
    });
  };

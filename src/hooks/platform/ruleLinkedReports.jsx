import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev2 = import.meta.env.VITE_FAST_API_V2;


/*
const fetchRuleReportData = async (token) => {
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

*/


export const fetchRuleReportData = async (token) => {
    if (!token) throw new Error("Token is missing");
  
    return [
      {
        sno: 1,
        id: "RO1",
        name: "TD",
        desc: "Trem Deposits",
      },
      {
        sno: 2,
        id: "RO2",
        name: "L&A",
        desc: "Loans and Advances",
      },
      {
        sno: 3,
        id: "RO3",
        name: "CL",
        desc: "Credit Loans",
      },
    ];
}

  export const useRuleReportData = () => {
    const { token } = useAuth();
  
    return useQuery({
      queryKey: ["ruleReportData"],
      queryFn: () => fetchRuleReportData(token), 
      enabled: !!token, 
      staleTime: 30 * 1000, 
      retry: 2, 
    });
  };

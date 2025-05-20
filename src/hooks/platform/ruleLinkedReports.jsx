import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const hostnamev1 = import.meta.env.VITE_FAST_API;



const fetchRuleReportData = async (token) => {
  if (!token) throw new Error("Token is missing");

  try {
    const response = await axios.get(`${hostnamev1}/reportList`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data ?? []; 
  } catch (error) {
    console.error("Error fetching connection data:", error);
    return []; 
  }
};




// export const fetchRuleReportData = async (token) => {
//     if (!token) throw new Error("Token is missing");
  
//     return [
//       {
//         sno: 1,
//         id: "1",
//         name: "Term Deposits",
//         type: "grid",
//         desc: "Term Deposits Grid Report",
//       },
//       {
//         sno: 2,
//         id: "2",
//         name: "Remittance",
//         type: "grid",
//         desc: "Remittance Grid Report",
//       },
//       {
//         sno: 3,
//         id: "3",
//         name: "StudentReport",
//         type: "list",
//         desc: "Student List Report",
//       },
//     ];
// }

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

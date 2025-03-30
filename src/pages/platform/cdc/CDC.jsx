import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CDCDashboard from "./CDCDashboard.jsx";
import { usePlatform } from "../../../context/platformContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
const CDC = () => {
  const navigate = useNavigate();
  const { setCDCData } = usePlatform();
  const hostname = import.meta.env.VITE_FAST_API;
  const { token } = useAuth();
  const fetchCDC = useCallback(async () => {
    try {
      const response = await fetch(`${hostname}/cdc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }

      const CDCData = await response.json();
      const filteredData = CDCData.filter((item) => item.created_by === "sorv");
      setCDCData(filteredData);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, []);

  useEffect(() => {
    fetchCDC();
  }, [fetchCDC]);
  return (
    <div>
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          <li className="inline-flex items-center">
            <span
              onClick={() => navigate("/")}
              className="inline-flex items-center text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              Platform
            </span>
          </li>

          <li>
            <div className="flex items-center">
              <svg
                className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span
                onClick={() => navigate("/cdc")}
                className={`ms-1 text-sm font-medium cursor-pointer md:ms-2 text-[#8e78b7] hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                CDC
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <CDCDashboard />
    </div>
  );
};

export default CDC;

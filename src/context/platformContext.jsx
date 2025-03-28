import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const hostname = import.meta.env.VITE_FAST_API;
  const hostnamev2 = import.meta.env.VITE_FAST_API_V2;
  const { token, decodedToken } = useAuth();
  const [CDCData, setCDCData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [purgeData, setPurgeData] = useState([]);
  const [migrationData, setMigrationData] = useState([]);
  const [archivalData, setArchivalData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [connectionData, setConnectionData] = useState([]);

  const requestHandler = useCallback(
    async ({ endpoint, method = "GET", setState, body = null }) => {
      try {
        const options = {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(body && { body: JSON.stringify(body) }),
        };

        const response = await fetch(`${hostname}${endpoint}`, options);
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        const filteredData = data.filter(
          (item) => item.created_by === decodedToken.preferred_username
        );
        setState(filteredData);
      } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
      }
    },
    []
  );
  const dataMap = {
    cdc: { data: CDCData, setData: setCDCData, endpoint: "/cdc" },
    migration: {
      data: migrationData,
      setData: setMigrationData,
      endpoint: "/metadata-archivals",
    },
    purge: { data: purgeData, setData: setPurgeData, endpoint: "/purges" },
    project: {
      data: projectData,
      setData: setProjectData,
      endpoint: "/projects",
    },
    connection: {
      data: connectionData,
      setData: setConnectionData,
      endpoint: "/connection-saves",
    },
    transformation: {
      data: archivalData,
      setData: setArchivalData,
      endpoint: "/migrations",
    },
    report: { data: reportData, setData: setReportData, endpoint: "/reports" },
  };
  return (
    <PlatformContext.Provider
      value={{
        reportData,
        setReportData,
        connectionData,
        setConnectionData,
        projectData,
        setProjectData,
        CDCData,
        setCDCData,
        migrationData,
        setMigrationData,
        purgeData,
        setPurgeData,
        archivalData,
        setArchivalData,
        requestHandler,
        dataMap,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

PlatformProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
};

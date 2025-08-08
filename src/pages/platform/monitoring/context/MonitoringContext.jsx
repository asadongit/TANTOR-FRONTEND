import React, { useContext, useState } from "react";
import FrontendDashboard from "../dashboards/FrontendDashboard";
import BackendDashboard from "../dashboards/BackendDashboard";

const MonitoringContext = React.createContext();

export const MonitoringProvider = ({ children }) => {
  // ------------- CONFIG ------------------
  const [monitoringConfig, setMonitoringConfig] = useState({
    pod: "",
    container: "",
  });

  const dashboards = [
    { id: 1, name: "frontend", component: <FrontendDashboard /> },
    { id: 2, name: "backend", component: <BackendDashboard /> },
  ];

  const [selectedDashboard, setSelectedDashboard] = useState(null);

  function getTimerangeInSeconds(differenceInMinutes) {
    const end = Math.floor(Date.now() / 1000).toString();
    const start = (end - differenceInMinutes * 60).toString();
    return { start, end };
  }

  function getTimerangeInMilliseconds(differenceInMinutes) {
    const end = Date.now().toString();
    const start = (end - differenceInMinutes * 60 * 1000).toString();
    return { start, end };
  }

  // ------------- API Calls START ----------------
  async function getPods({ podPrefix }) {
    const { start, end } = getTimerangeInSeconds(5);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/monitoring/api/datasources/uid/**MONITORING_PROMETHEUS**/resources/api/v1/series?match[]=kube_pod_status_phase{namespace="**MONITORING_NAMESPACE**", pod=~"**POD_PREFIX=${
          selectedDashboard.name
        }**", phase="Running"}&start=${start}&end=${end}`
      );
      if (!response.ok) throw new Error("Error fetching pods");
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async function getContainers({ pod }) {
    const { start, end } = getTimerangeInSeconds(5);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/monitoring/api/datasources/uid/**MONITORING_PROMETHEUS**/resources/api/v1/series?match[]=kube_pod_container_info{namespace="**MONITORING_NAMESPACE**", pod="${pod}"}&start=${start}&end=${end}`
      );

      if (!response.ok) {
        throw new Error("Error fetching containers");
      }

      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function getPodUptime({ pod }) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/monitoring/api/datasources/uid/**MONITORING_PROMETHEUS**/resources/api/v1/query?query=kube_pod_start_time{namespace="**MONITORING_NAMESPACE**",pod="${pod}"}`
      );

      if (!response.ok) throw new Error("Error fetching pod uptime.");

      const responseJson = await response.json();
      const results = responseJson.data.result;

      if (results.length === 0)
        throw new Error("No pod start time data found.");

      const values = results[0].value;
      const podStartTime = parseFloat(values[1]);
      const now = Date.now() / 1000;

      const uptimeInSeconds = now - podStartTime;

      console.log("Pod uptime in hours:", uptimeInSeconds / 3600);
      return uptimeInSeconds / 3600;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function getLogs({ pod, container }, from, to) {
    const body = {
      queries: [
        {
          refId: "A",
          datasource: {
            type: "loki",
            uid: "**MONITORING_LOKI**",
          },
          queryType: "range",
          expr: `{namespace=~"**MONITORING_NAMESPACE**", instance=~"${pod}", container="${container}"} |= ""`,
        },
      ],
      from,
      to,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/monitoring/api/ds/query`,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Error fetching logs.");
      }

      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function getPodMetrics({ pod }) {
    const { start, end } = getTimerangeInMilliseconds(60);

    const body = {
      queries: [
        {
          datasource: {
            type: "prometheus",
            uid: "**MONITORING_PROMETHEUS**",
          },
          editorMode: "code",
          expr: `sum(rate(container_cpu_usage_seconds_total{namespace="**MONITORING_NAMESPACE**", pod=~"${pod}", image!="", container!="", cluster=""}[5m])) by (container, id)`,
          interval: "5m",
          range: true,
          refId: "A",
          utcOffsetSec: 19800,
          legendFormat: "{{ container }}",
          intervalMs: 15000,
          maxDataPoints: 437,
        },
        {
          datasource: {
            type: "prometheus",
            uid: "**MONITORING_PROMETHEUS**",
          },
          editorMode: "code",
          expr: `sum(container_memory_working_set_bytes{namespace="**MONITORING_NAMESPACE**", pod=~"${pod}", image!="", container!="", cluster=""}) by (container, id)`,
          interval: "5m",
          range: true,
          refId: "B",
          utcOffsetSec: 19800,
          legendFormat: "{{ container }}",
          intervalMs: 15000,
          maxDataPoints: 437,
        },
      ],
      from: start,
      to: end,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_FAST_API}/monitoring/api/ds/query`,
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Error fetching logs.");
      }

      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // ------------- API Calls END ----------------

  return (
    <MonitoringContext.Provider
      value={{
        getPods,
        getContainers,
        getLogs,
        getPodUptime,
        getPodMetrics,
        monitoringConfig,
        setMonitoringConfig,
        dashboards,
        selectedDashboard,
        setSelectedDashboard,
        getTimerangeInMilliseconds,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoringContext = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error(
      "useMonitoringContext must be used within a MonitoringProvider"
    );
  }
  return context;
};

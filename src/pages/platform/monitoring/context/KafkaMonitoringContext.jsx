import React, { useContext, useState } from "react";

const KafkaMonitoringContext = React.createContext();

export const KafkaMonitoringProvider = ({ children }) => {
  async function getKafkaMetrics({start, end, expr}) {
    const body = {
      queries: [
        {
          datasource: {
            uid: "**KAFKA_PROMETHEUS**",
            type: "prometheus",
          },
          editorMode: "builder",
          expr: expr,
          format: "time_series",
          interval: "",
          intervalFactor: 2,
          legendFormat: "Topic: {{topic}}",
          range: true,
          refId: "A",
          queryType: "timeSeriesQuery",
          exemplar: false,
          utcOffsetSec: 19800,
          intervalMs: 120000,
          maxDataPoints: 493,
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
        throw new Error("Error fetching messages per topic data.");
      }

      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  return (
    <KafkaMonitoringContext.Provider value={{
        getKafkaMetrics,
    }}>
      {children}
    </KafkaMonitoringContext.Provider>
  );
};

export const useKafkaMonitoringContext = () => {
  const context = useContext(KafkaMonitoringContext);
  if (context === undefined) {
    throw new Error(
      "useKafkaMonitoringContext must be used within a KafkaMonitoringProvider"
    );
  }
  return context;
};

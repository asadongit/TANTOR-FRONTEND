import React, { useState } from "react";
import LogsViewer from "../components/LogsViewer";
import { useMonitoringContext } from "../context/monitoringcontext";

function BackendDashboard() {
//   const {} = useMonitoringContext();

  return (
    <div>
        <LogsViewer
      />
    </div>
  );
}

export default BackendDashboard;
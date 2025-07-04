import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ReportViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportUrl, setReportUrl] = useState("");

  useEffect(() => {
    if (!location.state?.reportPath) {
      navigate("/reports-config");
      return;
    }

    const url = `${window._env_?.VITE_BIRT_API}/frameset?__report=${
      location.state.reportPath
    }&__format=html`;

    // TESTING AGILUS REPORT
    // const url = `${window._env_?.VITE_BIRT_API}/run?__report=reports/Agilus/AgilusReport.rptdesign&__format=html`

    setReportUrl(url);
  }, [location.state, navigate]);

  useEffect(() => {
    if(reportUrl)
      window.open(reportUrl, '_blank');
  }, [reportUrl]);
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center">
        <button
          onClick={() => navigate("/reports-config")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Reports
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          {location.state?.reportName || "Report Viewer"}
        </h1>
      </div>

      {/* <div className="flex-1 overflow-hidden">
        {reportUrl && (
          <iframe
            src={reportUrl}
            className="w-full h-full border-0"
            title="BIRT Report"
          />
        )}
      </div> */}
    </div>
  );
};

export default ReportViewer;

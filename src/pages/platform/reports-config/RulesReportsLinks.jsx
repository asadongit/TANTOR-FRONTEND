import React, { useState } from "react";
import { MoveUpRight, Link } from "lucide-react";

import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/DataTable";
import { useRuleReportData } from "../../../hooks/platform/ruleLinkedReports";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
// import BirtReportRenderer from "../../../components/BirtReportRenderer";

const RulesReportsLinks = () => {
  const {
    data: ruleReportData = [],
    isLoading: isRuleReportLoading,
    error: ruleReportError,
    refetch: refetchRuleReport,
  } = useRuleReportData();

  const { token, hostnameV1 } = useAuth();

  const navigate = useNavigate();

  // Remove BirtReportRenderer state
  // const [showReportRenderer, setShowReportRenderer] = useState(false);
  // const [selectedReport, setSelectedReport] = useState(null);

  const actions = [
    {
      label: "View",
      icon: <MoveUpRight size={16} />,
      onClick: (row) => {
        const generateReport = async () => {
          const reportId = row.report_id;
          const reportType = row.report_type;
          const reportFileName = row.report_name;

          // If report type is LIST, open BIRT report directly
          if ((reportType || "").toUpperCase() === "LIST") {
            const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER.replace(/\\\\/g, '\\'); // Double backslashes ko single mein convert
  const reportName = `${reportFolder}\\${reportFileName}.rptdesign`; // Full path banaya
  const resourceFolder = reportFolder;

  window.open(
    `${import.meta.env.VITE_BIRT_API}/frameset?__report=${encodeURIComponent(reportName)}&__format=${
      import.meta.env.VITE_BIRT_EXPORT_FORMAT
    }&__svg=true&__locale=en_US&__timezone=PST&__masterpage=true&__rtl=false&__cubememsize=10&__resourceFolder=${encodeURIComponent(resourceFolder)}&__parameterpage=true`,
    "_blank"
  );
            return;
          }

          const headers = {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          };

          // Only check if report exists if reportType is not 'LIST'
          if ((reportType || "").toUpperCase() !== "LIST") {
            try {
              const response = await fetch(
                `${hostnameV1}/reports/${reportId}/exists`,
                { headers }
              );

              if (!response.ok)
                return toast.error(
                  "ERROR OCCURED TRYING TO CHECK IF REPORT EXISTS."
                );

              const data = await response.json();

              if (data.isExists === false)
                return toast.error(`Report with id = ${reportId} doesn't exist.`);
            } catch (error) {
              console.log(error);
              toast.error("Error occured.");
            }
          }

          try {
            const redirectResponse = await fetch(
              `${
                import.meta.env.VITE_BIRT_BACKEND_API
              }/templates/generate?report-id=${reportId}&report-name=${reportName}&report-type=${reportType}`
            );
            if (!redirectResponse.ok)
              return toast.error("ERROR OCCURED TRYING TO GENERATE REPORT.");

            console.log("Redirect Response: ", redirectResponse);
            const redirectPath = await redirectResponse.text();
            window.open(
              `${
                import.meta.env.VITE_BIRT_API
              }/frameset?__report=${redirectPath}&__format=${
                import.meta.env.VITE_BIRT_EXPORT_FORMAT
              }`,
              "_blank"
            );
          } catch (error) {
            console.log(error);
            toast.error("Error occured trying to generate report.");
          }
        };
        generateReport();
      },
    },
    {
      label: "link",
      icon: <Link size={16} />,
      onClick: (row) =>
        navigate("/config/report/lineItems", {
          state: {
            reportId: row.id,
            reportName: row.name,
          },
        }),
      show: (row) => (row.type || "").toLowerCase() !== "list",
    },
  ];

  const columns = [
    { key: "report_id", label: "ID" },
    { key: "report_name", label: "Name" },
    { key: "report_type", label: "type" },
    { key: "report_desc", label: "Description" },
    { key: "is_active", label: "Is Active" },
    { label: "Action", sortable: false },
  ];

  return (
    <div className="p-6">
      <Toaster
      //   toastOptions={{
      //   className: '',
      //   style: {
      //     border: '1px solid #713200',
      //     padding: '16px',
      //     color: '#713200',
      //   },
      //   duration: 5000,
      // }}
      />
      <DataTable
        columns={columns}
        data={ruleReportData}
        actions={actions}
        isLoading={isRuleReportLoading}
        isError={!!ruleReportError}
        refetch={refetchRuleReport}
      />
      {/* Remove BirtReportRenderer rendering */}
    </div>
  );
};

export default RulesReportsLinks;

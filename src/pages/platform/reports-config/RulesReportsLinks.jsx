import React from "react";
import { MoveUpRight, Link } from "lucide-react";

import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/DataTable";
import { useRuleReportData } from "../../../hooks/platform/ruleLinkedReports";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const RulesReportsLinks = () => {
  const {
    data: ruleReportData = [],
    isLoading: isRuleReportLoading,
    error: ruleReportError,
    refetch: refetchRuleReport,
  } = useRuleReportData();

  const { token, hostnameV1 } = useAuth();

  const navigate = useNavigate();

  const actions = [
    {
      label: "View",
      icon: <MoveUpRight size={16} />,
      onClick: async (row) => {
        const reportId = row.report_id;
        const reportType = row.report_type;
        const reportFileName = row.report_name;

        // If report type is LIST, navigate to report viewer page
        /*
        if ((reportType || "").toUpperCase() === "LIST") {
          const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER;
          const reportPath = `${reportFolder}/${reportFileName}.rptdesign`;
          
          navigate("/reports/viewer", {
            state: {
              reportPath,
              reportName: reportFileName,
              reportId
            }
          });
          return;
        }
          */


        if ((reportType || "").toUpperCase() === "LIST") {
            const reportFolder = import.meta.env.VITE_BIRT_REPORT_FOLDER; // Already in forward slashes from .env
            const reportPath = `${reportFolder}/${reportFileName}.rptdesign`; // Create relative path
          
            window.open(
              `${import.meta.env.VITE_BIRT_API}/frameset?__report=${encodeURIComponent(reportPath)}&__format=${
                import.meta.env.VITE_BIRT_EXPORT_FORMAT
              }`,
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
            }/templates/generate?report-id=${reportId}&report-name=${reportFileName}&report-type=${reportType}`
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
      show: (row) => (row.report_type || "").toLowerCase() !== "list",
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
    </div>
  );
};

export default RulesReportsLinks;

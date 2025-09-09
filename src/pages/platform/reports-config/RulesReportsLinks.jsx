import React, { useEffect, useState } from "react";
import { MoveUpRight, Link } from "lucide-react";

import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/DataTable";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { secureQuery } from '../../datagovernance/DataCatalogue/Components/function';

const RulesReportsLinks = () => {
  const { token, hostnameV1 } = useAuth();

  const navigate = useNavigate();

  const actions = [
    {
      label: "link",
      icon: <Link size={16} />,
      onClick: (row) =>
        navigate("/config/report/lineItems", {
          state: {
            reportId: row.report_id,
            reportName: row.report_name,
            reportType: row.report_type,
            reportDesc: row.reportDesc
          },
        }),
      // show: (row) => (row.report_type || "").toLowerCase() !== "list",
    },
  ];

  const columns = [
    { key: "report_id", label: "ID" },
    { key: "report_name", label: "Name" },
    { key: "report_type", label: "type" },
    { key: "report_desc", label: "Description" },
    { key: "is_active", label: "Is Active" },
    { key: "is_published", label: "Is Published" },
    { label: "Action", sortable: false },
  ];


  const [ruleReportData, setRuleReportData] = useState([]);
  const [isRuleReportLoading, setIsRuleReportsLoading] = useState(false);
  const [ruleReportError, setRuleReportError] = useState(null);

  const fetchReports = async () => {
    setIsRuleReportsLoading(true);
    setRuleReportError(null);
    try {

      const secureQueryResponse = await secureQuery({ user_query: "" }, token);
      const policyIds = secureQueryResponse.matched_policy_ids || [];

      if(policyIds.length == 0)
        return;

      const response = await fetch(`${hostnameV1}/reportdetails`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: policyIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const reportsWithSerial = data.reports
        .filter(report => report.report_type.toLowerCase() === "grid")
        .map((report, index) => ({
          ...report,
          s_no: index + 1
        }));

      setRuleReportData(reportsWithSerial);
    } catch (error) {
      setRuleReportError(error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setIsRuleReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const refetchRuleReport = () => {
    fetchReports();
  };

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

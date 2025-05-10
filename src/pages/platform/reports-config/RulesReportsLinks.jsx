import React, {useState} from "react";
import {
  MoveUpRight ,
  Link ,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/DataTable";
import { useRuleReportData } from "../../../hooks/platform/ruleLinkedReports";



const RulesReportsLinks = () => {

  const { data: ruleReportData = [], isLoading: isRuleReportLoading, error: ruleReportError, refetch: refetchRuleReport } = useRuleReportData();


  const navigate = useNavigate();


const actions = [
        {
            label: "View",
            icon: <MoveUpRight size={16} />,
            onClick: (row) => navigate("/config/report/ruleLinks"),
        },
        {
            label: "link",
            icon: <Link size={16} />,
            onClick: (row) => navigate("/config/report/lineItems"),
        },
    ];
  
  const columns = [
    { key: "sno", label: "S No" },
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "desc", label: "Description" },
    { label: "Action", sortable: false },
  ];


  return (
    <div className="p-6">
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
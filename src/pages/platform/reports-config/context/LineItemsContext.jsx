import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const LineItemsContext = createContext();

export const useLineItems = () => useContext(LineItemsContext);

export const LineItemsProvider = ({ children, reportData }) => {
  const { token, hostnameV1 } = useAuth();
  const navigate = useNavigate();
  
  const { reportId, reportName, reportType, reportDesc } = reportData || {};

  const [lineItemsHtml, setLineItemsHtml] = useState("");
  const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");
  const [lineItemConfig, setLineItemConfig] = useState([]);

  useEffect(() => {
    console.log("Final JSON ==> ", {
      regReportId: reportId,
      lineItemConfig: lineItemConfig,
    });
  }, [lineItemConfig, reportId]);

  const updateLineItemConfigRules = (lineItemId, newRules) => {
    setLineItemConfig((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.line_item === lineItemId
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].rules = newRules;
        return updated;
      }

      return [...prev, { line_item: lineItemId, rules: newRules }];
    });
  };

  const getRulesForCurrentLineItem = () => {
    return (
      lineItemConfig.find((item) => item.line_item === currentLineItemId)
        ?.rules || []
    );
  };

  useEffect(() => {
    if (!reportId) return;
    const fetchLineItems = async () => {
      console.log("reportName ==> ", reportName);
      console.log("API ==> ", import.meta.VITE_BIRT_BACKEND_API);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BIRT_BACKEND_API
          }/templates/parse?report-name=${reportName}`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (response.ok) {
          const data = await response.text();
          setLineItemsHtml(data);
        } else {
          toast.error(`Error fetching line items for report: ${reportName}`);
          navigate("/config/report");
        }
      } catch (error) {
        console.log(error);
        toast.error("Error occured when trying to fetch Line Items.");
        navigate("/config/report");
      }
    };
    fetchLineItems();
  }, [reportId, reportName, navigate]);

  const closeAllModals = () => {
    setShowLineItemConfigModal(false);
    setShowRuleOperatorSelector(false);
    setShowSummaryModal(false);
  };

  return (
    <LineItemsContext.Provider
      value={{
        reportId,
        reportName,
        reportType,
        reportDesc,
        lineItemsHtml,
        showLineItemConfigModal,
        setShowLineItemConfigModal,
        showRuleOperatorSelector,
        setShowRuleOperatorSelector,
        showSummaryModal,
        setShowSummaryModal,
        currentLineItemId,
        setCurrentLineItemId,
        lineItemConfig,
        updateLineItemConfigRules,
        getRulesForCurrentLineItem,
        closeAllModals
      }}
    >
      {children}
    </LineItemsContext.Provider>
  );
};
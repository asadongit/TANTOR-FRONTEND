import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const LineItemsContext = createContext();

export const useLineItems = () => useContext(LineItemsContext);

export const LineItemsProvider = ({ children, reportData }) => {
  const { token, hostnameV1 } = useAuth();
  const navigate = useNavigate();

  const { reportId, reportName, reportType, reportDesc, mode } = reportData || {};

  const [lineItemsHtml, setLineItemsHtml] = useState("");
  const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] =
    useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");
  const [lineItemConfig, setLineItemConfig] = useState([]);

  const [linkedLineItemIds, setLinkedLineItemIds] = useState(new Set());

  useEffect(() => {
    console.log("Final JSON ==> ", {
      regReportId: reportId,
      lineItemConfig: lineItemConfig,
    });
  }, [lineItemConfig, reportId]);

  useEffect(() => {
    if(mode === "EDIT") {
      (async () => {
        const response = await fetch(`${hostnameV1}/lineItems/reports/json?report_id=${reportId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.detail || "Failed to line items json");
        }

        const data = await response.json();
        console.log("line items json ===>", data);

        setLineItemConfig(data)
      })();
    }
  }, [])
 const updateLineItemConfigRules = (lineItemId, newRules) => {
  setLineItemConfig((prev) => {
    const existingIndex = prev.findIndex(
      (item) => item.line_item === lineItemId
    );
    
    if (existingIndex !== -1) {
      return prev.map((item, index) => 
        index === existingIndex 
          ? { ...item, rules: newRules }
          : item
      );
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

  const addReportToDatabase = async () => {
    const payload = {
      report: {
        report_id: reportId,
        report_name: reportName,
        report_desc: reportDesc,
        report_type: reportType,
        report_status: "DRAFT",
      },
    };

    const headers = {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${hostnameV1}/lineItems/reports`, {
        headers: headers,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Error Saving Report Data.");
        return;
      }

      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      console.error("Error Saving Report Data:", error);
      toast.error("Error Saving Report Data");
    }
  };

  const validateLineItemsJson = () => {
    // console.log(linkedLineItemIds);
    // console.log(`${reportId} || ${reportName} || ${reportDesc} || ${reportType}`)
    
    // Basic validation
    if (lineItemConfig.length === 0) {
      toast.error("No Line Items have been configured.");
      return false;
    }

    // Report info validation
    if (!reportId || !reportName || !reportType) {
      toast.error("Missing required report information. Please ensure all fields are filled.");
      return false;
    }

    
    for (const lineItem of lineItemConfig) {
      if (!lineItem.line_item || lineItem.rules.length === 0) {
        toast.error(`Invalid configuration for line item: ${lineItem.line_item}`);
        return false;
      }

      // Validate rules
      for (const rule of lineItem.rules) {
        if (!rule.ruleId || !rule.ruleName) {
          toast.error(`Remove empty rules.`);
          return false;
        }

        // operator validation
        if (!rule.operator) {
          toast.error(`Rule Operator Not Configured for ${lineItem.line_item.toUpperCase()} - ${rule.ruleName}`);
          return false;
        }
        if (!rule.sequence) {
          toast.error(`Kindly Configure Rule Sequence for ${lineItem.line_item.toUpperCase()} - ${rule.ruleName}`);
          return false;
        }
      }
    }

    return true;
  };

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
        closeAllModals,
        validateLineItemsJson,
        addReportToDatabase,
        setLinkedLineItemIds,
        mode
      }}
    >
      {children}
    </LineItemsContext.Provider>
  );
};

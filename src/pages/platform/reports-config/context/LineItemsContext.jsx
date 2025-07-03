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
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] =
    useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");
  const [lineItemConfig, setLineItemConfig] = useState([]);
  const [existingLineItems, setExistingLineItems] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const syncExistingLineItems = (lineItemsJson) => {
    
    setExistingLineItems(prev => {
      return lineItemsJson.map(itemJson => itemJson.line_item);
    });
  }

  const getMode = () => {
    return existingLineItems.includes(currentLineItemId) ? "EDIT" : "CREATE";
  }

  useEffect(() => {
    if(!reportId || isDataLoaded) return;

      (async () => {
        try{
          const response = await fetch(`${hostnameV1}/lineItems/reports/json?report_id=${reportId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if(response.status === 404){
          console.log("No Line Item JSON available");
        }
        else if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || "Error occured trying to fetch existing line items JSON.");
        }else{
          const data = await response.json();
          setLineItemConfig(data);
          syncExistingLineItems(data);
        }
        setIsDataLoaded(true);
      }catch(error){
        console.error(error);
        toast.error(error.message);
        setIsDataLoaded(true);
      }
      })();
  }, [currentLineItemId, setCurrentLineItemId]);

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
        
        // const response = await fetch(`${hostnameV1}/templates/parse?report_name=${reportName}`, { 
        //   headers: { "Content-Type": "application/json" } 
        // });
          
        if (response.ok) {
          const data = await response.text();
          console.log(response);
          
          setLineItemsHtml(data);
        } else {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Error fetching line items for report: ${reportName}`);
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
        getMode,
        isDataLoaded,
        setExistingLineItems,
      }}
    >
      {children}
    </LineItemsContext.Provider>
  );
};

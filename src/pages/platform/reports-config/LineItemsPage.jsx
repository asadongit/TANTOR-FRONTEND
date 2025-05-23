import React, { useEffect, useState, useRef } from "react";
import LineItemConfigModal from "./components/LineItemConfigModal";
import RuleOperatorSelector from "./components/RuleOperatorSelector";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LineItemSummary from "./components/LineItemSummaryComponent";

function LineItemsPage() {
  const { token, hostnameV1 } = useAuth();

  const reportId = useLocation().state?.reportId;
  const reportName = useLocation().state?.reportName;
  const reportType = useLocation().state?.reportType;
  const reportDesc = useLocation().state?.reportDesc;

  const [lineItemsHtml, setLineItemsHtml] = useState("");
  const contentRef = useRef(null);
  const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] =
    useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");

  const [lineItemConfig, setLineItemConfig] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("Final JSON ==> ", {
      regReportId: reportId,
      lineItemConfig: lineItemConfig,
    });
  }, [lineItemConfig]);

  const updateLineItemConfigRules = (lineItemId, newRules) => {
    setLineItemConfig((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.line_item === lineItemId
      );
      if (existingIndex != -1) {
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
  }, [reportId]);

  useEffect(() => {
    const handleClick = (event) => {
      const lineItem = event.target.closest(".line-item");
      if (lineItem) {
        const elementName = lineItem.getAttribute("name");
        setCurrentLineItemId(elementName);
        setShowLineItemConfigModal(true);
      }
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

  const closeAllModals = () => {
    setShowLineItemConfigModal(false);
    setShowRuleOperatorSelector(false);
    setShowSummaryModal(false);
  };
  // COMPONENTS
  const LineItemsHtmlComponent = () => {
    return (
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: lineItemsHtml }}
      />
    );
  };

  return (
    <>
      <div className={showLineItemConfigModal ? "hidden" : "block"}>
        <LineItemsHtmlComponent />
      </div>
      {showLineItemConfigModal && (
        <LineItemConfigModal
          setShowModal={setShowLineItemConfigModal}
          lineItemId={currentLineItemId}
          updateLineItemRules={updateLineItemConfigRules}
          rules={getRulesForCurrentLineItem()}
          showRuleOperatorSelector={showRuleOperatorSelector}
          setShowRuleOperatorSelector={setShowRuleOperatorSelector}
        />
      )}
      {showRuleOperatorSelector && (
        <RuleOperatorSelector
          lineItemId={currentLineItemId}
          rules={getRulesForCurrentLineItem()}
          isOpen={showRuleOperatorSelector}
          setIsOpen={setShowRuleOperatorSelector}
          updateRules={updateLineItemConfigRules}
          setShowLineItemModal={setShowLineItemConfigModal}
          setShowSummaryModal={setShowSummaryModal}
        />
      )}
      {showSummaryModal && (
        <LineItemSummary
          lineItemId={currentLineItemId}
          rules={getRulesForCurrentLineItem()}
          setShowSummaryModal={setShowSummaryModal}
          closeAllModals={closeAllModals}
          reportId={reportId}
          reportName={reportName}
          reportType={reportType}
          reportDesc = {reportDesc}
        />
      )}
    </>
  );
}

export default LineItemsPage;

import React, { useEffect, useRef } from "react";
import LineItemConfigModal from "./components/LineItemConfigModal";
import RuleOperatorSelector from "./components/RuleOperatorSelector";
import { useLocation } from "react-router-dom";
import { LineItemsProvider, useLineItems } from "./context/LineItemsContext";
import LineItemSummary from "./components/LineItemSummaryComponent";

function LineItemsContent() {
  const {
    lineItemsHtml,
    showLineItemConfigModal,
    showRuleOperatorSelector,
    showSummaryModal,
    setCurrentLineItemId,
    setShowLineItemConfigModal
  } = useLineItems();
  
  const contentRef = useRef(null);

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
  }, [setCurrentLineItemId, setShowLineItemConfigModal]);

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
      {showLineItemConfigModal && <LineItemConfigModal />}
      {showRuleOperatorSelector && <RuleOperatorSelector />}
      {showSummaryModal && <LineItemSummary />}
    </>
  );
}

function LineItemsPage() {
  const location = useLocation();
  const reportData = {
    reportId: location.state?.reportId,
    reportName: location.state?.reportName,
    reportType: location.state?.reportType,
    reportDesc: location.state?.reportDesc,
  };

  return (
    <LineItemsProvider reportData={reportData}>
      <LineItemsContent />
    </LineItemsProvider>
  );
}

export default LineItemsPage;

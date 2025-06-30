import React, { useEffect, useRef } from "react";
import LineItemConfigModal from "./components/LineItemConfigModal";
import RuleOperatorSelector from "./components/RuleOperatorSelector";
import { useLocation } from "react-router-dom";
import { LineItemsProvider, useLineItems } from "./context/LineItemsContext";
import LineItemSummary from "./components/LineItemSummaryComponent";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LineItemsContent() {
  const {
    lineItemsHtml,
    showLineItemConfigModal,
    showRuleOperatorSelector,
    showSummaryModal,
    setCurrentLineItemId,
    setShowLineItemConfigModal,
    validateLineItemsJson
  } = useLineItems();

  const contentRef = useRef(null);
  const navigate = useNavigate();

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
      {/* <div className={`text-center ${showLineItemConfigModal ? "hidden" : "block"}`}>
        <button
          className="bg-[#8e78b7] px-3 py-2 rounded-lg ring-1 ring-[#56486e] text-white font-semibold hover:bg-[#61527d]"
          onClick={handleSave}
        >
          SAVE
        </button>
      </div> */}
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
    // mode: location.state?.mode || "CREATE",
  };

  return (
    <LineItemsProvider reportData={reportData}>
      <LineItemsContent />
    </LineItemsProvider>
  );
}

export default LineItemsPage;

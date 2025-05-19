import React, { useEffect, useState, useRef } from "react";
import LineItemConfigModal from "./components/LineItemConfigModal";
import RuleOperatorSelector from "./components/RuleOperatorSelector";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function LineItemsPage() {
  const {token, hostnameV1} = useAuth();

  const reportId = useLocation().state?.reportId;
  const reportName = useLocation().state?.reportName;

  const [lineItemsHtml, setLineItemsHtml] = useState("");
  const contentRef = useRef(null);
  const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] =
    useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");

  const [lineItemConfig, setLineItemConfig] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("Final JSON ==> ", {
      regReportId: reportId,
      lineItemConfig: lineItemConfig,
    });
  }, [lineItemConfig]);

  const handleSaveLineItemMappings = () => {
  const payload = {
    regReportId: reportId,
    lineItemConfig: lineItemConfig,
  };
  
  const uploadData = async () => {
    const headers = {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${hostnameV1}/lineItems`, {
        headers: headers,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Error Saving Data into DB.");
        return;
      }

      await response.json();
      toast.success("Line Items Successfully Stored.");
      navigate("/config/report");
    } catch (error) {
      console.error("Error during save:", error);
      toast.error("Unexpected error during save.");
    }
  };

  uploadData();
};

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
          `${import.meta.env.VITE_BIRT_BACKEND_API}/templates/parse?report-name=${reportName}`,
          {headers: {'Content-Type': 'application/json'}}
        );
        if (response.ok) {
          const data = await response.text();
          setLineItemsHtml(data);
        }else{
          toast.error(`Error fetching line items for report: ${reportName}`)
          navigate("/config/report")
        }
      } catch (error) {
        console.log(error);
        toast.error("Error occured when trying to fetch Line Items.")
        navigate("/config/report")
      }
    };
    fetchLineItems();
  }, [reportId]);

  useEffect(() => {
    if (!contentRef.current || !lineItemsHtml) return;

    const handleClick = (event) => {
      const lineItem = event.target.closest(".line-item");
      if (lineItem) {
        const elementName = lineItem.getAttribute("name");
        setCurrentLineItemId(elementName);
        setShowLineItemConfigModal(true);
      }
    };

    contentRef.current.addEventListener("click", handleClick);
    return () => contentRef.current?.removeEventListener("click", handleClick);
  }, [lineItemsHtml, showLineItemConfigModal, showRuleOperatorSelector]);

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
      <ToastContainer />
      {!showLineItemConfigModal && <LineItemsHtmlComponent />}
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
        />
      )}

      {!showLineItemConfigModal && (
        <div className="text-center">
          <button
            className="bg-[#8E77BB] text-white hover:bg-[#7864a3] px-4 py-2 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#8E77BB] focus:ring-opacity-50 transition-colors duration-200"
            onClick={handleSaveLineItemMappings}
          >
            SAVE
          </button>
        </div>
      )}
    </>
  );
}

export default LineItemsPage;

import React, { useEffect, useState, useRef } from "react";
import LineItemConfigModal from "./components/LineItemConfigModal";
import RuleOperatorSelector from "./components/RuleOperatorSelector";
import { useLocation } from "react-router-dom";
import { SaveIcon } from "lucide-react";
import toast from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom"; 

// STATE 0
function LineItemsPage() {
  const navigate = useNavigate();

  const reportId = useLocation().state?.reportId;
  const reportName = useLocation().state?.reportName;

  const [lineItemsHtml, setLineItemsHtml] = useState("");
  const contentRef = useRef(null);
  const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
  const [showRuleOperatorSelector, setShowRuleOperatorSelector] =
    useState(false);
  const [currentLineItemId, setCurrentLineItemId] = useState("");

  const [lineItemConfig, setLineItemConfig] = useState([]);

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
        authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhUlJoQV8yeDJSc09ac1VFLVROdk1ucUJ4cEE0X0NLeW84bnVPcUdyTjdNIn0.eyJleHAiOjE3NDY1MjYxNDcsImlhdCI6MTc0NjUyNDUyNywianRpIjoiZjVhMjdjYjYtYmQ2Mi00YjU4LTliYTQtNDkzNWQ3ODM2YjRlIiwiaXNzIjoiaHR0cHM6Ly9rZXljbG9hay50YW50b3IuaW8vcmVhbG1zL0dhdGVrZWVwZXIiLCJhdWQiOlsiR2VuQUkiLCJyZWFsbS1tYW5hZ2VtZW50Iiwibm92aGkiLCJhY2NvdW50Il0sInN1YiI6IjE0YTZiODk3LTIzMzUtNGNiYS04ZTA5LWE0MjkxMTNkNjViOSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImRhcmNoIiwic2Vzc2lvbl9zdGF0ZSI6IjQyZDhlYWE2LWVjN2UtNDg1ZS05NGMxLWVhOTg4MGVmMGVhOSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGF0YSBBY2Nlc3MgVmlld2VyIiwiRGF0YV9RdWVyeV9FeGVjdXRvciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWdhdGVrZWVwZXIiLCJCSV9SZXBvcnRfVmlld2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiR2VuQUkiOnsicm9sZXMiOlsiR2xvYmFsIl19LCJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbIm1hbmFnZS1yZWFsbSIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXVzZXJzIl19LCJub3ZoaSI6eyJyb2xlcyI6WyJkZWZhdWx0Il19LCJkYXJjaCI6eyJyb2xlcyI6WyJnbG9iYWwtYWRtaW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUiLCJzaWQiOiI0MmQ4ZWFhNi1lYzdlLTQ4NWUtOTRjMS1lYTk4ODBlZjBlYTkiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJub3Zpam90aCBzaW5naCIsImdyb3VwcyI6WyIvVlZfR1JPVVAoUGVyc29uYSkvVlZfR1JPVVAiLCIvVlZfR1JPVVAoUGVyc29uYSkiXSwicHJlZmVycmVkX3VzZXJuYW1lIjoibm92aWpvdGgiLCJnaXZlbl9uYW1lIjoibm92aWpvdGgiLCJmYW1pbHlfbmFtZSI6InNpbmdoIiwiZW1haWwiOiJub3Zpam90aEB0cmFuc2xhYi5pbyJ9.KzYazqNm2r-_Q-V_ybqJNsQXA93wupZGl9FBMQjBmFWFYfgj0NC00pZkl6QcdM5RA8-Ybl-cFB6FOvMu3TfdVO5u5IaOk8PJv4PVtlAfi73_-8yqq0ZVPIj5RaKW2Diebx93F5AeNlVU6Nzce64QQA5mkwlx078XhrFX6OgRHa3YNWRHMPLOqHsnbEvKXRi7B1OSe_JQDfoIPYaNI_bO6f6TZzSY5MmVbpny7FlVRCRJ87Aex7Te5XrgcvGIl0Q4BSu-CoqiQQ6cQwKQNuetnmyorrFTzAJ079d4lNM4p2dOMkPe8eHZTJx0elNNzL-r595cQpnEiNMEpkUKN2PuRg",
      };
      
      const response = await fetch("http://localhost:8000/api/v1/lineItems", {
        headers: headers,
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) return toast.error("Error Saving Data into DB.");

      await response.json();
      toast.success("Data saved into DB");

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
      try {
        const response = await fetch(
          `http://localhost:8080/templates/parse?report-name=${reportName}`
        );
        if (response.ok) {
          const data = await response.text();
          setLineItemsHtml(data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error occured when trying to fetch Line Items.")
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

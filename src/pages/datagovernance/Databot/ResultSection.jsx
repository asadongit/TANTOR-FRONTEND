import { useEffect, useState } from "react";
import ResultTab from "./TabbedSection/ResultTab";
import { useDatabotContext } from "./context/DatabotContext";
import { ICON_SVGS, TOOL_NAMES } from "../../../hooks/dataGovernance/Databot/constants";

const ResultSection = () => {
  const { databot, switchTab } = useDatabotContext();
  const activeTab = databot.curr_tab;
  const isRelationshipLoading = databot.is_loading;

  return (
    <div className="px-6 py-3 bg-white rounded-md overflow-y-auto">
      <div className="flex justify-between items-center gap-5 w-full">
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => switchTab("relationship")}
            className={`${
              activeTab === "relationship"
                ? `bg-purple-200 text-[#8d77ba]`
                : `hover:text-[#8d77ba] text-gray-500 hover:bg-purple-200 `
            }
                flex border-r p-2 px-4 gap-2 rounded-lg`}
          >
            {ICON_SVGS[TOOL_NAMES.RELATIONSHIP]}

            <span>Relationship</span>
          </button>

          <button
            onClick={() => switchTab("lineage")}
            className={`${
              activeTab === "lineage"
                ? `bg-purple-200 text-[#8d77ba]`
                : `hover:text-[#8d77ba] text-gray-500 hover:bg-purple-200 `
            }
                flex border-r p-2 px-4 gap-2 rounded-lg`}
          >
            {ICON_SVGS[TOOL_NAMES.LINEAGE]}

            <span>Lineage</span>
          </button>

          <button
            onClick={() => switchTab("impact")}
            className={`${
              activeTab === "impact"
                ? `bg-purple-200 text-[#8d77ba]`
                : `hover:text-[#8d77ba] text-gray-500 hover:bg-purple-200 `
            }
                flex border-r p-2 px-4 gap-2 rounded-lg`}
          >
            {ICON_SVGS[TOOL_NAMES.IMPACT]}

            <span>Impact</span>
          </button>

          <button
            onClick={() => switchTab("dependency")}
            className={`${
              activeTab === "dependency"
                ? `bg-purple-200 text-[#8d77ba]`
                : `hover:text-[#8d77ba] text-gray-500 hover:bg-purple-200 `
            }
                flex border-r p-2 px-4 gap-2 rounded-lg`}
          >
            {ICON_SVGS[TOOL_NAMES.DEPENDENCY]}

            <span>Dependency</span>
          </button>
        </div>
      </div>

      {isRelationshipLoading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-[#8d77ba] animate-pulse">Loading...</span>
        </div>
      ) : (
        <ResultTab activeTab={activeTab} />
      )}
    </div>
  );
};

export default ResultSection;

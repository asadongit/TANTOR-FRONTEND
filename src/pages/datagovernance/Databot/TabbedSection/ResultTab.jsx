import { useEffect, useState } from "react";
import { useDatabotAPI } from "../../../../hooks/dataGovernance/Databot/useDatabotAPI";
import { useDatabotContext } from "../context/DatabotContext";
import toast from "react-hot-toast";
import { TOOL_NAMES } from "../../../../hooks/dataGovernance/Databot/constants";
import DatabotGraphPlot from "../DatabotGraphPlot";

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

const ResultTab = ({activeTab}) => {

  const { databot, 
    setRelationshipResultGlobal,
    selectedConnectionGlobal,
    selectedSchemaGlobal,
    setlineageResultGlobal, 
    setImpactResultGlobal, 
    setDependencyResultGlobal } = useDatabotContext();

  const { getRelationshipAPI,
    getLineageAPI, 
    getImpactAPI, 
    getDependencyAPI, 
    loading } = useDatabotAPI();

  const hasIrrelevant = databot.queries.some(item => item.a === "Irrelevant query!");
  const suggestedTool = databot.suggested_tool;
  const suggestedTool_lowerCase = suggestedTool
  ? suggestedTool[0].toLowerCase() + suggestedTool.slice(1)
  : "";


  const fetchResults = async () => {
    if(databot.curr_input && hasIrrelevant && Object.keys(databot?.result[activeTab]).length === 0) {
      if(activeTab === "relationship" && suggestedTool_lowerCase === TOOL_NAMES.RELATIONSHIP) {
        const resp = await getRelationshipAPI(databot.curr_input, selectedConnectionGlobal, selectedSchemaGlobal); 
        setRelationshipResultGlobal(resp, databot.curr_input);

      } else if (activeTab === "lineage" && suggestedTool_lowerCase === TOOL_NAMES.LINEAGE) {
        const resp = await getLineageAPI(databot.curr_input, selectedConnectionGlobal, selectedSchemaGlobal); 
        setlineageResultGlobal(resp, databot.curr_input);

      } else if(activeTab === "impact" && suggestedTool_lowerCase === TOOL_NAMES.IMPACT) {
        const resp = await getImpactAPI(databot.curr_input, selectedConnectionGlobal, selectedSchemaGlobal); 
        setImpactResultGlobal(resp, databot.curr_input);


      } else if(activeTab === "dependency" && suggestedTool_lowerCase === TOOL_NAMES.DEPENDENCY) {
        const resp = await getDependencyAPI(databot.curr_input, selectedConnectionGlobal, selectedSchemaGlobal);
        setDependencyResultGlobal(resp, databot.curr_input)
      }
    }
  };

  useEffect(() => {
    fetchResults();
  }, [activeTab, databot.curr_input]);
  
  return (
    <div className="p-4 pt-8 bg-white w-full h-auto overflow-auto">
      {loading 
      ? <div className="flex justify-center items-center h-40">
          <span className="text-[#8d77ba] animate-pulse">Loading...</span>
        </div>
      : <>
        <h1 className="text-xl">
          {capitalizeFirstLetter(activeTab)} View
        </h1>

        {databot?.result[activeTab]?.errMsg?.length > 0
        ? <>
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-400 text-red-700 flex items-center gap-3 shadow-sm">
            <span className="font-mono font-bold text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
              {databot.result[activeTab].errCode}
            </span>
            <span className="text-sm">
              {databot.result[activeTab].errMsg}
            </span>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#8d77ba]/10 border border-[#8d77ba] text-[#8d77ba] flex items-center gap-3 shadow-sm">
            <span className="text-sm">
              Please ask question related to {databot.curr_tab}.
            </span>
          </div>
          </>

        : (databot.result[activeTab].graphData?.nodes?.length > 0 || databot.result[activeTab].graphData?.links?.length > 0) ?
          <div className="flex-1 overflow-hidden mt-3">
            <DatabotGraphPlot graphData={databot?.result[activeTab]?.graphData}/>
          </div> :

          <div className="mt-4 p-3 rounded-xl bg-[#8d77ba]/10 border border-[#8d77ba] text-[#8d77ba] flex items-center gap-3 shadow-sm">
            <span className="text-sm">
              Please ask question related to {databot.curr_tab}.
            </span>
          </div>
        }
        </>}

    </div>
    
  )
}

export default ResultTab;
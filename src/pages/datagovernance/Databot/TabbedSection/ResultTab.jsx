import { useEffect, useState } from "react";
import { useDatabotAPI } from "../../../../hooks/dataGovernance/Databot/useDatabotAPI";
import { useDatabotContext } from "../../../../hooks/dataGovernance/DatabotContext";
import toast from "react-hot-toast";

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

const ResultTab = ({tab_name='relationship'}) => {

  const { databot, 
    setRelationshipResultGlobal,
    setlineageResultGlobal, 
    setImpactResultGlobal, 
    setDependencyResultGlobal } = useDatabotContext();
  const { getRelationshipAPI,
    getLineageAPI, 
    getImpactAPI, 
    getDependencyAPI, 
    loading } = useDatabotAPI();

  const hasIrrelevant = databot.queries.some(item => item.a === "Irrelevant query!");

  const fetchResults = async () => {
    if(databot.curr_input && hasIrrelevant && Object.keys(databot?.result[tab_name]).length === 0) {
      if(tab_name === "relationship") {
        const resp = await getRelationshipAPI(databot.curr_input); 
        setRelationshipResultGlobal(resp, databot.curr_input);

      } else if (tab_name === "lineage") {
        const resp = await getLineageAPI(databot.curr_input); 
        setlineageResultGlobal(resp, databot.curr_input);

      } else if(tab_name === "impact") {
        const resp = await getImpactAPI(databot.curr_input); 
        setImpactResultGlobal(resp, databot.curr_input);

      } else if(tab_name === "dependency") {
        const resp = await getDependencyAPI(databot.curr_input);
        setDependencyResultGlobal(resp, databot.curr_input)
      }
    }
  };

  useEffect(() => {
    fetchResults();
  }, [tab_name, databot.curr_input]);
  
  return (
    <div className="p-4 pt-8">
      {loading 
      ? <div className="flex justify-center items-center h-40">
          <span className="text-[#8d77ba] animate-pulse">Loading...</span>
        </div>
      : <>
        <h1 className="text-xl">
          {capitalizeFirstLetter(tab_name)} View
        </h1>
        {/* <div>
          {capitalizeFirstLetter(tab_name)} View for {databot.result[tab_name]?.tables?.join(" & ")}
        </div> */}

        {databot?.result[tab_name]?.errMsg?.length > 0
        ? <>
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-400 text-red-700 flex items-center gap-3 shadow-sm">
            <span className="font-mono font-bold text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
              {databot.result[tab_name].errCode}
            </span>
            <span className="text-sm">
              {databot.result[tab_name].errMsg}
            </span>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#8d77ba]/10 border border-[#8d77ba] text-[#8d77ba] flex items-center gap-3 shadow-sm">
            <span className="text-sm">
              Please ask question related to {databot.curr_tab}.
            </span>
          </div>
          </>

        : databot?.result[tab_name]?.img ?
          <div>
            <img
              src={`data:image/svg+xml;base64,${databot?.result[tab_name]?.img}`}
              alt="Graph"
              className="w-full h-auto pt-5"
            />
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
import React, { createContext, useContext, useState, useCallback } from "react";
import { useDatabotAPI } from "../../../../hooks/dataGovernance/Databot/useDatabotAPI";
import { TOOL_NAMES } from "../../../../hooks/dataGovernance/Databot/constants";

const DatabotContext = createContext();

export const DatabotProvider = ({ children }) => {
  const { getRelationshipAPI, getLineageAPI, 
    getImpactAPI, getDependencyAPI } = useDatabotAPI();

  const [databot, setDatabot] = useState({
    curr_input: "",
    curr_tab: "relationship",
    is_loading: false,
    queries: [], // Each entry will be -> {"q": "who are you", "a": null|"i am databot"}
    result: {
      relationship: {},
      lineage: {},
      impact: {},
      dependency: {},
    },
  });

  const resetChat = () => {
    setDatabot({
      curr_input: "",
      curr_tab: "relationship",
      is_loading: false,
      queries: [], // Each entry will be -> {"q": "who are you", "a": null|"i am databot"}
      result: {
        relationship: {},
        lineage: {},
        impact: {},
        dependency: {},
      },
    });
  };

  const switchTab = (tabName) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: tabName,
    }));
  };


  const setRelationshipResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool || TOOL_NAMES.RELATIONSHIP,
      suggested_tool: resp?.metadata?.suggested_tool || "",
      queries: prev?.queries?.map((query) =>
        query.q === ques
          ? {
              q: ques,
              a: resp?.explanation,
            }
          : query
      ),
      result: {
        ...prev.result,
        relationship: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
          graphData: {
            nodes: resp?.graph?.nodes,
            links: resp?.graph?.edges
          }
        }
      }
    }))
  };

  const setlineageResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool || TOOL_NAMES.LINEAGE,
      suggested_tool: resp?.metadata?.suggested_tool || "",
      queries: prev?.queries?.map((query) =>
        query.q === ques
          ? {
              q: ques,
              a: resp?.explanation,
            }
          : query
      ),
      result: {
        ...prev.result,
        lineage: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
          graphData: {
            nodes: resp?.graph?.nodes,
            links: resp?.graph?.edges
          }
        }
      }
    }))
  }

  const setImpactResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool || TOOL_NAMES.IMPACT,
      suggested_tool: resp?.metadata?.suggested_tool || "",
      queries: prev?.queries?.map((query) =>
        query.q === ques
          ? {
              q: ques,
              a: resp?.explanation,
            }
          : query
      ),
      result: {
        ...prev.result,
        impact: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
          graphData: {
            nodes: resp?.graph?.nodes,
            links: resp?.graph?.edges
          }
        }
      }
    }))
  }

  const setDependencyResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool || TOOL_NAMES.DEPENDENCY,
      suggested_tool: resp?.metadata?.suggested_tool || "",
      queries: prev?.queries?.map((query) =>
        query.q === ques
          ? {
              q: ques,
              a: resp?.explanation,
            }
          : query
      ),
      result: {
        ...prev.result,
        dependency: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
          graphData: {
            nodes: resp?.graph?.nodes,
            links: resp?.graph?.edges
          }
        }
      }
    }))
  }

  // Connection and schema
  const [selectedConnectionGlobal, setSelectedConnectionGlobal] = useState("");
  const handleSelectedConnectionGlobal = (val) => {
    setSelectedConnectionGlobal(val)
  }

  const [selectedSchemaGlobal, setSelectedSchemaGlobal] = useState("");
  const handleSelectedSchemaGlobal = (val) => {
    setSelectedSchemaGlobal(val)
  }

  const [policyIdsGlobal, setPolicyIds] = useState([]);
  const handlePolicyIdsGlobal = (val) => {
    setPolicyIds(val)
  }

  const [isRefreshed, setIsRefreshed] = useState(false);
  const handleIsRefreshed = (val) => {
    setIsRefreshed(val);
  }

  const [firstSelectedTab, setFirstSelectedTab] = useState("");
  const handleFirstSelectedTab = (tab) => {
    setFirstSelectedTab(tab)
  }

  const triggerNewQuestion = async (ques, curr_tab) => {
    // State update for question
    setDatabot((prev) => ({
      ...prev,
      curr_input: ques,
      curr_tab: curr_tab,
      is_loading: true,
      queries: [
        ...prev.queries,
        {
          q: ques,
          a: null,
        },
      ],
      result: { 
        relationship: {},
        lineage: {},
        impact: {},
        dependency: {},
      },
    }));

    // API call
    let resp;
    if(curr_tab === "relationship") {
      resp = await getRelationshipAPI(ques, selectedConnectionGlobal, selectedSchemaGlobal);

    } else if(curr_tab === "lineage") {
      resp = await getLineageAPI(ques, selectedConnectionGlobal, selectedSchemaGlobal);

    } else if(curr_tab === "impact") {
      resp = await getImpactAPI(ques, selectedConnectionGlobal, selectedSchemaGlobal);

    } else if(curr_tab === "dependency") {
      resp = await getDependencyAPI(ques, selectedConnectionGlobal, selectedSchemaGlobal);
    }

    // State update for ans and result
    setDatabot((prev) => ({
      ...prev,
      is_loading: false,
      curr_tab: resp?.metadata?.tool || prev.curr_tab,
      suggested_tool: resp?.metadata?.suggested_tool,
      queries: prev?.queries?.map((query) =>
        query.q === ques
          ? {
              q: ques,
              a: resp?.explanation,
            }
          : query
      ),
      result: {
        ...prev.result,
        [resp?.metadata?.tool || prev.curr_tab]: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
          graphData: {
            nodes: resp?.graph?.nodes,
            links: resp?.graph?.edges
          }
        },
      },
    }));
  };

  const [relationshipResponse, setRelationshipResponse] = useState([]);
  const handleRelationshipResponse = (res) => {
    setRelationshipResponse(res);
  };

  const [isRelationshipLoading, setIsRelationshipLoading] = useState(false);
  const handleIsRelationshipLoading = (val) => {
    setIsRelationshipLoading(val);
  };

  return (
    <DatabotContext.Provider
      value={{
        databot,
        relationshipResponse,
        handleRelationshipResponse,
        setRelationshipResultGlobal,
        setlineageResultGlobal,
        setImpactResultGlobal,
        setDependencyResultGlobal,
        isRelationshipLoading,
        handleIsRelationshipLoading,
        triggerNewQuestion,
        switchTab,
        resetChat,
        selectedConnectionGlobal,
        handleSelectedConnectionGlobal,
        selectedSchemaGlobal,
        handleSelectedSchemaGlobal,
        policyIdsGlobal,
        handlePolicyIdsGlobal,
        isRefreshed,
        handleIsRefreshed,
        firstSelectedTab,
        handleFirstSelectedTab
      }}
    >
      {children}
    </DatabotContext.Provider>
  );
};

export const useDatabotContext = () => useContext(DatabotContext);

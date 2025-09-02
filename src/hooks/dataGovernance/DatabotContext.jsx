import React, { createContext, useContext, useState, useCallback } from "react";
import { useDatabotAPI } from "./Databot/useDatabotAPI";

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

  const triggerNewQuestion = async (ques, curr_tab) => {
    // State update for question
    setDatabot((prev) => ({
      ...prev,
      curr_input: ques,
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
      resp = await getRelationshipAPI(ques);

    } else if(curr_tab === "lineage") {
      resp = await getLineageAPI(ques);

    } else if(curr_tab === "impact") {
      resp = await getImpactAPI(ques);

    } else if(curr_tab === "dependency") {
      resp = await getDependencyAPI(ques);
    }
    console.log(`Q: ${ques} has ans: ${resp}`);

    // State update for ans and result
    setDatabot((prev) => ({
      ...prev,
      is_loading: false,
      curr_tab: resp?.metadata?.tool,
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
        [resp?.metadata?.tool]: {
          tables: resp?.metadata?.entities?.tables,
          img: resp?.graph_b64,
          errCode: resp?.metadata?.err_code,
          errMsg: resp?.metadata?.err_msg,
        },
      },
    }));
  };

  // const createNewChat = (val, ans) => {
  //   setDatabot((prev) => ({
  //     ...prev,
  //     chats: prev.chats.map((chat) =>
  //       chat.id === prev.activeChatId
  //         ? {
  //             ...chat,
  //             // curr_input: val,
  //             queries: [...chat.queries, { ques: val, ans }],
  //           }
  //         : chat
  //     ),
  //   }));
  // };

  const setRelationshipResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool,
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
        }
      }
    }))
  };

  const setlineageResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool,
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
        }
      }
    }))
  }

  const setImpactResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool,
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
        }
      }
    }))
  }

  const setDependencyResultGlobal = (resp, ques) => {
    setDatabot((prev) => ({
      ...prev,
      curr_tab: resp?.metadata?.tool,
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
        }
      }
    }))
  }

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
      }}
    >
      {children}
    </DatabotContext.Provider>
  );
};

export const useDatabotContext = () => useContext(DatabotContext);

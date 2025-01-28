import React, { createContext, useContext, useState, useEffect } from "react";

const StateContext = createContext();

export const ContextProvider = ({ children }) => {
    const [viewPayload, setViewPayload] = useState([]);
    const handleViewPayload = (val) => {
      setViewPayload(val);
    }

    const [connectionPayload, setConnectionPayload] = useState({});
    const handleConnectionPayload = (val) => {
      setConnectionPayload(val);
    }

    const [consolidationPayload, setConsolidationPayload] = useState([]);
    const handleConsolidationPayload = (val) => {
        setConsolidationPayload((prevPayload) => {
          return [
            ...prevPayload, 
            val, 
          ];
        });
      };


      const [joinPayload, setJoinPayload] = useState({});
      const handleJoinPayload = (val) => {
        setJoinPayload(val);
      };

    return (
        <StateContext.Provider
          value={{
            viewPayload,
            handleViewPayload,
            consolidationPayload,
            handleConsolidationPayload,
            connectionPayload,
            handleConnectionPayload,
            joinPayload,
            handleJoinPayload
          }}
        >
          {children}
        </StateContext.Provider>
      );
    };
    
    export const useStateContext = () => useContext(StateContext);
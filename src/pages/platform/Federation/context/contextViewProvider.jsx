import React, { createContext, useContext, useState, useEffect } from "react";

const StateContext = createContext();

export const ContextViewProvider = ({ children }) => {
    const [viewPayload, setViewPayload] = useState([]);
    const handleViewPayload = (val) => {
      setViewPayload(val);
    }

    const [connectionPayload, setConnectionPayload] = useState([]);
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


      const [finalPayload, setFinalPayload] = useState({});
      const handleFinalPayload = (val) => {
        setFinalPayload(val);
      };

      const [complexCheck, setComplexCheck] = useState(false);

      const [columnSettings, setColumnSettings] = useState({});

       // Source View States
       const [userSelections, setUserSelections] = useState(new Map());
       const [settingsList, setSettingsList] = useState([]);
       const [userCheckedColumns, setUserCheckedColumns] = useState([]);

       useEffect(() => {
        console.log(`Context ==== UserSelection => `, userSelections);
       }, [userSelections])
    return (
        <StateContext.Provider
          value={{
            viewPayload,
            handleViewPayload,
            consolidationPayload,
            handleConsolidationPayload,
            connectionPayload,
            handleConnectionPayload,
            finalPayload,
            handleFinalPayload,
            complexCheck, 
            setComplexCheck,
            columnSettings,
            setColumnSettings,
            settingsList, setSettingsList,
            userSelections, setUserSelections,
            userCheckedColumns, setUserCheckedColumns,
          }}
        >
          {children}
        </StateContext.Provider>
      );
    };
    
    export const useStateContext = () => useContext(StateContext);
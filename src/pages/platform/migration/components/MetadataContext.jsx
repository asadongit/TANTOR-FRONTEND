import React, { createContext, useState, useContext } from "react";

const MetadataContext = createContext({
  metadataNodes: [],
  setMetadataNodes: () => {},
  metadataData: {},
  setMetadataData: () => {},
  updateMetadataNodeData: () => {},
});

export const MetadataProvider = ({ children }) => {
  const [metadataNodes, setMetadataNodes] = useState([
    { id: "define", label: "Define Metadata", type: "define" },
    { id: "source", label: "Source Metadata", type: "source" },
    { id: "target", label: "Target Metadata", type: "target" },
  ]);

  const [metadataData, setMetadataData] = useState({});
  const updateMetadataNodeData = (nodeId, data) => {
    setMetadataData((prev) => {
      const existingNode = prev[nodeId] || {};
      const updatedNode = { ...existingNode, ...data };

      if (JSON.stringify(existingNode) === JSON.stringify(updatedNode)) {
        return prev;
      }

      if (updatedNode.type === "define" && !updatedNode.name) {
        const sourceNode = Object.values(prev).find((node) => node.type === "source");
        if (sourceNode && sourceNode.connection && sourceNode.schema) {
          updatedNode.name = `${sourceNode.connection}_${sourceNode.schema}`;
        }
      }

      return {
        ...prev,
        [nodeId]: updatedNode,
      };
    });
  };

//   React.useEffect(() => {
//     console.log("Metadata Data:", metadataData);
//   }, [ metadataData]);

  return (
    <MetadataContext.Provider
      value={{
        metadataNodes,
        setMetadataNodes,
        metadataData,
        setMetadataData,
        updateMetadataNodeData,
      }}
    >
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = () => useContext(MetadataContext);

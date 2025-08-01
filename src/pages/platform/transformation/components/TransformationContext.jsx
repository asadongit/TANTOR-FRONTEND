import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

const initialState = {
  define: {
    name: "",
    description: "",
  },
  sources: {},
  transformations: {},
  targets: {},
  connections: [],
  selectedSourceColumnsSet: {},
  targetToSelectedSourceMap: {},
  procedureExecution: {},
  originalSourceColumns: {}, // New property to store original selections
  preservedTargetMappings: {}, // New property to maintain target mappings across edit sessions
  sourceOriginalColumns: {}, // <-- Add this for original columns per source node
};

const ACTION_TYPES = {
  UPDATE_DEFINE: 'UPDATE_DEFINE',
  ADD_SOURCE: 'ADD_SOURCE',
  UPDATE_SOURCE: 'UPDATE_SOURCE',
  REMOVE_SOURCE: 'REMOVE_SOURCE',
  ADD_TRANSFORMATION: 'ADD_TRANSFORMATION',
  UPDATE_TRANSFORMATION: 'UPDATE_TRANSFORMATION',
  REMOVE_TRANSFORMATION: 'REMOVE_TRANSFORMATION',
  ADD_TARGET: 'ADD_TARGET',
  UPDATE_TARGET: 'UPDATE_TARGET',
  REMOVE_TARGET: 'REMOVE_TARGET',
  SET_CONNECTIONS: 'SET_CONNECTIONS',
  ADD_CONNECTION: 'ADD_CONNECTION',
  REMOVE_CONNECTION: 'REMOVE_CONNECTION',
  RESET: 'RESET',
  UPDATE_SELECTED_SOURCE_COLUMNS: 'UPDATE_SELECTED_SOURCE_COLUMNS',
  UPDATE_TARGET_SELECTED_SOURCE: 'UPDATE_TARGET_SELECTED_SOURCE',
  UPDATE_PROCEDURE_EXECUTION: 'UPDATE_PROCEDURE_EXECUTION',
  REMOVE_PROCEDURE_EXECUTION: 'REMOVE_PROCEDURE_EXECUTION', // New action type
  SET_ORIGINAL_SOURCE_COLUMNS: 'SET_ORIGINAL_SOURCE_COLUMNS', // New action type
  PRESERVE_TARGET_MAPPING: 'PRESERVE_TARGET_MAPPING', // New action type
  RESTORE_TARGET_MAPPINGS: 'RESTORE_TARGET_MAPPINGS', // New action type
  SET_SOURCE_ORIGINAL_COLUMNS: 'SET_SOURCE_ORIGINAL_COLUMNS', // <-- Add new action type
};

function transformationReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_DEFINE:
      return {
        ...state,
        define: {
          ...state.define,
          ...action.payload,
        }
      };

    case ACTION_TYPES.ADD_SOURCE:
      return {
        ...state,
        sources: {
          ...state.sources,
          [action.payload.id]: {
            ...action.payload.data,
            alias: action.payload.data.alias
          }
        }
      };

    case ACTION_TYPES.UPDATE_SOURCE:
      return {
        ...state,
        sources: {
          ...state.sources,
          [action.payload.id]: {
            ...state.sources[action.payload.id],
            ...action.payload.data
          }
        }
      };

    case ACTION_TYPES.REMOVE_SOURCE:
      const { [action.payload]: _, ...remainingSources } = state.sources;
      return {
        ...state,
        sources: remainingSources
      };

    case ACTION_TYPES.ADD_TRANSFORMATION:
      return {
        ...state,
        transformations: {
          ...state.transformations,
          [action.payload.id]: action.payload.data
        }
      };

    case ACTION_TYPES.UPDATE_TRANSFORMATION:
      return {
        ...state,
        transformations: {
          ...state.transformations,
          [action.payload.id]: {
            ...state.transformations[action.payload.id],
            ...action.payload.data
          }
        }
      };

    case ACTION_TYPES.REMOVE_TRANSFORMATION:
      const { [action.payload]: __, ...remainingTransformations } = state.transformations;
      return {
        ...state,
        transformations: remainingTransformations
      };

    case ACTION_TYPES.ADD_TARGET:
      return {
        ...state,
        targets: {
          ...state.targets,
          [action.payload.id]: {
            ...action.payload.data,
            alias: action.payload.data.alias,
            targetMapping: action.payload.data.targetMapping ||
                          state.preservedTargetMappings[action.payload.id] || {}
          }
        }
      };

    case ACTION_TYPES.UPDATE_TARGET:
      const newTargetMapping = action.payload.data.targetMapping ||
                              state.targets[action.payload.id]?.targetMapping ||
                              state.preservedTargetMappings[action.payload.id] || {};


      if (Object.keys(newTargetMapping).length > 0) {
        state.preservedTargetMappings[action.payload.id] = {...newTargetMapping};
      }

      return {
        ...state,
        targets: {
          ...state.targets,
          [action.payload.id]: {
            ...state.targets[action.payload.id],
            ...action.payload.data,
            targetMapping: newTargetMapping
          }
        }
      };

    case ACTION_TYPES.REMOVE_TARGET:
      const { [action.payload]: ___, ...remainingTargets } = state.targets;
      return {
        ...state,
        targets: remainingTargets
      };

    case ACTION_TYPES.SET_CONNECTIONS:
      return {
        ...state,
        connections: action.payload
      };

    case ACTION_TYPES.ADD_CONNECTION:
      return {
        ...state,
        connections: [...state.connections, action.payload]
      };

    case ACTION_TYPES.REMOVE_CONNECTION:
      return {
        ...state,
        connections: state.connections.filter(
          conn => !(conn.source === action.payload.source && conn.target === action.payload.target)
        )
      };

    case ACTION_TYPES.UPDATE_SELECTED_SOURCE_COLUMNS: {

      const { sourceNodeId, columns } = action.payload;
      return {
        ...state,
        selectedSourceColumnsSet: {
          ...state.selectedSourceColumnsSet,
          [sourceNodeId]: new Set(columns)
        }
      };
    }
    case ACTION_TYPES.UPDATE_TARGET_SELECTED_SOURCE: {

      const { targetNodeId, sourceNodeId } = action.payload;
      return {
        ...state,
        targetToSelectedSourceMap: {
          ...state.targetToSelectedSourceMap,
          [targetNodeId]: sourceNodeId
        }
      };
    }

    case ACTION_TYPES.UPDATE_PROCEDURE_EXECUTION: {
      const { sourceNodeId, procedureMapping } = action.payload;
      const currentProcedures = state.procedureExecution[sourceNodeId] || [];

      // Find existing procedure by procedureItemId and procedureType
      const existingIndex = currentProcedures.findIndex(p =>
        p.procedureItemId === procedureMapping.procedureItemId &&
        p.procedureType === procedureMapping.procedureType
      );

      let updatedProcedures;
      if (existingIndex !== -1) {
        // Update existing procedure, preserving original parameter mapping if not updated
        updatedProcedures = [...currentProcedures];
        const existingProcedure = updatedProcedures[existingIndex];

        // If the new mapping has isUpdated flag, use the new parameterMapping
        // If it's restored, always use the restored parameterMapping
        // Otherwise, preserve the original parameterMapping if it exists
        const finalParameterMapping = procedureMapping.isUpdated || procedureMapping.isRestored
          ? procedureMapping.parameterMapping
          : existingProcedure.parameterMapping || procedureMapping.parameterMapping;

        updatedProcedures[existingIndex] = {
          ...procedureMapping,
          parameterMapping: finalParameterMapping,
          originalParameterMapping: existingProcedure.originalParameterMapping || existingProcedure.parameterMapping || procedureMapping.parameterMapping
        };
      } else {
        // Add new procedure
        updatedProcedures = [...currentProcedures, {
          ...procedureMapping,
          originalParameterMapping: procedureMapping.parameterMapping || {}
        }];
      }

      return {
        ...state,
        procedureExecution: {
          ...state.procedureExecution,
          [sourceNodeId]: updatedProcedures
        }
      };
    }

    case ACTION_TYPES.REMOVE_PROCEDURE_EXECUTION: {
      const { sourceNodeId, procedureItemId, procedureType } = action.payload;
      const currentProcedures = state.procedureExecution[sourceNodeId] || [];

      // Remove the specific procedure
      const updatedProcedures = currentProcedures.filter(p =>
        !(p.procedureItemId === procedureItemId && p.procedureType === procedureType)
      );

      // Update procedure orders for remaining procedures of the same type
      const reorderedProcedures = updatedProcedures.map(proc => {
        if (proc.procedureType === procedureType) {
          const sameTypeProcedures = updatedProcedures.filter(p =>
            p.procedureType === procedureType &&
            p.EventType === proc.EventType
          );
          const sortedProcedures = sameTypeProcedures.sort((a, b) => a.timestamp - b.timestamp);
          const newOrder = sortedProcedures.findIndex(p => p.procedureId === proc.procedureId) + 1;

          return {
            ...proc,
            ProcOrder: newOrder
          };
        }
        return proc;
      });

      return {
        ...state,
        procedureExecution: {
          ...state.procedureExecution,
          [sourceNodeId]: reorderedProcedures
        }
      };
    }

    case ACTION_TYPES.SET_ORIGINAL_SOURCE_COLUMNS: {
      const { sourceNodeId, columns } = action.payload;
      return {
        ...state,
        originalSourceColumns: {
          ...state.originalSourceColumns,
          [sourceNodeId]: columns
        }
      };
    }

    case ACTION_TYPES.PRESERVE_TARGET_MAPPING:
      return {
        ...state,
        preservedTargetMappings: {
          ...state.preservedTargetMappings,
          [action.payload.targetId]: action.payload.mapping
        }
      };

    case ACTION_TYPES.RESTORE_TARGET_MAPPINGS:
      // Batch update all targets with preserved mappings
      const updatedTargets = {...state.targets};

      Object.keys(state.preservedTargetMappings).forEach(targetId => {
        if (updatedTargets[targetId]) {
          updatedTargets[targetId] = {
            ...updatedTargets[targetId],
            targetMapping: {
              ...state.preservedTargetMappings[targetId]
            }
          };
        }
      });

      return {
        ...state,
        targets: updatedTargets
      };

    case ACTION_TYPES.SET_SOURCE_ORIGINAL_COLUMNS: {
      const { sourceNodeId, columns } = action.payload;
      return {
        ...state,
        sourceOriginalColumns: {
          ...state.sourceOriginalColumns,
          [sourceNodeId]: columns
        }
      };
    }

    case ACTION_TYPES.RESET:
      // Explicitly remove any target mappings from localStorage to ensure fresh state
      Object.keys(state.targets).forEach(targetId => {
        try {
          window.localStorage.removeItem(`targetMapping_${targetId}`);
          window.localStorage.removeItem(`targetMappingConfirmed_${targetId}`);
          window.localStorage.removeItem(`targetMapping_${targetId}_draft`);
          window.localStorage.removeItem(`targetMapping_${targetId}_backup`);
        } catch (e) {
          console.error("Error clearing localStorage during reset:", e);
        }
      });

      // Also clear all preserved mappings to prevent them from reappearing
      if (window.preservedTargetMappingsDebug) window.preservedTargetMappingsDebug = {};
      if (window.targetMappingsDebug) window.targetMappingsDebug = {};

      // console.log("TransformationContext fully reset");
      return initialState;

    default:
      return state;
  }
}

const TransformationContext = createContext();

export function TransformationProvider({ children }) {
  const [state, dispatch] = useReducer(transformationReducer, initialState);
  const { decodedToken, project } = useAuth();

  // Make context available globally for restrict columns operations
  useEffect(() => {
    window.transformationContext = { state, dispatch, ACTION_TYPES };

    // Add debugging for target mappings
    if (window.transformationContext && state.targets) {
      const targetMappings = {};
      Object.entries(state.targets).forEach(([id, target]) => {
        targetMappings[id] = target.targetMapping || {};
      });
      window.targetMappingsDebug = targetMappings;

      // Also track preserved mappings for debugging
      window.preservedTargetMappingsDebug = state.preservedTargetMappings;
    }

    return () => {
      delete window.transformationContext;
      delete window.targetMappingsDebug;
      delete window.preservedTargetMappingsDebug;
    };
  }, [state, dispatch, ACTION_TYPES]);

  const generateTransformationJson = () => {
    const timestamp = new Date().toISOString();

    const sourceIdToAlias = {};
    Object.entries(state.sources).forEach(([id, src]) => {
      sourceIdToAlias[id] = src.alias || `source_${id}`;
    });
    const targetIdToAlias = {};
    Object.entries(state.targets).forEach(([id, tgt]) => {
      targetIdToAlias[id] = tgt.alias || `target_${id}`;
    });

    const sourceIdToDfId = {};
    Object.entries(state.sources).forEach(([id, src]) => {
      sourceIdToDfId[id] = src.dfId || `s_df_${id}`;
    });
    const targetIdToDfId = {};
    Object.entries(state.targets).forEach(([id, tgt]) => {
      targetIdToDfId[id] = tgt.dfId || `t_df_${id}`;
    });

    const result = {
      created_at: timestamp,
      created_by: decodedToken.preferred_username,
      project: project || "default",
      workflow_name: state.define.name,
      workflow_type : "manual",
      description: state.define.description || "",
      source: {},
      target: {},
      logging:{
        isLoggingEnabled :true,
        isLoggingEnabledForEachDataset: false
      },
      procedureExecution: state.procedureExecution,
      transformation: {}
    };

    const transformationNodes = Object.keys(state.transformations);

    if (transformationNodes.length > 0) {
      // source
      const sourceConnections = state.connections.filter(conn => {
        const sourceIds = Object.keys(state.sources);
        return sourceIds.includes(conn.source) && transformationNodes.includes(conn.target);
      });

      sourceConnections.forEach((conn) => {
        const sourceId = conn.source;
        const sourceData = state.sources[sourceId];

        if (sourceData) {
          const sourceKey = sourceData.alias || `source_${sourceId}`;

          // Use originally selected columns stored in context
          const originalColumns = state.originalSourceColumns[sourceId] || [];

          result.source[sourceKey] = {
            sourceType: sourceData.connectionType || "unknown",
            sourceConnName: sourceData.connection || "unknown",
            sourceConnId: sourceData.connectionId || "",
            column: originalColumns,
            ConnectionParameters: {
              sourceSchema: sourceData.schema || "",
              sourceTable: sourceData.table || ""
            },
            readParameters: {
              watermarkColumn: "",
              watermarkColumnDataType: ""
            },
            EnableCountLogging: false
          };
        }
      });

      // target
      const targetConnections = state.connections.filter(conn => {
        const targetIds = Object.keys(state.targets);
        return transformationNodes.includes(conn.source) && targetIds.includes(conn.target);
      });

      const targetToSelectedSourceMap = state.targetToSelectedSourceMap || {};

      targetConnections.forEach((conn) => {
        const targetId = conn.target;
        const targetData = state.targets[targetId];

        if (targetData) {
          const targetKey = targetData.alias || `target_${targetId}`;

          let sourceDataframe = "";
          const selectedSourceId = targetToSelectedSourceMap[targetId];
          if (selectedSourceId) {
            const selectedSource = state.sources[selectedSourceId];
            if (selectedSource) {
              sourceDataframe = selectedSource.alias || `source_${selectedSourceId}`;
            } else {
              sourceDataframe = selectedSourceId;
            }
          }

          result.target[targetKey] = {
            targetType: targetData.connectionType || "unknown",
            targetConnName: targetData.connection || "unknown",
            targetConnId: targetData.connectionId || "",
            loadType: targetData.loadType || "",
            sourceDataframe: sourceDataframe,
            LoadingParams: {
              targetschema: targetData.schema || "",
              targetTable: targetData.table || "",
              loadStrategy: targetData.loadStrategy || ""
            },
            EnableCountLogging: false,
            targetMapping: targetData.targetMapping || {}
          };
        }
      });

      transformationNodes.forEach(nodeId => {
        const transformationData = state.transformations[nodeId];
        if (transformationData && transformationData.transformationConfig) {
          const patchedOps = (transformationData.transformationConfig.operations || []).map(op => {
            const patchedOp = { ...op };
            if (patchedOp.source_dataframe) {
              let alias = null;
              if (sourceIdToAlias[patchedOp.source_dataframe]) {
                alias = sourceIdToAlias[patchedOp.source_dataframe];
              } else if (targetIdToAlias[patchedOp.source_dataframe]) {
                alias = targetIdToAlias[patchedOp.source_dataframe];
              } else {
                alias = patchedOp.source_dataframe;
              }
              patchedOp.source_dataframe = alias;
              patchedOp.target_dataframe = alias;
            }
            if (patchedOp.input) {
              patchedOp.input = patchedOp.input.map(dfId => {
                if (Object.values(sourceIdToAlias).includes(dfId)) return dfId;
                if (Object.values(targetIdToAlias).includes(dfId)) return dfId;
                if (sourceIdToAlias[dfId]) return sourceIdToAlias[dfId];
                if (targetIdToAlias[dfId]) return targetIdToAlias[dfId];
                return dfId;
              });
            }
            if (patchedOp.output) {
              patchedOp.output = patchedOp.output.map(dfId => {
                if (Object.values(sourceIdToAlias).includes(dfId)) return dfId;
                if (Object.values(targetIdToAlias).includes(dfId)) return dfId;
                if (sourceIdToAlias[dfId]) return sourceIdToAlias[dfId];
                if (targetIdToAlias[dfId]) return targetIdToAlias[dfId];
                return dfId;
              });
            }
            return patchedOp;
          });
          result.transformation = patchedOps;
        }
      });
    }

    return result;
  };


    const getAllSelectedSourceColumns = () => {
    const allCols = [];
    Object.values(state.selectedSourceColumnsSet).forEach(set => {
      set.forEach(col => allCols.push(col));
    });
    return Array.from(new Set(allCols));
  };

  // New helper function to get target mapping by node ID
  const getTargetMappingById = (targetNodeId) => {
    // Try multiple sources with priority
    if (state.targets[targetNodeId]?.targetMapping) {
      return state.targets[targetNodeId].targetMapping;
    }

    if (state.preservedTargetMappings[targetNodeId]) {
      return state.preservedTargetMappings[targetNodeId];
    }

    return {};
  };

  // Helper to get original columns for a source node
  const getSourceOriginalColumns = (sourceNodeId) => {
    return state.sourceOriginalColumns[sourceNodeId] || [];
  };

  return (
    <TransformationContext.Provider
      value={{
        state,
        dispatch,
        ACTION_TYPES,
        generateTransformationJson,
        getAllSelectedSourceColumns,
        targetToSelectedSourceMap: state.targetToSelectedSourceMap,
        procedureExecution: state.procedureExecution,
        getTargetMappingById,  // Expose the new helper
        getSourceOriginalColumns, // <-- Expose helper
      }}
    >
      {children}
    </TransformationContext.Provider>
  );
}

export function useTransformation() {
  const context = useContext(TransformationContext);
  if (!context) {
    throw new Error('useTransformation must be used within a TransformationProvider');
  }
  return context;
}

export function useTrackConnections(nodes, edges) {
  const { dispatch, ACTION_TYPES } = useTransformation();

  useEffect(() => {
    const sourceNodeIds = new Map();
    const targetNodeIds = new Map();

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      if (sourceNode.type === 'source' && targetNode.type === 'transformation') {
        if (!sourceNodeIds.has(sourceNode.id)) {
          sourceNodeIds.set(sourceNode.id, sourceNodeIds.size + 1);
        }
      }

      if (sourceNode.type === 'transformation' && targetNode.type === 'target') {
        if (!targetNodeIds.has(targetNode.id)) {
          targetNodeIds.set(targetNode.id, targetNodeIds.size + 1);
        }
      }
    });

    nodes.forEach(node => {
      const { id, type, data } = node;

      if (!data) return;

      switch(type) {
        case 'define':
          dispatch({
            type: ACTION_TYPES.UPDATE_DEFINE,
            payload: {
              name: data.name,
              description: data.description
            }
          });
          break;

        case 'source':
          const sourceIndex = sourceNodeIds.get(id);
          if (sourceIndex) {
            dispatch({
              type: ACTION_TYPES.ADD_SOURCE,
              payload: {
                id,
                data: {
                  connection: data.connection,
                  connectionId: data.connectionId,
                  connectionType: data.connectionType,
                  schema: data.schema,
                  table: data.table,
                  columns: data.columns,
                  dfId: `s_df_${sourceIndex}`,
                  alias: data.alias,
                  objectType: data.objectType,
                  preProcedures: data.preProcedures,
                  postProcedures: data.postProcedures
                }
              }
            });
          }
          break;

        case 'transformation':
          dispatch({
            type: ACTION_TYPES.ADD_TRANSFORMATION,
            payload: {
              id,
              data: {
                type: data.type,
                function: data.function,
                transformations: data.transformations || [],
                transformationConfig: data.transformationConfig || { operations: [] }
              }
            }
          });
          break;

        case 'target':
          const targetIndex = targetNodeIds.get(id);
          if (targetIndex) {
            dispatch({
              type: ACTION_TYPES.ADD_TARGET,
              payload: {
                id,
                data: {
                  connection: data.connection,
                  connectionId: data.connectionId,
                  connectionType: data.connectionType,
                  schema: data.schema,
                  table: data.table,
                  loadType: data.loadType,
                  loadStrategy: data.loadStrategy,
                  dfId: `t_df_${targetIndex}`,
                  alias: data.alias,
                  targetMapping: data.targetMapping || {},
                  selectedSourceId: data.selectedSourceId,
                  objectType: data.objectType,
                  preProcedures: data.preProcedures,
                  postProcedures: data.postProcedures
                }
              }
            });

            // IMPORTANT: Also explicitly update the targetToSelectedSourceMap if a selectedSourceId exists
            if (data.selectedSourceId) {
              dispatch({
                type: ACTION_TYPES.UPDATE_TARGET_SELECTED_SOURCE,
                payload: {
                  targetNodeId: id,
                  sourceNodeId: data.selectedSourceId
                }
              });
              // console.log(`Restored target mapping relationship: Target ${id} -> Source ${data.selectedSourceId}`);
            }
          }
          break;

        default:
          break;
      }
    });

    dispatch({
      type: ACTION_TYPES.SET_CONNECTIONS,
      payload: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        id: edge.id
      }))
    });
  }, [nodes, edges, dispatch, ACTION_TYPES]);
}

export default TransformationContext;


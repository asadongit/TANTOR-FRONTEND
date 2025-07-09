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
  selectedSourceColumnsSet: {}, // { [sourceNodeId]: Set<string> }
  targetToSelectedSourceMap: {}, // { [targetNodeId]: sourceNodeId }
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
  UPDATE_TARGET_SELECTED_SOURCE: 'UPDATE_TARGET_SELECTED_SOURCE', // <-- add this
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
            alias: action.payload.data.alias // ensure alias is stored
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
            targetMapping: action.payload.data.targetMapping || {}
          }
        }
      };

    case ACTION_TYPES.UPDATE_TARGET:
      return {
        ...state,
        targets: {
          ...state.targets,
          [action.payload.id]: {
            ...state.targets[action.payload.id],
            ...action.payload.data,
            targetMapping: action.payload.data.targetMapping || state.targets[action.payload.id]?.targetMapping || {}
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
      // action.payload: { sourceNodeId, columns: array of column names }
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
      // action.payload: { targetNodeId, sourceNodeId }
      const { targetNodeId, sourceNodeId } = action.payload;
      return {
        ...state,
        targetToSelectedSourceMap: {
          ...state.targetToSelectedSourceMap,
          [targetNodeId]: sourceNodeId
        }
      };
    }

    case ACTION_TYPES.RESET:
      return initialState;

    default:
      return state;
  }
}

const TransformationContext = createContext();

export function TransformationProvider({ children }) {
  const [state, dispatch] = useReducer(transformationReducer, initialState);
  const { decodedToken, project } = useAuth();

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
          isLoggingEnabledForEachDataset: true
        },
        procedureExecution:{},
        transformation: {}
      };

      const transformationNodes = Object.keys(state.transformations);

      // Track target columns created by transformations
      const transformationCreatedColumns = new Set();
      // Track columns that are both source and target in date transformations
      const dateInPlaceTransformColumns = new Set();

      Object.values(state.transformations).forEach(tr => {
        if (tr.transformationConfig && Array.isArray(tr.transformationConfig.operations)) {
          tr.transformationConfig.operations.forEach(op => {
            // For date operations where source and target are the same column,
            // add to special set instead of marking as created
            if (op.transformation_operation === 'date' &&
                Array.isArray(op.source_column) &&
                Array.isArray(op.target_column)) {

              // For each target column that's also a source column in the same date operation
              op.target_column.forEach(targetCol => {
                if (op.source_column.includes(targetCol)) {
                  dateInPlaceTransformColumns.add(targetCol);
                } else if (targetCol && typeof targetCol === "string") {
                  transformationCreatedColumns.add(targetCol);
                }
              });
            }
            // For all other operations, handle normally
            else if (Array.isArray(op.target_column)) {
              op.target_column.forEach(col => {
                if (col && typeof col === "string") {
                  transformationCreatedColumns.add(col);
                }
              });
            }
          });
        }
      });

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

            const selectedColumnsSet = state.selectedSourceColumnsSet[sourceId] || new Set();

            let columnArr = [];
            if (Array.isArray(sourceData.columns)) {
              columnArr = sourceData.columns
                .filter(col => {
                  const colName = typeof col === "object" && col.name ? col.name : col;
                  // Keep column if it's:
                  // 1. In the selectedColumnsSet, AND
                  // 2. Either:
                  //    a. Not in the transformationCreatedColumns set, OR
                  //    b. In the dateInPlaceTransformColumns set (special case for date transformations)
                  return colName &&
                         selectedColumnsSet.has(colName) &&
                         (!transformationCreatedColumns.has(colName) || dateInPlaceTransformColumns.has(colName));
                })
                .map(col => typeof col === "object" && col.name ? col.name : col)
                .filter(Boolean);
            }

            result.source[sourceKey] = {
              sourceType: sourceData.connectionType || "unknown",
              sourceConnName: sourceData.connection || "unknown",
              sourceConnId: sourceData.connectionId || "",
              column: columnArr,
              ConnectionParameters: {
                sourceSchema: sourceData.schema || "",
                sourceTable: sourceData.table || ""
              },
              readParameters: {
                watermarkColumn: "",
                watermarkColumnDataType: ""
              },
              EnableCountLogging: true
            };
          }
        });

        // target
        const targetConnections = state.connections.filter(conn => {
          const targetIds = Object.keys(state.targets);
          return transformationNodes.includes(conn.source) && targetIds.includes(conn.target);
        });

        // Use the new map for target->selected source
        const targetToSelectedSourceMap = state.targetToSelectedSourceMap || {};

        targetConnections.forEach((conn) => {
          const targetId = conn.target;
          const targetData = state.targets[targetId];

          if (targetData) {
            const targetKey = targetData.alias || `target_${targetId}`;

            // --- USE THE NEW MAP HERE ---
            let sourceDataframe = "";
            const selectedSourceId = targetToSelectedSourceMap[targetId];
            if (selectedSourceId) {
              const selectedSource = state.sources[selectedSourceId];
              if (selectedSource) {
                sourceDataframe = selectedSource.alias || `source_${selectedSourceId}`;
              } else {
                // fallback: just use the selectedSourceId as is
                sourceDataframe = selectedSourceId;
              }
            }
            // ---------------------------------------

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
              EnableCountLogging: true,
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

  // Helper: get all unique selected source columns across all source nodes
  const getAllSelectedSourceColumns = () => {
    const allCols = [];
    Object.values(state.selectedSourceColumnsSet).forEach(set => {
      set.forEach(col => allCols.push(col));
    });
    return Array.from(new Set(allCols));
  };

  return (
    <TransformationContext.Provider
      value={{
        state,
        dispatch,
        ACTION_TYPES,
        generateTransformationJson,
        getAllSelectedSourceColumns,
        targetToSelectedSourceMap: state.targetToSelectedSourceMap, // expose in context
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
                  alias: data.alias
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
                  targetMapping: data.targetMapping || {}
                }
              }
            });
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


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
          [action.payload.id]: action.payload.data
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
          [action.payload.id]: action.payload.data
        }
      };

    case ACTION_TYPES.UPDATE_TARGET:
      return {
        ...state,
        targets: {
          ...state.targets,
          [action.payload.id]: {
            ...state.targets[action.payload.id],
            ...action.payload.data
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

    case ACTION_TYPES.RESET:
      return initialState;

    default:
      return state;
  }
}

const TransformationContext = createContext();

export function TransformationProvider({ children }) {
  const [state, dispatch] = useReducer(transformationReducer, initialState);
    const { decodedToken } = useAuth();

  const generateTransformationJson = () => {
    const timestamp = new Date().toISOString();

    const result = {
      created_at: timestamp,
      created_by: decodedToken.preferred_username,
      description: state.define.description || "",
      transformation_auto_name: state.define.name || "untitled_transformation",
      source: {},
      target: {}
    };

    const transformationNodes = Object.keys(state.transformations);
    if (transformationNodes.length > 0) {
      const sourceConnections = state.connections.filter(conn => {
        const sourceIds = Object.keys(state.sources);
        return sourceIds.includes(conn.source) && transformationNodes.includes(conn.target);
      });

      sourceConnections.forEach((conn, index) => {
        const sourceId = conn.source;
        const sourceData = state.sources[sourceId];

        if (sourceData) {
          const sourceKey = `s_df_${index + 1}`;
          result.source[sourceKey] = {
            sourceType: sourceData.connectionType || "unknown",
            sourceConnName: sourceData.connection || "unknown",
            column: sourceData.columns || [],
          };
        }
      });

      const targetConnections = state.connections.filter(conn => {
        const targetIds = Object.keys(state.targets);
        return transformationNodes.includes(conn.source) && targetIds.includes(conn.target);
      });

      targetConnections.forEach((conn, index) => {
        const targetId = conn.target;
        const targetData = state.targets[targetId];

        if (targetData) {
          const targetKey = `t_df_${index + 1}`;
          result.target[targetKey] = {
            targetType: targetData.connectionType || "unknown",
            targetConnName: targetData.connection || "unknown",
            schema: targetData.schema || "",
            table: targetData.table || "",
          };
        }
      });
    }

    return result;
  };

  return (
    <TransformationContext.Provider
      value={{
        state,
        dispatch,
        ACTION_TYPES,
        generateTransformationJson
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
              }
            }
          });
          break;

        case 'transformation':
          dispatch({
            type: ACTION_TYPES.ADD_TRANSFORMATION,
            payload: {
              id,
              data: {
                type: data.type,
                function: data.function,
              }
            }
          });
          break;

        case 'target':
          dispatch({
            type: ACTION_TYPES.ADD_TARGET,
            payload: {
              id,
              data: {
                connection: data.connection,
                connectionId: data.connectionId,
                schema: data.schema,
              }
            }
          });
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

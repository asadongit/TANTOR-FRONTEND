/**
 * Clean node data for serialization by removing functions and circular references
 * @param {Object} nodeData - The node data object
 * @returns {Object} - Cleaned node data
 */
const cleanNodeDataForSerialization = (nodeData) => {
  const cleaned = { ...nodeData };


  delete cleaned.onDataChange;
  delete cleaned.generateUniqueName;


  if (cleaned.transformations && Array.isArray(cleaned.transformations)) {
    cleaned.transformations = cleaned.transformations.map(t => {

      let params = t.params || {};
      if (
        t.transformation_operation === "arithmetic" &&
        params.arith_operation &&
        !params.conditions
      ) {

        const arithStr = params.arith_operation;

        const regex = /([^\+\-\*\/]+)\s*([\+\-\*\/])\s*([^\+\-\*\/]+)/;
        const match = regex.exec(arithStr);
        if (match) {

          const leftExpr = match[1].trim();
          const operatorSymbol = match[2].trim();
          const rightExpr = match[3].trim();

          const extract = (expr) => {
            const colMatch = /\['(.+)'\]/.exec(expr);
            if (colMatch) {
              return { type: "column", value: colMatch[1] };
            }

            if (!isNaN(Number(expr))) {
              return { type: "custom", value: expr };
            }

            return { type: "custom", value: expr };
          };
          const left = extract(leftExpr);
          const right = extract(rightExpr);
          const opMap = { "+": "addition", "-": "subtraction", "*": "multiplication", "/": "division" };
          const operator = opMap[operatorSymbol] || "";
          params.conditions = [{
            left_type: left.type,
            left_value: left.value,
            operator,
            right_type: right.type,
            right_value: right.value
          }];
        }
      }
      return {
        ...t,
        params,
        source_column: t.source_column || [],
        target_column: t.target_column || [],
        transformation_operation: t.transformation_operation || '',
        transformation_operator: t.transformation_operator || ''
      };
    });
  }

  if (cleaned.transformationConfig && cleaned.transformationConfig.operations) {
    cleaned.transformationConfig.operations = cleaned.transformationConfig.operations.map(op => ({
      ...op,
      params: op.params || {},
      source_column: op.source_column || [],
      target_column: op.target_column || [],
      transformation_operation: op.transformation_operation || '',
      transformation_operator: op.transformation_operator || ''
    }));
  }

  if (cleaned.preProcedures && Array.isArray(cleaned.preProcedures)) {
    cleaned.preProcedures = cleaned.preProcedures.map(proc => {
      const clonedProc = JSON.parse(JSON.stringify({
        ...proc,
        parameterMapping: proc.parameterMapping || {},
        originalParameterMapping: proc.originalParameterMapping || {},
        procedure_parameter: Array.isArray(proc.procedure_parameter) ? proc.procedure_parameter : []
      }));

      if (proc.isUpdated) {
        clonedProc.parameterMapping = proc.parameterMapping || {};
      }

      return clonedProc;
    });
  }

  if (cleaned.postProcedures && Array.isArray(cleaned.postProcedures)) {
    cleaned.postProcedures = cleaned.postProcedures.map(proc => {
      const clonedProc = JSON.parse(JSON.stringify({
        ...proc,
        parameterMapping: proc.parameterMapping || {},
        originalParameterMapping: proc.originalParameterMapping || {},
        procedure_parameter: Array.isArray(proc.procedure_parameter) ? proc.procedure_parameter : []
      }));

      if (proc.isUpdated) {
        clonedProc.parameterMapping = proc.parameterMapping || {};
      }

      return clonedProc;
    });
  }

  return cleaned;
};

/**
 * Prepare edit flow data structure with enhanced column and parameter preservation
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {number} nodeIdCounter - Current node ID counter
 * @returns {Object} - Edit flow data structure
 */
export const prepareEditFlowData = (nodes, edges, nodeIdCounter) => {
  const contextProcedures = window.transformationContext?.state?.procedureExecution || {};
  const contextTargets = window.transformationContext?.state?.targets || {};
  const contextSources = window.transformationContext?.state?.sources || {};
  const targetToSourceMap = window.transformationContext?.state?.targetToSelectedSourceMap || {};
  const sourceOriginalColumns = window.transformationContext?.state?.sourceOriginalColumns || {};

  const globalProperties = window.transformationContext?.state?.properties || {
    logging: { isLoggingEnabled: true, isLoggingEnabledForEachDataset: false },
    email: { isEmailEnabled: false }
  };


  return {
    nodes: nodes.map(node => {
      const latestProcedures = contextProcedures[node.id] || [];

      const latestPreProcedures = latestProcedures.filter(p => p.procedureType === "pre");
      const latestPostProcedures = latestProcedures.filter(p => p.procedureType === "post");

      let finalPreProcedures = node.data.preProcedures || [];
      let finalPostProcedures = node.data.postProcedures || [];

      // Update existing procedures' mappings from latest context
      if (latestPreProcedures.length > 0) {
        finalPreProcedures = finalPreProcedures.map(proc => {
          const latestProc = latestPreProcedures.find(p =>
            p.procedureItemId === proc.procedureItemId &&
            p.procedureType === proc.procedureType
          );
          if (latestProc) {
            return {
              ...proc,
              parameterMapping: latestProc.parameterMapping || proc.parameterMapping,
              originalParameterMapping: latestProc.originalParameterMapping || proc.originalParameterMapping,
              isUpdated: true
            };
          }
          return proc;
        });
      }

      if (latestPostProcedures.length > 0) {
        finalPostProcedures = finalPostProcedures.map(proc => {
          const latestProc = latestPostProcedures.find(p =>
            p.procedureItemId === proc.procedureItemId &&
            p.procedureType === proc.procedureType
          );
          if (latestProc) {
            return {
              ...proc,
              parameterMapping: latestProc.parameterMapping || proc.parameterMapping,
              originalParameterMapping: latestProc.originalParameterMapping || proc.originalParameterMapping,
              isUpdated: true
            };
          }
          return proc;
        });
      }

      // NEW: Add any newly added procedures from procedureExecution that do not exist in node.data yet
      const existingPreKeys = new Set(
        (finalPreProcedures || []).map(proc => `${proc.procedureType || 'pre'}_${proc.procedureItemId}`)
      );
      const existingPostKeys = new Set(
        (finalPostProcedures || []).map(proc => `${proc.procedureType || 'post'}_${proc.procedureItemId}`)
      );

      // Helper to normalize a procedureExecution entry into node.data shape
      const toNodeProc = (p, fallbackType) => ({
        procedure_name: p.ProcName,
        procedure_parameter: Array.isArray(p.procedure_parameter) ? p.procedure_parameter : [],
        parameterMapping: p.parameterMapping || {},
        originalParameterMapping: p.originalParameterMapping || p.parameterMapping || {},
        procedureItemId: p.procedureItemId,
        procedureType: p.procedureType || fallbackType,
      });

      // Merge missing pre procedures
      latestPreProcedures.forEach(p => {
        const key = `${p.procedureType || 'pre'}_${p.procedureItemId}`;
        if (!existingPreKeys.has(key)) {
          finalPreProcedures = [
            ...finalPreProcedures,
            toNodeProc(p, (p.EventType && p.EventType.toLowerCase().includes('before')) ? 'pre' : 'pre')
          ];
          existingPreKeys.add(key);
        }
      });

      // Merge missing post procedures
      latestPostProcedures.forEach(p => {
        const key = `${p.procedureType || 'post'}_${p.procedureItemId}`;
        if (!existingPostKeys.has(key)) {
          finalPostProcedures = [
            ...finalPostProcedures,
            toNodeProc(p, (p.EventType && p.EventType.toLowerCase().includes('after')) ? 'post' : 'post')
          ];
          existingPostKeys.add(key);
        }
      });

      // FIXED: Get the most current enableCountLogging value from multiple sources
      let currentEnableCountLogging = false;
      if (node.type === 'source') {
        currentEnableCountLogging = contextSources[node.id]?.enableCountLogging ?? node.data.enableCountLogging ?? false;
      } else if (node.type === 'target') {
        currentEnableCountLogging = contextTargets[node.id]?.enableCountLogging ?? node.data.enableCountLogging ?? false;
      } else {
        currentEnableCountLogging = node.data.enableCountLogging ?? false;
      }

      const nodeData = {
        ...node.data,
        preProcedures: finalPreProcedures,
        postProcedures: finalPostProcedures,
        // Use the most current enableCountLogging value
        enableCountLogging: currentEnableCountLogging
      };

      let finalSelectedSourceId = node.data.selectedSourceId;
      if (node.type === 'target' && targetToSourceMap && targetToSourceMap[node.id]) {
        finalSelectedSourceId = targetToSourceMap[node.id];
      }

      let finalTargetMapping = {};
      if (node.type === 'target') {
        if (contextTargets[node.id] && contextTargets[node.id].targetMapping) {
          finalTargetMapping = { ...contextTargets[node.id].targetMapping };
        }
        else if (node.data && node.data.targetMapping) {
          finalTargetMapping = { ...node.data.targetMapping };
        }
      }

      let finalScdConfig;
      if (node.type === 'target') {
        if (contextTargets[node.id]?.scdConfig) {
          finalScdConfig = { ...contextTargets[node.id].scdConfig };
        } else if (node.data?.scdConfig) {
          finalScdConfig = { ...node.data.scdConfig };
        } else {
          finalScdConfig = { primaryKeys: [], surrogateKey: "", checksumColumns: [], changeType: "" };
        }
      }

      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...cleanNodeDataForSerialization(nodeData),
          connection: node.data.connection,
          connectionId: node.data.connectionId,
          connectionType: node.data.connectionType,
          schema: node.data.schema,
          table: node.data.table,
          columns: node.type === 'source'
            ? (sourceOriginalColumns[node.id] || [])
            : (node.data.columns && Array.isArray(node.data.columns)
              ? node.data.columns.map(col => ({
                name: typeof col === 'string' ? col : col.name,
                datatype: typeof col === 'object' ? col.datatype : undefined
              }))
              : []
            ),
          alias: node.data.alias,
          objectType: node.data.objectType,
          preProcedures: finalPreProcedures.map(proc => ({
            ...proc,
            parameterMapping: proc.parameterMapping || {},
            originalParameterMapping: proc.originalParameterMapping || {},
            procedureItemId: proc.procedureItemId,
            procedureType: proc.procedureType || "pre",
            procedure_parameter: proc.procedure_parameter || []
          })),
          postProcedures: finalPostProcedures.map(proc => ({
            ...proc,
            parameterMapping: proc.parameterMapping || {},
            originalParameterMapping: proc.originalParameterMapping || {},
            procedureItemId: proc.procedureItemId,
            procedureType: proc.procedureType || "post",
            procedure_parameter: proc.procedure_parameter || []
          })),
          loadType: node.data.loadType,
          loadStrategy: node.data.loadStrategy,
          targetMapping: node.type === 'target' ? finalTargetMapping : undefined,
          // NEW: include latest SCD config in edit-flow data for targets
          scdConfig: node.type === 'target' ? finalScdConfig : undefined,
          selectedSourceId: node.type === 'target' ? finalSelectedSourceId : node.data.selectedSourceId,
          name: node.data.name,
          description: node.data.description,
          transformationConfig: node.data.transformationConfig || { operations: [] },
          enableCountLogging: currentEnableCountLogging,
          mode: node.type === 'scheduler' ? node.data.mode || 'manual' : undefined,
          flow_type: node.type === 'scheduler' ? node.data.flow_type || 'single_run' : undefined,
          intervalValue: node.type === 'scheduler' ? node.data.intervalValue || '' : undefined,
          frequency: node.type === 'scheduler' ? node.data.frequency || 'hourly' : undefined,
          runningDays: node.type === 'scheduler' ? node.data.runningDays || [] : undefined
        },
        deletable: node.deletable,
        draggable: node.draggable,
        selectable: node.selectable,
        width: node.width,
        height: node.height,
        selected: node.selected,
        zIndex: node.zIndex
      };
    }),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      animated: edge.animated,
      style: edge.style,
      label: edge.label,
      labelStyle: edge.labelStyle,
      labelShowBg: edge.labelShowBg,
      labelBgStyle: edge.labelBgStyle,
      markerEnd: edge.markerEnd,
      markerStart: edge.markerStart
    })),
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    nodeIdCounter: nodeIdCounter,
    createdAt: new Date().toISOString(),
    version: "1.0",
    metadata: {
      reactFlowVersion: "11.x",
      transformationStudioVersion: "1.0",
      restorationSupport: "enhanced"
    },
    // FIXED: Include the most current global properties for restoration
    properties: {
      ...globalProperties,
      // Ensure we have the current sidebar state
      logging: {
        ...globalProperties.logging,
        // Double-check the current state by examining actual nodes
        isLoggingEnabledForEachDataset: nodes.filter(n => n.type === 'source' || n.type === 'target')
          .every(n => n.data?.enableCountLogging === true)
      }
    }
  };
};

/**
 * Validate edit flow data structure
 * @param {Object} editFlowData - Edit flow data to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export const validateEditFlowData = (editFlowData) => {
  const errors = [];
  let isValid = true;

  if (!editFlowData || typeof editFlowData !== 'object') {
    errors.push("Edit flow data must be an object");
    isValid = false;
    return { isValid, errors };
  }

  const requiredProps = ['nodes', 'edges', 'nodeIdCounter', 'createdAt', 'version'];
  for (const prop of requiredProps) {
    if (!(prop in editFlowData)) {
      errors.push(`Missing required property: ${prop}`);
      isValid = false;
    }
  }

  if (editFlowData.nodes && !Array.isArray(editFlowData.nodes)) {
    errors.push("Nodes must be an array");
    isValid = false;
  }

  if (editFlowData.edges && !Array.isArray(editFlowData.edges)) {
    errors.push("Edges must be an array");
    isValid = false;
  }

  if (Array.isArray(editFlowData.nodes)) {
    editFlowData.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing required id property`);
        isValid = false;
      }
      if (!node.type) {
        errors.push(`Node at index ${index} missing required type property`);
        isValid = false;
      }
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Node at index ${index} missing valid position property`);
        isValid = false;
      }
    });
  }

  if (Array.isArray(editFlowData.edges)) {
    editFlowData.edges.forEach((edge, index) => {
      if (!edge.id) {
        errors.push(`Edge at index ${index} missing required id property`);
        isValid = false;
      }
      if (!edge.source) {
        errors.push(`Edge at index ${index} missing required source property`);
        isValid = false;
      }
      if (!edge.target) {
        errors.push(`Edge at index ${index} missing required target property`);
        isValid = false;
      }
    });
  }

  return { isValid, errors };
};

/**
 * Restore flow from edit flow data - OPTIMIZED for performance
 * @param {Object} editFlowData - Edit flow data from database
 * @returns {Object} - Restored flow data with nodes and edges
 */
export const restoreFlowFromEditData = (editFlowData) => {
  if (!editFlowData || typeof editFlowData !== 'object') {
    throw new Error("Invalid edit flow data provided");
  }

  const validation = validateEditFlowData(editFlowData);
  if (!validation.isValid) {
    console.warn("Edit flow data validation warnings:", validation.errors);
  }


  const restoredNodes = (editFlowData.nodes || []).map(node => ({
    ...node,
    data: {
      ...node.data,

      onDataChange: (newData) => {

      },
    }
  }));


  const restoredEdges = editFlowData.edges || [];

  return {
    nodes: restoredNodes,
    edges: restoredEdges,
    viewport: editFlowData.viewport || { x: 0, y: 0, zoom: 1 },
    nodeIdCounter: editFlowData.nodeIdCounter || 1,
    metadata: editFlowData.metadata || {}
  };
};

/**
 * Restore nodes and edges from edit flow data with improved handling - PERFORMANCE OPTIMIZED
 * @param {Object} editFlowData - Edit flow data from database
 * @param {Function} setNodes - React Flow setNodes function
 * @param {Function} setEdges - React Flow setEdges function
 * @param {Object} nodeIdRef - Reference to current node ID counter
 * @returns {Object} - Restored flow data with nodes and edges
 */
export const restoreNodesAndEdgesFromEditData = (editFlowData, setNodes, setEdges, nodeIdRef) => {
  if (!editFlowData || typeof editFlowData !== 'object') {
    throw new Error("Invalid edit flow data provided");
  }

  const validation = validateEditFlowData(editFlowData);
  if (!validation.isValid) {
    console.warn("Edit flow data validation warnings:", validation.errors);
  }

  const restoredNodes = (editFlowData.nodes || []).map(node => {
    const restoredNode = {
      ...node,
      data: {
        ...node.data,

        onDataChange: (newData) => {
        },
        _isRestoring: true,
        transformations: node.data.transformations || [],
        transformationConfig: node.data.transformationConfig || { operations: [] },
        mode: node.type === 'scheduler' ? node.data.mode || 'manual' : undefined,
        flow_type: node.type === 'scheduler' ? node.data.flow_type || 'single_run' : undefined,
        intervalValue: node.type === 'scheduler' ? node.data.intervalValue || '' : undefined,
        frequency: node.type === 'scheduler' ? node.data.frequency || 'hourly' : undefined,
        runningDays: node.type === 'scheduler' ? node.data.runningDays || [] : undefined
      }
    };

    return restoredNode;
  });


  const restoredEdges = editFlowData.edges || [];


  if (nodeIdRef && editFlowData.nodeIdCounter) {
    nodeIdRef.current = editFlowData.nodeIdCounter;
  }



  return {
    nodes: restoredNodes,
    edges: restoredEdges,
    viewport: editFlowData.viewport || { x: 0, y: 0, zoom: 1 },
    nodeIdCounter: editFlowData.nodeIdCounter || 1,
    metadata: editFlowData.metadata || {}
  };
};

/**
 * Get next available node ID from edit flow data
 * @param {Object} editFlowData - Edit flow data
 * @returns {number} - Next available node ID
 */
export const getNextNodeId = (editFlowData) => {
  if (!editFlowData || !editFlowData.nodeIdCounter) {
    return 1;
  }
  return editFlowData.nodeIdCounter;
};

/**
 * Update node positions for better layout
 * @param {Array} nodes - Array of nodes
 * @param {Object} options - Layout options
 * @returns {Array} - Updated nodes with new positions
 */
export const updateNodePositions = (nodes, options = {}) => {
  const { spacing = 200, startX = 100, startY = 200 } = options;

  const nodesByType = {
    define: [],
    source: [],
    transformation: [],
    target: []
  };


  nodes.forEach(node => {
    if (nodesByType[node.type]) {
      nodesByType[node.type].push(node);
    }
  });

  const updatedNodes = [];
  let currentX = startX;
  let currentY = startY;


  ['define', 'source', 'transformation', 'target'].forEach(type => {
    if (nodesByType[type].length > 0) {
      nodesByType[type].forEach((node, index) => {
        const updatedNode = {
          ...node,
          position: {
            x: currentX,
            y: currentY + (index * spacing)
          }
        };
        updatedNodes.push(updatedNode);
      });
      currentX += spacing;
    }
  });

  return updatedNodes;
};

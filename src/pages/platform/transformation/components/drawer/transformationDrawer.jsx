import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { X, Plus, ChevronDown } from "lucide-react";

import ArithmeticOperationFields, { CustomValueInput } from "./operations/arithmatic";
import StringOperationFields, { StringOperationParameters, getStringParams } from "./operations/string";
import ColCopyOperationFields from "./operations/colcopy";
import ConstantCopyOperationFields, { getConstantCopyParams } from "./operations/constantcopy";
import RenameOperationFields from "./operations/rename";
import JoinsOperationFields, { getJoinsParams } from "./operations/joins";
import FilterOperationFields, { getFilterParams } from "./operations/filter";
import DateOperationFields, { getDateParams } from "./operations/date";
import RestrictColumnsOperationFields, { getRestrictColumnsParams } from "./operations/restrictColumns";
import TypecastOperationFields, { getTypecastParams } from "./operations/typecast";
import SortOperationFields, { getSortParams } from "./operations/sort";
import RankingOperationFields, { getRankingParams } from "./operations/ranking";

const transformationOperations = [
	{
		id: "arithmetic",
		name: "Arithmetic",
		operators: [
			{ id: "addition", name: "Add", symbol: "+" },
			{ id: "subtraction", name: "Subtract", symbol: "-" },
			{ id: "multiplication", name: "Multiply", symbol: "×" },
			{ id: "division", name: "Divide", symbol: "÷" },
		],
	},
	{
		id: "string",
		name: "String",
		operators: [
			{ id: "lpad", name: "Lpad", symbol: "Lpad" },
			{ id: "rpad", name: "Rpad", symbol: "Rpad" },
			{ id: "substr", name: "Substr", symbol: "Substr" },
			{ id: "trim", name: "Trim", symbol: "Trim" },
			{ id: "ltrim", name: "Ltrim", symbol: "Ltrim" },
			{ id: "rtrim", name: "Rtrim", symbol: "Rtrim" },
		],
	},
	{
		id: "colcopy",
		name: "Column Copy",
		operators: [], // No operators for column copy
	},
	{
		id: "constantcopy",
		name: "Constant Copy",
		operators: [], // No operators for constant copy
	},
	{
		id: "rename",
		name: "Rename",
		operators: [], // No operators for rename
	},
	{
		id: "join",
		name: "Join",
		operators: [], // No operators for join
	},
	{
		id: "filter",
		name: "Filter",
		operators: [
			{ id: ">=", name: "Greater Than or Equal", symbol: ">=" },
			{ id: "<=", name: "Less Than or Equal", symbol: "<=" },
			{ id: "==", name: "Equal", symbol: "==" },
			{ id: ">", name: "Greater Than", symbol: ">" },
			{ id: "<", name: "Less Than", symbol: "<" },
		],
	},
	{
		id: "date",
		name: "Date",
		operators: [], // No operators for date operations
	},
	{
		id: "restrictcolumns",
		name: "Restrict Columns",
		operators: [
			{ id: "select", name: "Select", symbol: "Select" },
			{ id: "drop", name: "Drop", symbol: "Drop" },
		],
	},
	{
		id: "typecast",
		name: "Typecast",
		operators: [], // No operators for typecast
	},
	{
		id: "sorting",
		name: "Sort",
		operators: [], // No operators for sorting
	},
	{
		id: "ranking",
		name: "Ranking",
		operators: [], // No operators for ranking
	}
];

// Memoized individual transformation component
const TransformationItem = memo(({
  transformation,
  index,
  allDataframes,
  dataframeColumns,
  openDropdowns,
  dropdownRefs,
  handleRemoveTransformation,
  handleDataframeChange,
  handleOperationChange,
  handleOperatorChange,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  updateTransformation,
  transformationOperations,
  updateStringParam,
  updateConstantCopyParam,
  updateFilterParam,
  updateTypecastParam,
  updateTargetColumns,
  updateSortParam,
  updateRankingParam,
  updateDateParam,
  updateTargetColumn
}) => {
  // Get operator symbol helper
  const getOperatorSymbol = (operation, operator) => {
    const opType = transformationOperations.find(op => op.id === operation);
    if (!opType) return operator;

    const op = opType.operators.find(o => o.id === operator);
    return op?.symbol || operator;
  };

  const renderOperatorSelection = () => {
    if (transformation.transformation_operation === 'colcopy' ||
        transformation.transformation_operation === 'constantcopy' ||
        transformation.transformation_operation === 'rename' ||
        transformation.transformation_operation === 'join' ||
        transformation.transformation_operation === 'filter' ||
        transformation.transformation_operation === 'date' ||
        transformation.transformation_operation === 'typecast' ||
        transformation.transformation_operation === 'sorting' ||
        transformation.transformation_operation === 'ranking') {
      return null;
    }

    return (
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Operator
        </label>
        {transformation.transformation_operation === 'arithmetic' ? (
          <div className="grid grid-cols-4 gap-2">
            {transformationOperations
              .find(op => op.id === 'arithmetic')
              ?.operators.map(op => (
              <button
                key={op.id}
                className={`py-2 px-3 text-sm rounded-md ${
                  transformation.transformation_operator === op.id
                    ? 'bg-[#8E77BB] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleOperatorChange(
                  transformation.id,
                  op.id
                )}
              >
                {op.symbol}
              </button>
            ))}
          </div>
        ) : transformation.transformation_operation === 'string' ? (
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.transformation_operator}
            onChange={(e) => handleOperatorChange(
              transformation.id,
              e.target.value
            )}
          >
            {transformationOperations
              .find(op => op.id === 'string')
              ?.operators.map(op => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.transformation_operator}
            onChange={(e) => handleOperatorChange(
              transformation.id,
              e.target.value
            )}
          >
            {transformationOperations
              .find(op => op.id === transformation.transformation_operation)
              ?.operators.map(op => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const renderTransformationFields = () => {
    const { transformation_operation, source_dataframe, target_dataframe } = transformation;

    const sourceCols = dataframeColumns[source_dataframe] || [];
    const targetCols = dataframeColumns[target_dataframe] || [];

    // Enhanced props with memoized callbacks
    const commonProps = {
      transformation: {
        ...transformation,
        updateStringParam,
        updateConstantCopyParam,
        updateFilterParam,
        updateTypecastParam,
        updateTargetColumns,
        updateSortParam,
        updateRankingParam
      },
      sourceCols,
      targetCols,
      openDropdowns,
      toggleDropdown,
      handleSelectAllColumns,
      handleColumnSelection,
      dropdownRefs
    };

    // Return appropriate component based on operation type
    switch (transformation_operation) {
      case 'arithmetic':
        return <ArithmeticOperationFields
          {...commonProps}
          getOperatorSymbol={getOperatorSymbol}
        />;
      case 'string':
        return <StringOperationFields {...commonProps} />;
      case 'colcopy':
        return <ColCopyOperationFields {...commonProps} />;
      case 'constantcopy':
        return <ConstantCopyOperationFields {...commonProps} />;
      case 'rename':
        return <RenameOperationFields
          {...commonProps}
          updateTargetColumn={updateTargetColumn}
        />;
      case 'join':
        return <JoinsOperationFields
          {...commonProps}
          allDataframes={allDataframes}
          dataframeColumns={dataframeColumns}
          updateJoinsParam={(id, name, value) => updateFilterParam(id, name, value)}
        />;
      case 'filter':
        return <FilterOperationFields
          {...commonProps}
          handleOperatorChange={handleOperatorChange}
        />;
      case 'date':
        return <DateOperationFields
          {...commonProps}
          updateDateParam={updateDateParam}
        />;
      case 'restrictcolumns':
        return <RestrictColumnsOperationFields
          {...commonProps}
          handleOperatorChange={handleOperatorChange}
        />;
      case 'typecast':
        return <TypecastOperationFields
          {...commonProps}
        />;
      case 'sorting':
        return <SortOperationFields
          {...commonProps}
        />;
      case 'ranking':
        return <RankingOperationFields
          {...commonProps}
        />;
      default:
        return <DefaultColumnSelectionFields
          transformation={transformation}
          sourceCols={sourceCols}
          targetCols={targetCols}
          openDropdowns={openDropdowns}
          toggleDropdown={toggleDropdown}
          handleSelectAllColumns={handleSelectAllColumns}
          handleColumnSelection={handleColumnSelection}
          dropdownRefs={dropdownRefs}
        />;
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-400 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-800 text-sm font-medium">
          {index + 1}. Transformation
        </h3>
        <button
          onClick={() => handleRemoveTransformation(transformation.id)}
          className="p-1 text-gray-400 hover:text-red-500 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-700 mb-1">Source Dataframe</label>
          <select
            className="w-full p-2 text-black text-xs border border-gray-300 rounded bg-white"
            value={transformation.source_dataframe}
            onChange={e => handleDataframeChange(transformation.id, "source_dataframe", e.target.value)}
          >
            <option value="">Select source dataframe</option>
            {allDataframes.map(df => (
              <option key={df.id} value={df.id}>{df.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-700 mb-1">Target Dataframe</label>
          <select
            className="w-full p-2 text-black text-xs border border-gray-300 rounded bg-white"
            value={transformation.target_dataframe}
            onChange={e => handleDataframeChange(transformation.id, "target_dataframe", e.target.value)}
          >
            <option value="">Select target dataframe</option>
            {allDataframes.map (df => (
              <option key={df.id} value={df.id}>{df.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Operation Type
          </label>
          <select
            className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
            value={transformation.transformation_operation}
            onChange={(e) => handleOperationChange(
              transformation.id,
              e.target.value
            )}
          >
            {transformationOperations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>

        {renderOperatorSelection()}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-2">
          Column Selection
        </label>
        {(!transformation.source_dataframe || (dataframeColumns[transformation.source_dataframe] || []).length === 0) ? (
          <p className="text-amber-500 text-xs mb-2">
            No columns available. Make sure a source node with columns is connected.
          </p>
        ) : (
          renderTransformationFields()
        )}
      </div>

      {transformation.transformation_operation === 'arithmetic' && (
        <CustomValueInput
          transformation={transformation}
          updateTransformation={updateTransformation}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if specific props have changed
  const relevantPropsToCompare = [
    'transformation',
    'openDropdowns',
    'dataframeColumns'
  ];

  for (let prop of relevantPropsToCompare) {
    if (JSON.stringify(prevProps[prop]) !== JSON.stringify(nextProps[prop])) {
      return false; // Re-render
    }
  }

  return true; // Don't re-render
});

// Separate component for default column selection to reduce complexity
const DefaultColumnSelectionFields = memo(({
  transformation,
  sourceCols,
  targetCols,
  openDropdowns,
  toggleDropdown,
  handleSelectAllColumns,
  handleColumnSelection,
  dropdownRefs
}) => {
  const sourceDropdownKey = `${transformation.id}-source`;
  const targetDropdownKey = `${transformation.id}-target`;
  const isSourceDropdownOpen = openDropdowns[sourceDropdownKey] || false;
  const isTargetDropdownOpen = openDropdowns[targetDropdownKey] || false;

  return (
    <div className="grid grid-cols-2 gap-4 items-center">
      <div className="relative" ref={el => dropdownRefs.current[sourceDropdownKey] = el}>
        <label className="text-xs text-gray-600 block mb-1">Source Columns</label>
        <button
          className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
          onClick={() => toggleDropdown(transformation.id, 'source')}
        >
          {transformation.source_column.length === 0 ? (
            <span className="text-gray-400">Select columns</span>
          ) : (
            <span className="truncate">
              {transformation.source_column.length} column(s) selected
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isSourceDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isSourceDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-200">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={transformation.source_column.length === sourceCols.length && sourceCols.length > 0}
                  onChange={(e) => handleSelectAllColumns(transformation.id, 'source', sourceCols, e.target.checked)}
                />
                Select All
              </label>
            </div>
            <div className="py-1">
              {sourceCols.map((column, idx) => (
                <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.source_column.includes(column)}
                    onChange={(e) => handleColumnSelection(transformation.id, 'source', column, e.target.checked)}
                  />
                  <span className="text-sm">{column}</span>
                </label>
              ))}
              {sourceCols.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={el => dropdownRefs.current[targetDropdownKey] = el}>
        <label className="text-xs text-gray-600 block mb-1">Target Columns</label>
        <button
          className="w-full p-2 text-black text-sm border border-gray-300 rounded bg-white flex justify-between items-center"
          onClick={() => toggleDropdown(transformation.id, 'target')}
        >
          {transformation.target_column.length === 0 ? (
            <span className="text-gray-400">Select columns</span>
          ) : (
            <span className="truncate">
              {transformation.target_column.length} column(s) selected
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isTargetDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isTargetDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 border-b border-gray-200">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={transformation.target_column.length === targetCols.length && targetCols.length > 0}
                  onChange={(e) => handleSelectAllColumns(transformation.id, 'target', targetCols, e.target.checked)}
                />
                Select All
              </label>
            </div>
            <div className="py-1">
              {targetCols.map((column, idx) => (
                <label key={idx} className="flex items-center px-3 py-2 hover:bg-gray-100">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={transformation.target_column.includes(column)}
                    onChange={(e) => handleColumnSelection(transformation.id, 'target', column, e.target.checked)}
                  />
                  <span className="text-sm">{column}</span>
                </label>
              ))}
              {targetCols.length === 0 && (
                <div className="px-3 py-2 text-gray-500 text-sm">No columns available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const TransformationDrawer = ({
	isOpen,
	onClose,
	activeNode,
	activeNodeId,
}) => {
	const [transformations, setTransformations] = useState([
		{
			id: 1,
			source_dataframe: "",
			target_dataframe: "",
			source_column: [],
			target_column: [],
			transformation_operation: "arithmetic",
			transformation_operator: "addition",
			params: {
				custom_value: "",
				max_length: "",
				padding_character: "",
				start_position: "",
				no_of_character: ""
			},
			transformation_order: 1
		}
	]);
	const [allDataframes, setAllDataframes] = useState([]);
	const [dataframeColumns, setDataframeColumns] = useState({});
	const [openDropdowns, setOpenDropdowns] = useState({});
	const dropdownRefs = useRef({});

	// Optimize data loading with useCallback
	const loadDataFramesAndColumns = useCallback(() => {
		if (!window.allNodes || !window.allEdges) return;

		const incomingEdges = window.allEdges.filter(edge => edge.target === activeNodeId);
		const outgoingEdges = window.allEdges.filter(edge => edge.source === activeNodeId);

		const sources = incomingEdges
			.map(edge => window.allNodes.find(node => node.id === edge.source))
			.filter(Boolean)
			.map((node, index) => {
				const dfId = `s_df_${index + 1}`;
				return {
					id: dfId,
					columns: node.data?.columns || [],
					label: dfId,
					nodeId: node.id
				};
			});

		const targets = outgoingEdges
			.map(edge => window.allNodes.find(node => node.id === edge.target))
			.filter(Boolean)
			.map((node, index) => {
				const dfId = `t_df_${index + 1}`;
				return {
					id: dfId,
					columns: node.data?.columns || [],
					label: dfId,
					nodeId: node.id
				};
			});

		const allDfsMap = {};
		[...sources, ...targets].forEach(df => {
			allDfsMap[df.id] = df;
		});
		const allDfs = Object.values(allDfsMap);

		setAllDataframes(allDfs);

		const dfCols = {};
		allDfs.forEach(df => {
			dfCols[df.id] = Array.isArray(df.columns) ? df.columns : [];
		});
		setDataframeColumns(dfCols);

		window.nodeToDataframeMap = {};
		[...sources, ...targets].forEach(df => {
			window.nodeToDataframeMap[df.nodeId] = df.id;
		});

		const firstSource = sources[0]?.id || "";
		const firstTarget = targets[0]?.id || "";

		setTransformations(prev =>
			prev.map(t => ({
				...t,
				source_dataframe: t.source_dataframe || firstSource,
				target_dataframe: t.target_dataframe || firstTarget,
				source_column: Array.isArray(t.source_column) ? t.source_column : [],
				target_column: Array.isArray(t.target_column) ? t.target_column : [],
			}))
		);
	}, [activeNode, activeNodeId]);

	// Load data when drawer opens
	useEffect(() => {
		if (isOpen) {
			loadDataFramesAndColumns();
		}
	}, [isOpen, loadDataFramesAndColumns]);

    // Dropdown click outside handler
	useEffect(() => {
		const handleClickOutside = (event) => {
			Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
				if (ref && !ref.contains(event.target)) {
					setOpenDropdowns(prev => ({...prev, [key]: false}));
				}
			});
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Update node data when transformations change
	useEffect(() => {
		if (activeNode && activeNode.data && activeNode.data.onDataChange) {
			activeNode.data.onDataChange({
				transformations
			});
		}
	}, [transformations, activeNode]);

	// Memoized handlers to prevent recreation on every render
	const handleDataframeChange = useCallback((id, field, value) => {
		setTransformations(ts =>
			ts.map(t => {
				if (t.id !== id) return t;

				if (field === "source_dataframe") {
					return {
						...t,
						[field]: value,
						source_column: []
					};
				}

				if (field === "target_dataframe") {
					return {
						...t,
						[field]: value,
						target_column: []
					};
				}

				return { ...t, [field]: value };
			})
		);
	}, []);

	const updateConstantCopyParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateJoinsParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateFilterParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateDateParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateTypecastParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateSortParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateRankingParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateStringParam = useCallback((id, paramName, value) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, params: { ...t.params, [paramName]: value } } : t
		));
	}, []);

	const updateTargetColumns = useCallback((id, columns) => {
		setTransformations(ts => ts.map(t =>
			t.id === id ? { ...t, target_column: columns } : t
		));
	}, []);

	const handleOperationChange = useCallback((id, operation) => {
		setTransformations(ts => ts.map(t => {
			if (t.id !== id) return t;

			// Find the operation definition
			const operationDef = transformationOperations.find(op => op.id === operation);

			// For operations with operators, set a default operator
			const defaultOperator = (operationDef?.operators?.length > 0)
				? operationDef.operators[0].id
				: "";

			let params = { custom_value: t.params.custom_value };
			let target_column = t.target_column;

			// Set appropriate params based on operation type
			switch (operation) {
				case "string":
					if (defaultOperator === "lpad" || defaultOperator === "rpad") {
						params = {
							...params,
							max_length: "",
							padding_character: "*"
						};
					} else if (defaultOperator === "substr") {
						params = {
							...params,
							start_position: "",
							no_of_character: ""
						};
					}
					break;
				case "colcopy":
				case "rename":
					params = {};
					if (operation === "rename") {
						target_column = t.source_column.slice();
					}
					break;
				case "constantcopy":
					params = {
						value: "",
						value_type: "c",
						datatype: "string"
					};
					break;
				case "join":
					params = {
						right_dataframe: "",
						join_type: "left",
						join_condition: "",
						drop_left_dataframe_collist: [],
						drop_right_dataframe_collist: []
					};
					break;
				case "filter":
					params = {
						value: "",
						filter_type: "",
						expression: ""
					};
					break;
				case "date":
					params = {
						source_timezone: "",
						source_timeformat: "",
						target_timezone: "",
						target_timeformat: ""
					};
					break;
				case "restrictcolumns":
					params = {};
					break;
				case "typecast":
					params = {
						target_datatype: "string"
					};
					break;
				case "sorting":
					params = {
						order_by: {}
					};
					break;
				case "ranking":
					params = {
						group_by: [],
						order_by: {}
					};
					break;
			}

			return {
				...t,
				transformation_operation: operation,
				transformation_operator: defaultOperator,
				params,
				target_column
			};
		}));
	}, []);

	const handleOperatorChange = useCallback((id, operator) => {
		setTransformations(ts => ts.map(t => {
			if (t.id !== id) return t;

			let params = { ...t.params };

			if (t.transformation_operation === "string") {
				if (operator === "lpad" || operator === "rpad") {
					params = {
						...params,
						max_length: params.max_length || "",
						padding_character: params.padding_character || "*"
					};
				} else if (operator === "substr") {
					params = {
						...params,
						start_position: params.start_position || "",
						no_of_character: params.no_of_character || ""
					};
				}
			}

			return {
				...t,
				transformation_operator: operator,
				params
			};
		}));
	}, []);

	const toggleDropdown = useCallback((id, type) => {
		const dropdownKey = `${id}-${type}`;
		setOpenDropdowns(prev => ({
			...prev,
			[dropdownKey]: !prev[dropdownKey]
		}));
	}, []);

	const handleColumnSelection = useCallback((transformationId, type, column, isChecked) => {
		setTransformations(ts => ts.map(t => {
			if (t.id === transformationId) {
				const currentColumns = type === 'source' ? t.source_column : t.target_column;
				let newColumns;

				if (isChecked) {
					newColumns = [...currentColumns, column];
				} else {
					newColumns = currentColumns.filter(col => col !== column);
				}

				return {
					...t,
					[`${type}_column`]: newColumns
				};
			}
			return t;
		}));
	}, []);

	const handleSelectAllColumns = useCallback((transformationId, type, columns, isChecked) => {
		setTransformations(ts => ts.map(t => {
			if (t.id === transformationId) {
				return {
					...t,
					[`${type}_column`]: isChecked ? columns : []
				};
			}
			return t;
		}));
	}, []);

	const updateTransformation = useCallback((id, field, value) => {
		setTransformations(ts => ts.map(t => {
			if (t.id !== id) return t;

			if (field.includes('.')) {
				const [parent, child] = field.split('.');
				return {
					...t,
					[parent]: {
						...t[parent],
						[child]: value
					}
				};
			}
			return { ...t, [field]: value };
		}));
	}, []);

	const updateTargetColumn = useCallback((id, targetColumns, sourceColumns = null) => {
		setTransformations(ts => ts.map(t => {
			if (t.id !== id) return t;

			// For rename operations, ensure we're not setting empty target columns
			let finalTargetColumns = targetColumns;
			if (t.transformation_operation === 'rename' && sourceColumns) {
				finalTargetColumns = targetColumns.map((targetCol, idx) =>
					targetCol && targetCol.trim() !== "" ? targetCol.trim() :
					(sourceColumns[idx] || "")
				);
			}

			return {
				...t,
				target_column: finalTargetColumns,
				...(sourceColumns ? { source_column: sourceColumns } : {})
			};
		}));
	}, []);

	const handleAddTransformation = useCallback(() => {
		setTransformations(ts => {
			const newId = ts.length > 0 ? Math.max(...ts.map(t => t.id)) + 1 : 1;
			const newTransformation = {
				id: newId,
				source_dataframe: allDataframes[0]?.id || "",
				target_dataframe: allDataframes[0]?.id || "",
				source_column: [],
				target_column: [],
				transformation_operation: "arithmetic",
				transformation_operator: "addition",
				params: {
					custom_value: "",
					max_length: "",
					padding_character: "",
					start_position: "",
					no_of_character: ""
				},
				transformation_order: ts.length + 1
			};

			return [...ts, newTransformation];
		});
	}, [allDataframes]);

	const handleRemoveTransformation = useCallback((id) => {
		setTransformations(ts => {
			if (ts.length <= 1) return ts;

			return ts
				.filter(t => t.id !== id)
				.map((t, idx) => ({ ...t, transformation_order: idx + 1 }));
		});
	}, []);

	const handleSave = useCallback(() => {
		const result = transformations.map(t => {
			let targetColumns = t.target_column;
			if (t.transformation_operation === 'rename' && t.source_column.length > 0) {
				targetColumns = t.target_column.length === t.source_column.length ?
					t.target_column :
					t.source_column.map((col, idx) => t.target_column[idx] || col);
			}

			// Base structure for all transformation types
			const transformationData = {
				source_dataframe: t.source_dataframe,
				target_dataframe: t.target_dataframe,
				source_column: t.transformation_operation === 'constantcopy' ? [""] :
							t.transformation_operation === 'join' ? ["", ""] : t.source_column,
				target_column: targetColumns,
				transformation_operation: t.transformation_operation,
				transformation_operator: t.transformation_operator,
				transformation_order: t.transformation_order,
				params: {}
			};

			// Set appropriate params based on operation type
			switch (t.transformation_operation) {
				case 'arithmetic':
					transformationData.params = { custom_value: t.params.custom_value };
					break;
				case 'string':
					transformationData.params = getStringParams(t);
					break;
				case 'colcopy':
					transformationData.params = {};
					break;
				case 'constantcopy':
					transformationData.params = getConstantCopyParams(t);
					break;
				case 'rename':
					transformationData.params = {};
					break;
				case 'join':
					transformationData.params = getJoinsParams(t);
					break;
				case 'filter':
					transformationData.params = getFilterParams(t);
					break;
				case 'date':
					transformationData.params = getDateParams(t);
					break;
				case 'restrictcolumns':
					transformationData.params = getRestrictColumnsParams();
					break;
				case 'typecast':
					transformationData.params = getTypecastParams(t);
					break;
				case 'sorting':
					transformationData.params = getSortParams(t);
					break;
				case 'ranking':
					transformationData.params = getRankingParams(t);
					break;
				default:
					transformationData.params = {};
			}

			return transformationData;
		});

		console.log("Saving transformations:", result);

		if (activeNode && activeNode.data && activeNode.data.onDataChange) {
			activeNode.data.onDataChange({
				transformations: result,
				transformationConfig: {
					operations: result
				}
			});
		}

		onClose();
	}, [transformations, activeNode, onClose]);

	// Don't render anything if drawer is closed
	if (!isOpen) return null;

	// Render component with improved performance
	return (
		<>
			<div
				className="fixed inset-0 bg-black bg-opacity-30 z-40"
				onClick={onClose}
			/>

			<div className="fixed right-0 top-0 h-full w-[750px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
				<div className="p-3 border-b border-gray-200 flex items-center justify-between">
					<h2 className="text-lg font-medium text-gray-800">
						Transformation
					</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-100"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					<div className="space-y-6">
						{/* Use windowing/virtualization for better performance with many transformations */}
						{transformations.map((transformation, index) => (
							<TransformationItem
								key={transformation.id}
								transformation={transformation}
								index={index}
								allDataframes={allDataframes}
								dataframeColumns={dataframeColumns}
								openDropdowns={openDropdowns}
								dropdownRefs={dropdownRefs}
								handleRemoveTransformation={handleRemoveTransformation}
								handleDataframeChange={handleDataframeChange}
								handleOperationChange={handleOperationChange}
								handleOperatorChange={handleOperatorChange}
								toggleDropdown={toggleDropdown}
								handleSelectAllColumns={handleSelectAllColumns}
								handleColumnSelection={handleColumnSelection}
								updateTransformation={updateTransformation}
								transformationOperations={transformationOperations}
								updateStringParam={updateStringParam}
								updateConstantCopyParam={updateConstantCopyParam}
								updateFilterParam={updateFilterParam}
								updateTypecastParam={updateTypecastParam}
								updateTargetColumns={updateTargetColumns}
								updateSortParam={updateSortParam}
								updateRankingParam={updateRankingParam}
								updateDateParam={updateDateParam}
								updateTargetColumn={updateTargetColumn}
							/>
						))}

						<button
							onClick={handleAddTransformation}
							className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md flex items-center justify-center text-gray-700 transition-colors"
						>
							<Plus className="w-4 h-4 mr-2 text-[#8E77BB]" />
							<span>Add Transformation</span>
						</button>
					</div>
				</div>

				<div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
					<button
						onClick={onClose}
						className="px-5 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className="px-5 py-2 bg-[#8E77BB] border border-[#8E77BB] rounded-md text-sm text-white hover:bg-[#7d68a5] transition-colors"
					>
						Apply
					</button>
				</div>
			</div>
		</>
	);
};

export default TransformationDrawer;

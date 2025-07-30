import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { X, Plus, ChevronDown } from "lucide-react";

import ArithmeticOperationFields from "./operations/arithmatic";
import StringOperationFields, { StringOperationParameters, getStringParams, validateStringTransformation } from "./operations/string";
import ColCopyOperationFields from "./operations/colcopy";
import ConstantCopyOperationFields, { getConstantCopyParams } from "./operations/constantcopy";
import RenameOperationFields from "./operations/rename";
import JoinsOperationFields, { getJoinsParams } from "./operations/joins";
import FilterOperationFields, { getFilterParams, FILTER_OPERATORS } from "./operations/filter";
import DateOperationFields, { getDateParams } from "./operations/date";
import RestrictColumnsOperationFields, { getRestrictColumnsParams } from "./operations/restrictColumns";
import TypecastOperationFields, { getTypecastParams } from "./operations/typecast";
import SortOperationFields, { getSortParams } from "./operations/sort";
import RankingOperationFields, { getRankingParams } from "./operations/ranking";

const transformationOperations = [
	{
		id: "arithmetic",
		name: "Arithmetic"},
	{
		id: "string",
		name: "String"
	},
	// {
	// 	id: "colcopy",
	// 	name: "Column Copy"
	// },
	{
		id: "constantcopy",
		name: "Constant Copy"
	},
	{
		id: "rename",
		name: "Rename"
	},
	{
		id: "join",
		name: "Join"
	},
	{
		id: "filter",
		name: "Filter"
	},
	{
		id: "date",
		name: "Date"
	},
	{
		id: "restrictcolumns",
		name: "Restrict Columns"
	},
	{
		id: "typecast",
		name: "Typecast"
	},
	{
		id: "sorting",
		name: "Sort"
	},
	{
		id: "ranking",
		name: "Ranking"
	}
];

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
  updateTargetColumn,
  onAddNewTargetColumn,
  handleOperatorChange,
  setTransformationValidity,
  appendColumnsFromRightToLeft,
  updateJoinsSourceColumns,
  updateJoinsParam,
}) => {
  const renderSourceAndOperationRow = () => (
    <div className="flex gap-2 mb-3">
      <div className="flex-1">
        <label className="block text-xs text-gray-700 mb-1">
          {transformation.transformation_operation === "join"
            ? "Source (Left Table)"
            : "Source"}
        </label>
        <select
          className="w-full p-2 text-black text-xs border border-gray-300 rounded bg-white"
          value={transformation.source_dataframe}
          onChange={e => handleDataframeChange(transformation.id, "source_dataframe", e.target.value)}
        >
          <option value="">Select source</option>
          {allDataframes.map(df => (
            <option key={df.id} value={df.id}>{df.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-700 mb-1">Operation</label>
        <select
          className="w-full p-2 text-sm bg-white border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB]"
          value={transformation.transformation_operation}
          onChange={(e) => handleOperationChange(
            transformation.id,
            e.target.value
          )}
        >
		<option value="">None</option>
          {transformationOperations.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // For arithmetic validation
  const arithmeticRef = useRef();

  // For string validation
  const isStringInvalid = transformation.transformation_operation === "string"
    && !validateStringTransformation(transformation);

  const renderTransformationFields = () => {
    const { transformation_operation, source_dataframe, target_dataframe } = transformation;
    const sourceCols = dataframeColumns[source_dataframe] || [];
    const targetCols = sourceCols;

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
      dropdownRefs,
      updateTransformation,
	  updateStringParam,
    };

    switch (transformation_operation) {
      case 'arithmetic':
        return <ArithmeticOperationFields
          {...commonProps}
          onAddNewTargetColumn={(colName) =>
            onAddNewTargetColumn(colName, transformation.source_dataframe, "arithmetic")
          }
          target_dataframe={target_dataframe}
          ref={arithmeticRef}
          setIsValid={isValid => setTransformationValidity(transformation.id, isValid)}
        />;
      case 'string':
        return (
          <>
            <StringOperationFields
              {...commonProps}
              onAddNewTargetColumn={(colName) =>
                onAddNewTargetColumn(colName, transformation.source_dataframe, "string")
              }
            />

          </>
        );
      case 'colcopy':
        return <ColCopyOperationFields {...commonProps} />;
      case 'constantcopy':
        return <ConstantCopyOperationFields
          {...commonProps}
          onAddNewTargetColumn={(colName) =>
            onAddNewTargetColumn(colName, transformation.source_dataframe, "constantcopy", transformation.params.datatype || "string")
          }
        />;
      case 'rename':
        return <RenameOperationFields
          {...commonProps}
          updateTargetColumn={updateTargetColumn}
          onAddNewTargetColumn={onAddNewTargetColumn}
        />;
      case 'join':
        return <JoinsOperationFields
          {...commonProps}
          allDataframes={allDataframes}
          dataframeColumns={dataframeColumns}
          updateJoinsParam={updateJoinsParam}
          appendColumnsFromRightToLeft={appendColumnsFromRightToLeft}
          updateJoinsSourceColumns={updateJoinsSourceColumns}
        />;
      case 'filter':
        let operatorOptions = FILTER_OPERATORS;
        let selectedColType;
        if (sourceCols && transformation.source_column && transformation.source_column.length > 0) {
          const colObj = sourceCols.find(
            c => (typeof c === "object" ? c.name : c) === transformation.source_column[0]
          );
          if (colObj && colObj.datatype) {
            const t = colObj.datatype.toLowerCase();
			// console.log(t)
            if (t.includes("char") || t.includes("varchar2") || t.includes("string")) {
              operatorOptions = FILTER_OPERATORS.filter(op => (op.id === "==" || op.id === "!="));
              selectedColType = "string";
            } else if (t.includes("int") || t.includes("float") || t.includes("double") || t.includes("number")) {
              operatorOptions = FILTER_OPERATORS
              selectedColType = "numeric";
            } else if (t.includes("date") || t.includes("time")) {
              selectedColType = "date";
            }
          }
        }
        return <FilterOperationFields
          {...commonProps}
          operatorOptions={operatorOptions}
          transformation_operator={transformation.transformation_operator}
          handleOperatorChange={handleOperatorChange}
        />;
      case 'date':
        return <DateOperationFields
          {...commonProps}
          updateDateParam={updateDateParam}
          onAddNewTargetColumn={onAddNewTargetColumn}
        />;
      case 'restrictcolumns':
        return <RestrictColumnsOperationFields
          {...commonProps}
          handleOperatorChange={handleOperatorChange}
          onAddNewTargetColumn={onAddNewTargetColumn}
        />;
      case 'typecast':
  return <TypecastOperationFields
    {...commonProps}
    onAddNewTargetColumn={(colName) =>
      onAddNewTargetColumn(colName, transformation.source_dataframe, "typecast", transformation.params.target_datatype || "string")
    }
  />;
      case 'sorting':
        return <SortOperationFields
          {...commonProps}
        />;
      case 'ranking':
        return <RankingOperationFields
          {...commonProps}
          onAddNewTargetColumn={onAddNewTargetColumn}
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

      {renderSourceAndOperationRow()}

      <div className="mb-4">
        {/* <label className="block text-sm text-gray-700 mb-2">
          Column Selection
        </label> */}
        {(!transformation.source_dataframe || (dataframeColumns[transformation.source_dataframe] || []).length === 0) ? (
          <p className="text-amber-500 text-xs mb-2">
            No columns available. Make sure a source node with columns is connected.
          </p>
        ) : (
          renderTransformationFields()
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {

	const relevantPropsToCompare = [
    'transformation',
    'openDropdowns',
    'dataframeColumns'
  ];

  for (let prop of relevantPropsToCompare) {
    if (JSON.stringify(prevProps[prop]) !== JSON.stringify(nextProps[prop])) {
      return false;
    }
  }

  return true;
});

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
	onApplyTransformations
}) => {
	const [transformations, setTransformations] = useState([
		{
			id: 1,
			source_dataframe: "",
			target_dataframe: "",
			source_column: [],
			target_column: [],
			transformation_operation: "arithmetic",
			transformation_operator: "",
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
	const transformationRefs = useRef([]);


	const [isEditMode, setIsEditMode] = useState(false);
	const [initialTransformations, setInitialTransformations] = useState([]);
	const [isDataLoaded, setIsDataLoaded] = useState(false);
	const [columnsLoaded, setColumnsLoaded] = useState(false);


	const hasReplayedRef = useRef(false);

	useEffect(() => {
		transformationRefs.current = transformationRefs.current.slice(0, transformations.length);
	}, [transformations.length]);

	const replayTransformationsForColumns = useCallback((transformationsList, initialDfCols) => {
		let dfCols = JSON.parse(JSON.stringify(initialDfCols));
		const getColName = (col) => typeof col === "object" ? col.name : col;

		const renameMaps = {};

		transformationsList.forEach((t, idx) => {
			const dfId = t.source_dataframe;
			if (!dfId) return;
			let cols = Array.isArray(dfCols[dfId]) ? [...dfCols[dfId]] : [];

			switch (t.transformation_operation) {
				case "constantcopy":
				case "arithmetic":
				case "string":
				case "typecast":
				case "date":
				case "ranking":
					if (t.target_column && t.target_column.length > 0) {
						t.target_column.forEach(targetCol => {
							const colName = getColName(targetCol);
							let datatype = t.params?.datatype || t.params?.target_datatype || "string";
							if (t.transformation_operation === "arithmetic") {
								datatype = "NUMBER";
							}
							if (t.transformation_operation === "date") {
								datatype = "DATE";
							}
							if (colName && !cols.some(c => getColName(c) === colName)) {
								cols.push({ name: colName, datatype });
							}
						});
					}
					break;
				case "rename":
					if (t.source_column && t.target_column && t.source_column.length === t.target_column.length) {
						const renameMap = {};
						t.source_column.forEach((src, idx) => {
							const tgt = t.target_column[idx];
							const srcIdx = cols.findIndex(c => getColName(c) === src);
							if (srcIdx !== -1 && tgt && tgt !== src) {
								const oldCol = cols[srcIdx];
								cols[srcIdx] = typeof oldCol === "object"
									? { ...oldCol, name: tgt }
									: { name: tgt, datatype: "string" };
								renameMap[src] = tgt;
							}
						});
						if (!renameMaps[dfId]) renameMaps[dfId] = {};
						Object.assign(renameMaps[dfId], renameMap);

						for (let j = idx + 1; j < transformationsList.length; j++) {
							const nextT = transformationsList[j];
							if (nextT.source_dataframe !== dfId) continue;
							const map = renameMaps[dfId];
							const updateColArr = (arr) => arr.map(col => map[col] || col);

							if (Array.isArray(nextT.source_column)) {
								nextT.source_column = updateColArr(nextT.source_column);
							}
							if (Array.isArray(nextT.target_column)) {
								nextT.target_column = updateColArr(nextT.target_column);
							}
						}
					}
					break;
				case "restrictcolumns":
					if (t.source_column && t.source_column.length > 0) {
						cols = cols.filter(c => t.source_column.includes(getColName(c)));
					}
					break;
				case "join":
					if (t.params?.drop_left_dataframe_collist && Array.isArray(t.params.drop_left_dataframe_collist)) {
						cols = cols.filter(c => !t.params.drop_left_dataframe_collist.includes(getColName(c)));
					}
					break;
				default:
					break;
			}
			dfCols[dfId] = cols;
		});

		window.replayedDataframeColumns = JSON.parse(JSON.stringify(dfCols));

		if (window.allNodes) {
			Object.keys(dfCols).forEach(dfId => {
				const sourceNode = window.allNodes.find(node =>
					(node.type === "source" && (node.data?.alias === dfId || node.id === dfId))
				);
				if (sourceNode && typeof sourceNode.data.onDataChange === "function" && dfCols[dfId]?.length > 0) {
					console.log(`Updating source node ${dfId} with replayed columns during replay`);
					sourceNode.data.onDataChange({ columns: [...dfCols[dfId]] });
				}
			});
		}

		return dfCols;
	}, []);

	const syncDataframeColumnsFromNodes = useCallback(() => {
		if (!window.allNodes || !window.allEdges) return;


		const targetNodeId = activeNodeId;
		if (!targetNodeId) return;

		const incomingEdges = window.allEdges.filter(edge => edge.target === targetNodeId);


		const sources = incomingEdges
			.map(edge => window.allNodes.find(node => node.id === edge.source && node.type === "source"))
			.filter(Boolean)
			.map((node) => {
				const alias = node.data?.alias || `unnamed_source_${node.id}`;
				return {
					id: alias,
					columns: node.data?.columns || [],
					label: alias,
					nodeId: node.id
				};
			});

		const allDfsMap = {};
		sources.forEach(df => {
			allDfsMap[df.id] = df;
		});
		const allDfs = Object.values(allDfsMap);

		setAllDataframes(allDfs);

		const dfCols = {};
		allDfs.forEach(df => {
			dfCols[df.id] = Array.isArray(df.columns) ? df.columns : [];
		});

		if (isEditMode && window.replayedDataframeColumns && hasReplayedRef.current) {
			Object.keys(window.replayedDataframeColumns).forEach(dfId => {
				if (window.replayedDataframeColumns[dfId] && window.replayedDataframeColumns[dfId].length > 0) {
					dfCols[dfId] = [...window.replayedDataframeColumns[dfId]];

					const sourceNode = window.allNodes.find(node =>
						(node.type === "source" && (node.data?.alias === dfId || node.id === dfId))
					);
					if (sourceNode && typeof sourceNode.data.onDataChange === "function") {
						sourceNode.data.onDataChange({ columns: [...window.replayedDataframeColumns[dfId]] });
						console.log(`Updated source node ${dfId} with replayed columns:`, window.replayedDataframeColumns[dfId]);
					}
				}
			});
		}

		setDataframeColumns(dfCols);

		setColumnsLoaded(true);

		window.nodeToDataframeMap = {};
		sources.forEach(df => {
			window.nodeToDataframeMap[df.nodeId] = df.id;
		});

		const firstSource = sources[0]?.id || "";

		setTransformations(prev =>
			prev.map(t => ({
				...t,
				source_dataframe: t.source_dataframe || firstSource,
				target_dataframe: t.target_dataframe || firstSource,
				source_column: Array.isArray(t.source_column) ? t.source_column : [],
				target_column: Array.isArray(t.target_column) ? t.target_column : [],
			}))
		);
	}, [activeNodeId, isEditMode, hasReplayedRef]);

	useEffect(() => {
		if (isOpen) {
			setColumnsLoaded(false);
			syncDataframeColumnsFromNodes();
		}
	}, [isOpen, syncDataframeColumnsFromNodes]);

	useEffect(() => {
		const handler = () => {
			if (isOpen) {
				syncDataframeColumnsFromNodes();
			}
		};
		window.addEventListener("tantor-columns-updated", handler);
		return () => window.removeEventListener("tantor-columns-updated", handler);
	}, [isOpen, syncDataframeColumnsFromNodes]);

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


	const updateJoinsSourceColumns = useCallback((sourceId, combinedColumns) => {

		setDataframeColumns(prev => ({
			...prev,
			[sourceId]: combinedColumns
		}));


		if (window.allNodes && Array.isArray(window.allNodes)) {
			const sourceNode = window.allNodes.find(n =>
				(n.data?.alias === sourceId) || (n.id === sourceId)
			);

			if (sourceNode && typeof sourceNode.data.onDataChange === "function") {
				sourceNode.data.onDataChange({ columns: combinedColumns });
			}
		}
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
    t.id === id ? {
      ...t,
      ...(t.transformation_operation === "string" && paramName === "transformation_operator"
        ? { transformation_operator: value }
        : {}),
      params: {
        ...t.params,
        [paramName]: value,
      },
    } : t
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

		const operationDef = transformationOperations.find(op => op.id === operation);
		const defaultOperator = operation === "string" ? "lpad" : "";
		let params = { custom_value: t.params.custom_value };
		let target_column = t.target_column;
		let transformation_operator = t.transformation_operator;

		switch (operation) {
		case "string":
			if (defaultOperator === "lpad" || defaultOperator === "rpad") {
			params = {
				...params,
				max_length: "",
				padding_character: "*",
			};
			} else if (defaultOperator === "substr") {
			params = {
				...params,
				start_position: "",
				no_of_character: "",
			};
			}
			transformation_operator = defaultOperator;
			break;
		case "arithmetic":
			transformation_operator = "";
			params = { custom_value: "" };
			break;
		case "colcopy":
		case "rename":
			params = {};
			if (operation === "rename") {
			target_column = t.source_column.slice();
			}
			transformation_operator = "";
			break;
		case "constantcopy":
			params = {
			value: "",
			value_type: "c",
			datatype: "string",
			};
			transformation_operator = "";
			break;
		case "join":
			params = {
			right_dataframe: "",
			join_type: "left",
			join_condition: "",
			drop_left_dataframe_collist: [],
			drop_right_dataframe_collist: [],
			};
			transformation_operator = "";
			break;
		case "filter":
			params = {
			value: "",
			filter_type: "",
			expression: "",
			};
			if (t.source_column && t.source_column.length > 0 && dataframeColumns[t.source_dataframe]) {
			const colObj = dataframeColumns[t.source_dataframe].find(
				c => (typeof c === "object" ? c.name : c) === t.source_column[0]
			);
			if (colObj && colObj.datatype) {
				const ttype = colObj.datatype.toLowerCase();
				transformation_operator = ttype.includes("char") || ttype.includes("string") ? "==" : ">=";
			} else {
				transformation_operator = "==";
			}
			} else {
			transformation_operator = "==";
			}
			break;
		case "date":
			params = {
			source_timezone: "",
			source_timeformat: "",
			target_timezone: "",
			target_timeformat: "",
			};
			transformation_operator = "";
			break;
		case "restrictcolumns":
			params = {};
			transformation_operator = "";
			break;
		case "typecast":
			params = {
			target_datatype: "",
			source_datatype: ""
			};
			transformation_operator = "";
			break;
		case "sorting":
			params = {
			order_by: {},
			};
			transformation_operator = "";
			break;
		case "ranking":
			params = {
			group_by: [],
			order_by: {},
			};
			transformation_operator = "";
			break;
		}

		return {
		...t,
		transformation_operation: operation,
		transformation_operator,
		params,
		target_column,
		};
	}));
	}, [transformationOperations, dataframeColumns]);


	const handleOperatorChange = useCallback((id, operator) => {
		setTransformations(ts => ts.map(t => {
			if (t.id !== id) return t;
			return {
				...t,
				transformation_operator: operator
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
			const newTs = [
				...ts,
				{
					id: `transformation_${ts.length + 1}`,
					source_column: [],
					target_column: [],
					params: {},
					transformation_operation: "",
					transformation_operator: "",
					source_dataframe: activeNode?.data?.alias || "",
				},
			];
			// Assign transformation_order to all
			return newTs.map((t, idx) => ({ ...t, transformation_order: idx + 1 }));
		});
	}, [activeNode]);

	const handleRemoveTransformation = useCallback((id) => {
		setTransformations(ts => {
			if (ts.length <= 1) return ts;
			const filtered = ts.filter(t => t.id !== id);
			// Reassign transformation_order after removal
			return filtered.map((t, idx) => ({ ...t, transformation_order: idx + 1 }));
		});
	}, []);


	const [transformationsValidity, setTransformationsValidity] = useState({});


	const setTransformationValidity = useCallback((id, isValid) => {
    setTransformationsValidity(prev => ({
      ...prev,
      [id]: isValid
    }));
  }, []);

	// Add string validation to the validity state
	useEffect(() => {
		setTransformationsValidity(prev => {
			const updated = { ...prev };
			transformations.forEach(t => {
				if (t.transformation_operation === "string") {
					updated[t.id] = validateStringTransformation(t);
				}
			});
			return updated;
		});
		// eslint-disable-next-line
	}, [transformations]);

	const handleSave = useCallback(() => {
		// Validate all transformations before saving
		let allValid = true;
		for (let i = 0; i < transformations.length; i++) {
			const t = transformations[i];
			if (
				(t.transformation_operation === "arithmetic" && transformationsValidity[t.id] === false) ||
				(t.transformation_operation === "string" && transformationsValidity[t.id] === false)
			) {
				allValid = false;
				break;
			}
		}
		if (!allValid) {
			alert("Please fill all required fields before applying transformations.");
			return;
		}

		const result = [];

		transformations.forEach((t, index) => {
			let targetColumns = t.target_column;
			if (t.transformation_operation === 'rename' && t.source_column.length > 0) {
				targetColumns = t.target_column.length === t.source_column.length ?
					t.target_column :
					t.source_column.map((col, idx) => t.target_column[idx] || col);
			}

			let transformationOperatorToSend = t.transformation_operator || "";

			let transformationData = {
				source_dataframe: t.source_dataframe,
				target_dataframe: t.source_dataframe,
				source_column: t.transformation_operation === 'constantcopy' ? [""] :
							t.transformation_operation === 'join' ? ["", ""] : t.source_column,
				target_column: targetColumns,
				transformation_operation: t.transformation_operation,
				transformation_operator: transformationOperatorToSend,
				transformation_order: t.transformation_order,
				params: {}
			};

			switch (t.transformation_operation) {
				case 'arithmetic':
					transformationData.params = { arith_operation: t.params.arith_operation };
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
					const joinParams = getJoinsParams(t);
					transformationData.params = {
						right_dataframe: joinParams.right_dataframe,
						join_type: joinParams.join_type,
						join_condition: joinParams.join_condition,
						drop_left_dataframe_collist: joinParams.drop_left_dataframe_collist,
						drop_right_dataframe_collist: joinParams.drop_right_dataframe_collist
					};

					// Remove the automatic restrict columns transformation creation
					// The joins component handles column dropping internally
					result.push(transformationData);
					return; // Skip the default result.push at the end
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

			result.push(transformationData);
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

		if (typeof onApplyTransformations === "function") {
			onApplyTransformations(activeNodeId, result);
		}

		onClose();
	}, [transformations, activeNode, onClose, onApplyTransformations, transformationsValidity]);

	const scrollToTransformation = useCallback((index) => {
		if (transformationRefs.current[index]) {
			transformationRefs.current[index].scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	}, []);

	const appendColumnToDataframe = useCallback((dataframeId, columnName, datatype) => {
		setDataframeColumns(prev => {
			const prevCols = prev[dataframeId] || [];
			const existingColIndex = prevCols.findIndex(col =>
				(typeof col === "object" ? col.name : col) === columnName
			);

			let newCols;
			if (existingColIndex !== -1) {
				newCols = [...prevCols];
				if (typeof newCols[existingColIndex] === "object") {
					newCols[existingColIndex] = { ...newCols[existingColIndex], datatype };
				} else {
					newCols[existingColIndex] = { name: columnName, datatype };
				}
			} else {
				newCols = [...prevCols, { name: columnName, datatype }];
			}

			return {
				...prev,
				[dataframeId]: newCols
			};
		});
	}, []);

	// Improved version with forceUpdate parameter and better dataframe column state sync
	const appendColumnsFromRightToLeft = useCallback((leftDfId, rightDfId, forceUpdate = false, droppedColumns = []) => {
		if (!leftDfId || !rightDfId || leftDfId === rightDfId) return;

		if (window.allNodes) {
			const leftNode = window.allNodes.find(
				n => (n.data?.alias === leftDfId) || (n.id === leftDfId)
			);
			const rightNode = window.allNodes.find(
				n => (n.data?.alias === rightDfId) || (n.id === rightDfId)
			);

			if (leftNode && rightNode) {
				const leftCols = Array.isArray(leftNode.data.columns) ? [...leftNode.data.columns] : [];
				const rightCols = Array.isArray(rightNode.data.columns) ? [...rightNode.data.columns] : [];
				const leftColNames = new Set(
					leftCols.map(col => typeof col === "object" && col.name ? col.name : col)
				);

				// Create a set of dropped columns for faster lookup
				const droppedColumnsSet = new Set(droppedColumns);

				let appended = false;
				const newColumns = [];

				rightCols.forEach(col => {
					const colName = typeof col === "object" && col.name ? col.name : col;
					// Only add columns that are not in the left table and not in the dropped columns list
					if (colName && !leftColNames.has(colName) && !droppedColumnsSet.has(colName)) {
						if (typeof col === "object" && col.name) {
							leftCols.push({ ...col });
							newColumns.push({ ...col });
						} else {
							leftCols.push(colName);
							newColumns.push(colName);
						}
						appended = true;
					}
				});

				// For joins, don't filter out columns here - let the joins component handle it
				const finalCols = leftCols;

				if (appended && typeof leftNode.data.onDataChange === "function") {
					// Update the node data
					leftNode.data.onDataChange({ columns: finalCols });

					// Also update our local dataframe columns state
					setDataframeColumns(prev => ({
						...prev,
						[leftDfId]: finalCols
					}));

					// If force update flag is true, refresh all transformations
					if (forceUpdate) {
						// Force refresh dataframe columns in the next render cycle
						setTimeout(() => {
							syncDataframeColumnsFromNodes();
						}, 50);
					}

					// Dispatch column update event
					window.dispatchEvent(new CustomEvent("tantor-columns-updated", {
						detail: {
							sourceId: leftDfId,
							addedColumns: newColumns,
							droppedColumns: droppedColumns
						}
					}));
				}
			}
		}
	}, [setDataframeColumns, syncDataframeColumnsFromNodes]);

	const handleAddNewTargetColumn = useCallback((columnName, dataframeId, operationType = "arithmetic", givendatatype = "NUMBER", oldColumnName = null, restrictedColumns = null, restrictType = null) => {
//   console.log("operation type is ====>", operationType);
//   console.log("given datatype is  =====>", givendatatype);
  const actualDfId = dataframeId;

  let datatype = "NUMBER";
  if (operationType === "typecast") {
    datatype = givendatatype;
  } else if (operationType === "string") {
    datatype = "STRING";
  } else if (operationType === "date") {
    datatype = "DATE";
  } else if (operationType === "constantcopy") {
    datatype = givendatatype;
  } else if (operationType === "rename") {
    datatype = givendatatype;
  } else if (operationType === "arithmetic") {
    datatype = "NUMBER";
  } else if (operationType === "ranking") {
    datatype = "NUMBER";
  }

  // Handle restrict columns operation
  if (operationType === "restrictcolumns" && restrictedColumns !== null &&
     (restrictType === "select" || restrictType === "drop" || restrictType === "restore")) {
    setDataframeColumns(prev => {
      const prevCols = prev[actualDfId] || [];
      let newCols;

      if (restrictType === "restore") {
        // Restore original columns from context
        const { state } = window.transformationContext || {};
        const originalColumns = state?.originalSourceColumns?.[actualDfId];
        newCols = originalColumns ? [...originalColumns] : prevCols;
      } else if (restrictType === "select") {
        // Keep only selected columns
        newCols = prevCols.filter(col => {
          const colName = typeof col === "object" ? col.name : col;
          return restrictedColumns.includes(colName);
        });
      } else if (restrictType === "drop") {
        // Remove selected columns (keep all others)
        newCols = prevCols.filter(col => {
          const colName = typeof col === "object" ? col.name : col;
          return !restrictedColumns.includes(colName);
        });
      } else {
        newCols = prevCols;
      }

      return {
        ...prev,
        [actualDfId]: newCols
      };
    });

    // Update the actual node data
    if (window.allNodes && Array.isArray(window.allNodes)) {
      const reactNode = window.allNodes.find(n =>
        (n.data?.alias === actualDfId) || (n.id === actualDfId)
      );
      if (reactNode && typeof reactNode.data.onDataChange === "function") {
        let updatedCols;

        if (restrictType === "restore") {
          // Get original columns from transformation context
          const { state } = window.transformationContext || {};
          const originalColumns = state?.originalSourceColumns?.[actualDfId];
          updatedCols = originalColumns ? [...originalColumns] : (Array.isArray(reactNode.data.columns) ? [...reactNode.data.columns] : []);
        } else {
          const currentCols = Array.isArray(reactNode.data.columns) ? [...reactNode.data.columns] : [];

          if (restrictType === "select") {
            // Keep only selected columns
            updatedCols = currentCols.filter(col => {
              const colName = typeof col === "object" ? col.name : col;
              return restrictedColumns.includes(colName);
            });
          } else if (restrictType === "drop") {
            // Remove selected columns (keep all others)
            updatedCols = currentCols.filter(col => {
              const colName = typeof col === "object" ? col.name : col;
              return !restrictedColumns.includes(colName);
            });
          } else {
            updatedCols = currentCols;
          }
        }

        reactNode.data.onDataChange({ columns: updatedCols });
        console.log("$$$$$$ restricted columns:", restrictType, restrictedColumns, "remaining cols:", updatedCols);
      }
    }

    // Trigger event for any other components that need to update
    setTimeout(() => {
      window.dispatchEvent(new Event("tantor-columns-updated"));
    }, 10);
    return;
  }

  // For rename operations, we need to replace the old column with the new one
  if (operationType === "rename" && oldColumnName) {
    // Update local state - replace old column with new one
    setDataframeColumns(prev => {
      const prevCols = prev[actualDfId] || [];
      const newCols = prevCols.map(col => {
        const colName = typeof col === "object" ? col.name : col;
        if (colName === oldColumnName) {
          return typeof col === "object"
            ? { ...col, name: columnName, datatype }
            : { name: columnName, datatype };
        }
        return col;
      });
      return {
        ...prev,
        [actualDfId]: newCols
      };
    });

    // Update the actual node data
    if (window.allNodes && Array.isArray(window.allNodes)) {
      const reactNode = window.allNodes.find(n =>
        (n.data?.alias === actualDfId) || (n.id === actualDfId)
      );
      if (reactNode && typeof reactNode.data.onDataChange === "function") {
        const newCols = Array.isArray(reactNode.data.columns)
          ? [...reactNode.data.columns]
          : [];

        // Replace the old column with the new one
        const updatedCols = newCols.map(col => {
          const colName = typeof col === "object" ? col.name : col;
          if (colName === oldColumnName) {
            return typeof col === "object"
              ? { ...col, name: columnName, datatype }
              : { name: columnName, datatype };
          }
          return col;
        });

        reactNode.data.onDataChange({ columns: updatedCols });
        console.log("$$$$$$ renamed column from", oldColumnName, "to", columnName, "cols:", updatedCols);
      }
    }
  } else {
    // For other operations, add the column normally
    // Update local state first for immediate UI update - use correct datatype
    appendColumnToDataframe(dataframeId, columnName, datatype);

    // --- BEGIN: Always update the actual source node's columns (edit & create flow) ---
    if (window.allNodes && Array.isArray(window.allNodes)) {
      const reactNode = window.allNodes.find(n =>
        (n.data?.alias === dataframeId) || (n.id === dataframeId)
      );
      if (reactNode && typeof reactNode.data.onDataChange === "function") {
        const newCols = Array.isArray(reactNode.data.columns)
          ? [...reactNode.data.columns]
          : [];

        // Add new column if not present - use correct datatype
        const exists = newCols.some(col =>
          (typeof col === "object" ? col.name : col) === columnName
        );
        if (!exists) {
          newCols.push({ name: columnName, datatype: datatype });
          reactNode.data.onDataChange({ columns: newCols });
          console.log(`Added new column ${columnName} to source ${dataframeId} in ${isEditMode ? 'edit' : 'create'} mode`);
        }
      }
    }
    // --- END: Always update the actual source node's columns (edit & create flow) ---

    // Update replayed columns in edit mode to include the new column - use correct datatype
    if (isEditMode && window.replayedDataframeColumns) {
      if (!window.replayedDataframeColumns[dataframeId]) {
        window.replayedDataframeColumns[dataframeId] = [];
      }

      const existsInReplayed = window.replayedDataframeColumns[dataframeId].some(col =>
        (typeof col === "object" ? col.name : col) === columnName
      );

      if (!existsInReplayed) {
        window.replayedDataframeColumns[dataframeId].push({ name: columnName, datatype: datatype });
        console.log(`Added new column ${columnName} to replayed columns for ${dataframeId}`);
      }
    }
  }

  // Dispatch a detailed event with all information about the new column
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("tantor-columns-updated", {
      detail: {
        sourceId: dataframeId,
        columnName: columnName,
        columnType: datatype,
        operationType: operationType,
        timestamp: Date.now(),
        isNewColumn: true
      }
    }));
  }, 10);
}, [appendColumnToDataframe, setDataframeColumns, isEditMode]);

// ...existing code...

// Enhance the useEffect for handling tantor-columns-updated event
useEffect(() => {
  const handler = (event) => {
    if (isOpen) {
      // Extract details if available
      const details = event.detail || {};

      // Check if specific dataframes were updated
      if (details.sourceId) {
        // Force synchronize the source node columns to ensure visibility in target mapping
        if (isEditMode && window.replayedDataframeColumns && window.replayedDataframeColumns[details.sourceId]) {
          const sourceNode = window.allNodes?.find(n =>
            (n.data?.alias === details.sourceId) || (n.id === details.sourceId)
          );

          if (sourceNode && typeof sourceNode.data.onDataChange === "function") {
            console.log(`Refreshing source node ${details.sourceId} columns after column update event`);
            sourceNode.data.onDataChange({
              columns: [...window.replayedDataframeColumns[details.sourceId]]
            });
          }

          // Also notify all nodes to refresh their column lists
          window.dispatchEvent(new CustomEvent("tantor-refresh-all-columns", {
            detail: { timestamp: Date.now() }
          }));
        }

        // Update specific dataframe
        syncDataframeColumnsFromNodes();

        // Make sure transformations are refreshed with new columns
        setTransformations(prev => {
          return prev.map(t => {
            if (t.source_dataframe === details.sourceId) {
              return { ...t };  // Create a new reference to force re-render
            }
            return t;
          });
        });
      } else {
        // General update
        syncDataframeColumnsFromNodes();
      }
    }
  };

  window.addEventListener("tantor-columns-updated", handler);
  return () => window.removeEventListener("tantor-columns-updated", handler);
}, [isOpen, syncDataframeColumnsFromNodes, isEditMode]);

// ...existing code...

	// Prefill transformations for edit flow
	useEffect(() => {
		if (!isOpen) {
			setIsDataLoaded(false);
			setColumnsLoaded(false);
			hasReplayedRef.current = false; // Reset on close
			return;
		}

		// Reset loading state when drawer opens
		setIsDataLoaded(false);

		// Detect edit mode by checking activeNode.data.transformations or transformationConfig
		if (
			activeNode &&
			(activeNode.data?.transformations?.length > 0 ||
				(activeNode.data?.transformationConfig?.operations?.length > 0))
		) {
			setIsEditMode(true);

			// Prefer transformationConfig.operations if available
			const ops =
				activeNode.data.transformationConfig?.operations?.length > 0
					? activeNode.data.transformationConfig.operations
					: activeNode.data.transformations || [];

			// Patch each transformation with required fields if missing
			const patchedOps = ops.map((op, idx) => {
				// --- PATCH: For arithmetic, if only arith_operation is present, parse it into conditions ---
				let params = op.params || {};
				if (
					op.transformation_operation === "arithmetic" &&
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
						params = {
							...params,
							conditions: [{
								left_type: left.type,
								left_value: left.value,
								operator,
								right_type: right.type,
								right_value: right.value
							}]
						};
					}
				}
				return {
					...op,
					id: op.id || `transformation_${idx + 1}`,
					source_column: op.source_column || [],
					target_column: op.target_column || [],
					params: params,
					transformation_operation: op.transformation_operation || "",
					transformation_operator: op.transformation_operator || "",
					source_dataframe: op.source_dataframe || activeNode.data.alias || "",
					transformation_order: idx + 1, // <-- Ensure order is set
				};
			});

			setInitialTransformations(patchedOps);

			// Wait for columns to load before replaying
			setTimeout(() => {
				setIsDataLoaded(true);
			}, 300);
		} else {
			setIsEditMode(false);
			setInitialTransformations([]);
			setIsDataLoaded(true); // For new flows, data is ready immediately
			if (!columnsLoaded) {
				// For new flows, wait a bit for columns to load
				setTimeout(() => {
					setIsDataLoaded(true);
				}, 100);
			}
		}
	}, [isOpen, activeNode, columnsLoaded]);

	// Use initialTransformations for drawer state if in edit mode - wait for columns to be loaded
	useEffect(() => {
		// Only run replay logic once per edit session
		if (
			isEditMode &&
			initialTransformations.length > 0 &&
			isDataLoaded &&
			columnsLoaded &&
			!hasReplayedRef.current
		) {
			const updatedDfCols = replayTransformationsForColumns(initialTransformations, dataframeColumns);
			setDataframeColumns(updatedDfCols);
			setTransformations(initialTransformations);
			hasReplayedRef.current = true;
		}
		// eslint-disable-next-line
	}, [isEditMode, initialTransformations, isDataLoaded, columnsLoaded, replayTransformationsForColumns]);

	// Reset replay flag when drawer closes or edit mode changes
	useEffect(() => {
		if (!isOpen || !isEditMode) {
			hasReplayedRef.current = false;
		}
	}, [isOpen, isEditMode]);

	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 bg-black bg-opacity-30 z-40"
				onClick={onClose}
			/>

			<div className="fixed right-0 top-0 h-full w-[750px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
				<div className="p-3 border-b border-gray-200 flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<h2 className="text-lg font-medium text-gray-800">
							Transformation
						</h2>
						{transformations.length > 1 && (
							<div className="relative inline-block text-left">
								<select
									className="pl-3 pr-8 py-1 text-sm bg-white border border-gray-300 rounded text-gray-700 focus:ring-1 focus:ring-[#8E77BB] focus:border-[#8E77BB] appearance-none cursor-pointer"
									onChange={(e) => scrollToTransformation(Number(e.target.value) - 1)}
									defaultValue=""
								>
									<option value="" disabled>Jump to...</option>
									{transformations.map((_, idx) => (
										<option key={idx} value={idx + 1}>
											Transformation {idx + 1}
										</option>
									))}
								</select>
								<div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
									<ChevronDown className="w-4 h-4 text-gray-500" />
								</div>
							</div>
						)}
					</div>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-100"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					{(!isDataLoaded || !columnsLoaded) && isEditMode ? (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8E77BB] mx-auto mb-4"></div>
								<p className="text-gray-600">Loading transformation data...</p>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							{transformations.map((transformation, index) => (
								<div
									key={transformation.id}
									ref={el => transformationRefs.current[index] = el}
								>
									<TransformationItem
										transformation={transformation}
										index={index}
										allDataframes={allDataframes}
										dataframeColumns={dataframeColumns}
										openDropdowns={openDropdowns}
										dropdownRefs={dropdownRefs}
										handleRemoveTransformation={handleRemoveTransformation}
										handleDataframeChange={handleDataframeChange}
										handleOperationChange={handleOperationChange}
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
									 onAddNewTargetColumn={handleAddNewTargetColumn}
									 appendColumnsFromRightToLeft={appendColumnsFromRightToLeft}
									 handleOperatorChange={handleOperatorChange}
									 setTransformationValidity={setTransformationValidity}
									 updateJoinsSourceColumns={updateJoinsSourceColumns}
									 updateJoinsParam={updateJoinsParam}
									/>
								</div>
							))}

							<button
								onClick={handleAddTransformation}
								className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md flex items-center justify-center text-gray-700 transition-colors"
								disabled={!isDataLoaded || !columnsLoaded}
							>
								<Plus className="w-4 h-4 mr-2 text-[#8E77BB]" />
								<span>Add Transformation</span>
							</button>
						</div>
					)}
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
						disabled={!isDataLoaded || !columnsLoaded || transformations.some(t =>
							(t.transformation_operation === "arithmetic" && transformationsValidity[t.id] === false) ||
							(t.transformation_operation === "string" && transformationsValidity[t.id] === false)
						)}
					>
						Apply
					</button>
				</div>
			</div>
		</>
	);
};




export default TransformationDrawer;

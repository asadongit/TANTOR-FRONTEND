import React, { useEffect, useMemo, useRef, useState } from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from '../../../context/AuthContext';
import FieldTooltip from './components/FieldTooltip';
import DesiredClassDropdown from './components/DesiredClassDropdown';
import SearchableSelect from './components/SearchableSelect';
import NamePaginatedSelect from './components/NamePaginatedSelect';
import CalendarDropdownField from './components/CalendarDropdownField';
import QuickPredictResultModal from './components/QuickPredictResultModal';
import PredictiveTable from './components/PredictiveTable';
import {
  extractDesiredClassOptionsFromRows,
  extractDesiredClassRawValue,
  formatToFourDecimals,
  getDesiredValueError,
  getDesiredValueRange,
  hasDesiredClassSelection,
  isDesiredValueInRange,
  normalizeDesiredClassValue,
  sanitizeNumericInput,
  toApiDateTime,
  toColumnLabel,
} from './utils/Predictiveutils';

function Predictive() {
  const hostnameAI = window._env_?.VITE_AI_API;
  const hostnameV1 = window._env_?.VITE_FAST_API;
  const { token } = useAuth();

  const [projectOptions, setProjectOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [destinationTableOptions, setDestinationTableOptions] = useState([]);
  const [columnOptions, setColumnOptions] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [isLoadingNameValues, setIsLoadingNameValues] = useState(false);
  const [columnsLoadError, setColumnsLoadError] = useState('');
  const [nameLoadError, setNameLoadError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [resultRows, setResultRows] = useState([]);
  const [resultColumns, setResultColumns] = useState([]);
  const [desiredClassOptions, setDesiredClassOptions] = useState([]);
  const [selectedDesiredClassByRow, setSelectedDesiredClassByRow] = useState({});
  const [desiredClassErrorByRow, setDesiredClassErrorByRow] = useState({});
  const [quickPredictLoadingByRow, setQuickPredictLoadingByRow] = useState({});
  const [quickPredictResult, setQuickPredictResult] = useState(null);
  const [isQuickPredictModalOpen, setIsQuickPredictModalOpen] = useState(false);
  const [quickPredictError, setQuickPredictError] = useState('');
  const [quickPredictDesiredClass, setQuickPredictDesiredClass] = useState('');
  const [prescriptiveSessionId, setPrescriptiveSessionId] = useState('');
  const [nameOptions, setNameOptions] = useState([]);
  const [modelingType, setModelingType] = useState('classification');
  const [targetColumn, setTargetColumn] = useState('');
  const [formData, setFormData] = useState({
    project: '',
    model: '',
    destinationTable: '',
    column: '',
    name: '',
    fromDate: '',
    toDate: '',
  });

  const isAnyQuickPredictRunning = Boolean(quickPredictLoadingByRow && Object.values(quickPredictLoadingByRow).some(v => v));



  const isSearchEnabled = Boolean(
    formData.project &&
    formData.model &&
    formData.destinationTable &&
    formData.column &&
    formData.name &&
    formData.fromDate &&
    formData.toDate &&
    !isAnyQuickPredictRunning
  );

  const projectSelectOptions = [
    { value: '', label: 'Select' },
    ...projectOptions.map((p) => ({ value: p, label: p })),
  ];

  const modelSelectOptions = formData.project
    ? [{ value: '', label: 'Select' }, ...modelOptions.map((m) => ({ value: m, label: m }))]
    : [{ value: '', label: 'Select project first' }];

  const destinationSelectOptions = [
    { value: '', label: 'Select' },
    ...destinationTableOptions.map((t) => ({ value: t, label: t })),
  ];

  const columnSelectOptions = [
    { value: '', label: 'Select' },
    ...columnOptions.map((c) => ({ value: c, label: c })),
  ];

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const prevProjectRef = useRef(null);
  const prevModelRef = useRef(null);
  const prevDestinationTableRef = useRef(null);
  const prevColumnRef = useRef(null);

  const getRowKey = (row, rowIndex) => row.row_ref_id || `${row.customer_id || 'row'}-${rowIndex}`;

  const handleQuickPredict = async (row, rowIndex) => {
    const rowKey = getRowKey(row, rowIndex);
    const desiredClassRaw = selectedDesiredClassByRow[rowKey];
    const desiredClass = modelingType === 'regression' 
      ? String(desiredClassRaw ?? '').trim()
      : normalizeDesiredClassValue(desiredClassRaw);

    if (
      !prescriptiveSessionId ||
      !row?.row_ref_id ||
      desiredClass === '' ||
      desiredClass === null ||
      desiredClass === undefined
    ) {
      return;
    }

    if (modelingType === 'regression' && !isDesiredValueInRange(desiredClass)) {
      setDesiredClassErrorByRow((prev) => ({
        ...prev,
        [rowKey]: getDesiredValueError(desiredClass),
      }));
      return;
    }

    setQuickPredictLoadingByRow((prev) => ({ ...prev, [rowKey]: true }));

    try {
      const response = await fetch(`${hostnameAI}/prescriptive_analysis/deployed-xai/run`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: prescriptiveSessionId,
          row_ref_id: row.row_ref_id,
          xai_methods: ['lime', 'counterfactual'],
          desired_class: desiredClass,
          modeling_type: modelingType,
          features_to_vary: 'all',
          total_CFs: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Quick predict failed: ${response.statusText}`);
      }

      const data = await response.json();
      setQuickPredictResult(data);
      setQuickPredictDesiredClass(String(desiredClass));
      setQuickPredictError('');
      setIsQuickPredictModalOpen(true);
    } catch (error) {
      console.error('Error running quick predict:', error);
      setQuickPredictResult(null);
      setQuickPredictError('Failed to generate quick predict report. Please try again.');
      setIsQuickPredictModalOpen(true);
    } finally {
      setQuickPredictLoadingByRow((prev) => ({ ...prev, [rowKey]: false }));
    }
  };

  const desiredValueRange = useMemo(
    () => getDesiredValueRange(desiredClassOptions, modelingType),
    [desiredClassOptions, modelingType]
  );

  // Shared helpers moved to utils/Predictiveutils.jsx

  const counterfactualTooltip = [
    { bold: 'Counterfactual Explanation: ', rest: 'An explanation that shows the minimal changes needed in input features to alter a model\'s prediction. Answers the question: “What needs to change to get a different outcome?”' },
    { bold: 'Desired Class: ', rest: 'The target outcome you want the model to predict instead.' }
  ];

  const limeTooltip = [
    { bold: 'LIME (Local Interpretable Model-agnostic Explanations): ', rest: 'A technique that explains individual predictions by approximating the model locally with a simple interpretable model. It highlights which features contributed most to a specific prediction.' }
  ];

  const buildColumnsFromRows = (rows, classOptions = desiredClassOptions, isRegression = false) => {
    const hiddenResponseColumns = new Set(['row_ref_id', 'aiml_mapping_index']);
    const keys = Object.keys(rows?.[0] || {}).filter((key) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      return !hiddenResponseColumns.has(normalizedKey) && !normalizedKey.startsWith('unnamed');
    });
    const baseColumns = keys.map((key) => {
      const column = {
        key,
        label: toColumnLabel(key),
        sortable: true,
        wrap: true,
      };

      // Add render function for boolean values
      // Check if the first row has this key and it's a boolean
      if (rows?.[0] && typeof rows[0][key] === 'boolean') {
        column.render = (row) => (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            row[key]
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {row[key] ? 'True' : 'False'}
          </span>
        );
      }

      return column;
    });

    const desiredClassColumn = {
      key: 'desired_class',
      label: isRegression ? 'Desired Value' : 'Desired Class',
      sortable: false,
      wrap: true,
      render: (row, rowIndex) => {
        const rowKey = getRowKey(row, rowIndex);
        const selectedValue = selectedDesiredClassByRow[rowKey] ?? '';
        const desiredValueError = desiredClassErrorByRow[rowKey];

        if (isRegression) {
          return (
            <div className="flex flex-col">
              <input
                type="text"
                inputMode="decimal"
                placeholder={desiredValueRange ? ` ${desiredValueRange.min.toFixed(2)} - ${desiredValueRange.max.toFixed(2)}` : 'Enter value'}
                value={selectedValue}
                onPaste={(e) => {
                  const paste = (e.clipboardData || window.clipboardData).getData('text');
                  if (!/^[-0-9.]+$/.test(paste)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const cleaned = sanitizeNumericInput(e.target.value);
                  setSelectedDesiredClassByRow((prev) => ({ ...prev, [rowKey]: cleaned }));
                  // Immediate validation: set or clear per-row error
                  if (cleaned === '' || !isDesiredValueInRange(cleaned)) {
                    setDesiredClassErrorByRow((prev) => ({ ...prev, [rowKey]: getDesiredValueError(cleaned) }));
                  } else {
                    setDesiredClassErrorByRow((prev) => {
                      const next = { ...prev };
                      delete next[rowKey];
                      return next;
                    });
                  }
                }
                }
                onBlur={() => {
                  // When user moves to next field, clear the inline error message for this row
                  setDesiredClassErrorByRow((prev) => {
                    const next = { ...prev };
                    delete next[rowKey];
                    return next;
                  });
                }
                }
                className={`h-8 px-3 py-1 border rounded-md bg-white text-[#332849] text-xs focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] ${desiredValueError ? 'border-red-500 bg-red-50' : 'border-[#CCCCCC]'}`}
                style={{ fontFamily: 'Satoshi, sans-serif', width: '120px' }}
              />
              {desiredValueError && (
                <p className="mt-1 text-[11px] text-red-500 leading-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {desiredValueError}
                </p>
              )}
            </div>
          );
        }

        return (
          <DesiredClassDropdown
            value={selectedValue}
            options={classOptions}
            onChange={(value) => {
              setSelectedDesiredClassByRow((prev) => ({ ...prev, [rowKey]: value }));
            }}
          />
        );
      },
    };

    const quickPredictColumn = {
      key: 'quick_predict',
      label: 'Quick Predict',
      sortable: false,
      wrap: true,
      render: (row, rowIndex) => {
        const rowKey = getRowKey(row, rowIndex);
        const desiredClass = selectedDesiredClassByRow[rowKey];
        const isLoading = Boolean(quickPredictLoadingByRow[rowKey]);
        const isAnyRowLoading = Object.values(quickPredictLoadingByRow).some(v => v);
        const isDisabled = isAnyRowLoading || !hasDesiredClassSelection(desiredClass, isRegression) || (isRegression && !isDesiredValueInRange(desiredClass)) || !row?.row_ref_id || !prescriptiveSessionId;

        return (
          <button
            type="button"
            onClick={() => handleQuickPredict(row, rowIndex)}
            disabled={isDisabled}
            className={`h-8 rounded px-3 text-xs font-medium transition-colors ${isDisabled
              ? 'bg-[#8e78b7] text-white opacity-40 cursor-not-allowed'
              : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6] cursor-pointer'
            }`}
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {isLoading ? 'Running...' : 'Run'}
          </button>
        );
      },
    };

    const predictionsIndex = baseColumns.findIndex((column) => column.key === 'predictions');
    if (predictionsIndex >= 0) {
      const nextColumns = [...baseColumns];
      nextColumns.splice(predictionsIndex + 1, 0, desiredClassColumn);
      nextColumns.splice(predictionsIndex + 2, 0, quickPredictColumn);
      return nextColumns;
    }

    return [...baseColumns, desiredClassColumn, quickPredictColumn];
  };

  useEffect(() => {
    if (resultRows.length === 0) {
      return;
    }

    setResultColumns(buildColumnsFromRows(resultRows, desiredClassOptions, modelingType === 'regression'));
  }, [
    resultRows,
    desiredClassOptions,
    selectedDesiredClassByRow,
    quickPredictLoadingByRow,
    prescriptiveSessionId,
    modelingType,
  ]);

  const defaultResultColumns = useMemo(
    () => [
      { key: 'prediction_id', label: 'Prediction Id', sortable: true },
      { key: 'customer_id', label: 'Customer Id', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'prediction_score', label: 'Prediction Score', sortable: true },
      { key: 'predicted_label', label: 'Predicted Label', sortable: true },
      { key: 'confidence', label: 'Confidence', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'created_at', label: 'Created At', sortable: true },
    ],
    []
  );

  const handleSearch = async () => {
    if (!isSearchEnabled || isSearching) {
      return;
    }

    if (!prescriptiveSessionId) {
      setHasSearched(true);
      setSearchError('Session is not initialized. Please reselect destination table and try again.');
      return;
    }

    setHasSearched(true);
    setSearchError('');
    setIsSearching(true);
    setDesiredClassOptions([]);
    setSelectedDesiredClassByRow({});
    setQuickPredictLoadingByRow({});
    setResultColumns(defaultResultColumns);
    setResultRows([]);

    try {
      const response = await fetch(`${hostnameAI}/prescriptive_analysis/prescriptive_analysis/rows`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: prescriptiveSessionId,
          column_name: formData.column,
          selected_value: formData.name,
          start_date: toApiDateTime(formData.fromDate, false),
          end_date: toApiDateTime(formData.toDate, true),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rows: ${response.statusText}`);
      }

      const data = await response.json();
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const classOptionsFromApi = Array.isArray(data?.desired_class_options)
        ? [
          ...new Set(
            data.desired_class_options
              .map((item) => normalizeDesiredClassValue(extractDesiredClassRawValue(item)))
              .filter((item) => item !== '')
          ),
        ]
        : [];

      const classOptions = classOptionsFromApi.length > 0
        ? classOptionsFromApi
        : extractDesiredClassOptionsFromRows(rows);

      const respModelingType = data?.modeling_type ?? 'classification';
      const respTargetColumn = data?.target_column_used ?? '';
      
      setModelingType(respModelingType);
      setTargetColumn(respTargetColumn);
      setDesiredClassOptions(classOptions);
      setDesiredClassErrorByRow({});
      setResultColumns(buildColumnsFromRows(rows, classOptions, respModelingType === 'regression'));
      setResultRows(rows);
    } catch (error) {
      console.error('Error fetching prescriptive results:', error);
      setSearchError('Failed to fetch results. Please try again.');
      setResultRows([]);
      setModelingType('classification');
      setTargetColumn('');
      setDesiredClassErrorByRow({});
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        // Same API used in New Schedule > Configuration tab
        const response = await fetch(`${hostnameAI}/model/list_projects`, {
          method: 'GET',
          headers: { accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        const projects = (data?.projects || []).map((p) => p.name).filter(Boolean);
        setProjectOptions(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjectOptions([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (hostnameAI) {
      fetchProjects();
    }
  }, [hostnameAI]);

  useEffect(() => {
    const fetchModels = async (projectName) => {
      setIsLoadingModels(true);    
      try {
        // Same API used in New Schedule > Configuration tab
        const response = await fetch(
          `${hostnameAI}/model/projects/${encodeURIComponent(projectName)}/prescriptive_analysis_models`,
          {
            method: 'GET',
            headers: { accept: 'application/json' },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        const data = await response.json();
        const models = (data?.models || []).map((m) => m.model_name).filter(Boolean);
        setModelOptions(models);
      } catch (error) {
        console.error('Error fetching models:', error);
        setModelOptions([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    // Check if project actually changed
    const projectChanged = prevProjectRef.current !== null && prevProjectRef.current !== formData.project;
    prevProjectRef.current = formData.project;

    // Clear all downstream fields when project changes
    if (projectChanged) {
      setModelOptions([]);
      setDestinationTableOptions([]);
      setColumnOptions([]);
      setNameOptions([]);
      setPrescriptiveSessionId('');
      setFormData((prev) => ({ ...prev, model: '', destinationTable: '', column: '', name: '', fromDate: '', toDate: '' }));
      setHasSearched(false);
      setSearchError('');
      setResultRows([]);
      setResultColumns([]);
      setDesiredClassOptions([]);
      setSelectedDesiredClassByRow({});
      setDesiredClassErrorByRow({});
      setQuickPredictLoadingByRow({});
    }

    if (formData.project) {
      fetchModels(formData.project);
    } else {
      setModelOptions([]);
      setDestinationTableOptions([]);
      setColumnOptions([]);
      setNameOptions([]);
      setPrescriptiveSessionId('');
      setFormData((prev) => ({ ...prev, model: '', destinationTable: '', column: '', name: '' }));
    }
  }, [formData.project, hostnameAI]);

  useEffect(() => {
    const fetchDestinationTables = async (modelName) => {
      setIsLoadingDestinations(true);
      try {
        const secureQueryResponse = await fetch(`${hostnameV1}/secure-query`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_query: '' }),
        });

        if (!secureQueryResponse.ok) {
          throw new Error('Failed to fetch policy IDs');
        }

        const secureQueryData = await secureQueryResponse.json();
        const policyIds = Array.isArray(secureQueryData?.matched_policy_ids)
          ? secureQueryData.matched_policy_ids
          : [];

        const response = await fetch(`${hostnameAI}/schemas/prescriptive-analysis-destination-schema/tables`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_name: modelName,
            policy_id: policyIds,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch destination tables: ${response.statusText}`);
        }

        const data = await response.json();
        const tables = Array.isArray(data?.tables)
          ? [...new Set(data.tables.filter((tableName) => typeof tableName === 'string' && tableName.trim() !== ''))]
          : [];

        setDestinationTableOptions(tables);
      } catch (error) {
        console.error('Error fetching destination tables:', error);
        setDestinationTableOptions([]);
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    // Only trigger when model actually changes (skip on first initialization)
    const modelChanged = prevModelRef.current !== null && prevModelRef.current !== formData.model;
    prevModelRef.current = formData.model;

    if (modelChanged) {
      setColumnOptions([]);
      setNameOptions([]);
      setPrescriptiveSessionId('');
      setFormData((prev) => ({ ...prev, destinationTable: '', column: '', name: '', fromDate: '', toDate: '' }));
    }

    if (hostnameAI && hostnameV1 && token && formData.model) {
      fetchDestinationTables(formData.model);
    } else {
      setDestinationTableOptions([]);
      setIsLoadingDestinations(false);
    }
  }, [formData.model, hostnameAI, hostnameV1, token]);

  useEffect(() => {
    const fetchColumns = async ({ destinationTable, runName }) => {
      setIsLoadingColumns(true);
      setColumnsLoadError('');
      try {
        const response = await fetch(`${hostnameAI}/prescriptive_analysis/prescriptive_analysis/init`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination_table: destinationTable,
            run_name: runName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch columns: ${response.statusText}`);
        }

        const data = await response.json();
        const columnCandidates = [
          data?.column_names,
          data?.columns,
          data?.data?.column_names,
          data?.data?.columns,
        ].find((candidate) => Array.isArray(candidate));

        const columns = Array.isArray(columnCandidates)
          ? [...new Set(columnCandidates.filter((columnName) => typeof columnName === 'string' && columnName.trim() !== ''))]
          : [];

        setColumnOptions(columns);
        setPrescriptiveSessionId(data?.session_id || '');
      } catch (error) {
        console.error('Error fetching prescriptive columns:', error);
        setColumnOptions([]);
        setPrescriptiveSessionId('');
        setColumnsLoadError('Unable to load columns for selected destination table.');
      } finally {
        setIsLoadingColumns(false);
      }
    };

    // Only trigger when destination table actually changes (skip on first initialization)
    const destinationTableChanged = prevDestinationTableRef.current !== null && prevDestinationTableRef.current !== formData.destinationTable;
    prevDestinationTableRef.current = formData.destinationTable;

    if (destinationTableChanged) {
      setNameOptions([]);
      setPrescriptiveSessionId('');
      setColumnsLoadError('');
      setNameLoadError('');
      setFormData((prev) => ({ ...prev, column: '', name: '', fromDate: '', toDate: '' }));
    }

    if (hostnameAI && formData.destinationTable && formData.model) {
      fetchColumns({ destinationTable: formData.destinationTable, runName: formData.model });
    } else {
      setColumnOptions([]);
      setNameOptions([]);
      setPrescriptiveSessionId('');
      setIsLoadingColumns(false);
    }
  }, [formData.destinationTable, formData.model, hostnameAI]);

  useEffect(() => {
    const fetchColumnValues = async ({ sessionId, columnName }) => {
      setIsLoadingNameValues(true);
      setNameLoadError('');
      try {
        const response = await fetch(`${hostnameAI}/prescriptive_analysis/prescriptive_analysis/column-values`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            column_name: columnName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch column values: ${response.statusText}`);
        }

        const data = await response.json();
        const directArray = [
          data,
          data?.values,
          data?.column_values,
          data?.names,
          data?.data,
          data?.distinct_values,
        ].find((candidate) => Array.isArray(candidate));

        let rawValues = [];

        if (Array.isArray(directArray)) {
          rawValues = directArray;
        } else if (data && typeof data === 'object') {
          const objectCandidate = [
            data?.values,
            data?.column_values,
            data?.data,
          ].find((candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate));

          if (objectCandidate) {
            rawValues = Object.values(objectCandidate);
          }
        }

        const options = [...new Set(rawValues)]
          .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
          .map((item) => {
            const text = typeof item === 'object' && item !== null
              ? String(item.value ?? item.name ?? item.label ?? item.column_value ?? item.columnValue ?? '')
              : String(item);
            return { value: text, label: text };
          });

        setNameOptions(options);

        if (options.length === 0) {
          setNameLoadError('No values found for the selected column.');
        }
      } catch (error) {
        console.error('Error fetching column values:', error);
        setNameOptions([]);
        setNameLoadError('Unable to load values for selected column.');
      } finally {
        setIsLoadingNameValues(false);
      }
    };

    // Only trigger when column actually changes (skip on first initialization)
    const columnChanged = prevColumnRef.current !== null && prevColumnRef.current !== formData.column;
    prevColumnRef.current = formData.column;

    if (columnChanged) {
      setFormData((prev) => ({ ...prev, name: '', fromDate: '', toDate: '' }));
      setNameLoadError('');
    }

    if (hostnameAI && prescriptiveSessionId && formData.column) {
      fetchColumnValues({ sessionId: prescriptiveSessionId, columnName: formData.column });
    } else {
      setNameOptions([]);
      setIsLoadingNameValues(false);
    }
  }, [formData.column, hostnameAI, prescriptiveSessionId]);
  return (
    <div className="min-h-screen w-full p-6 bg-gray-50 flex flex-col">
      <Breadcrumb />
      <h1 className="satoshi-heading">Prescriptive Analysis</h1>
      <div className="mt-4 rounded-xl bg-white shadow-sm min-w-[1200px] flex flex-col flex-grow">
        <div className="p-6 flex flex-col flex-grow">
          <div className="space-y-7 bg-[#FAFAFA] p-4 rounded-md flex flex-col flex-grow">
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSelect
                label="Project"
                value={formData.project}
                options={projectSelectOptions}
                field="project"
                onChange={handleFieldChange}
                isLoading={isLoadingProjects}
                isDisabled={isAnyQuickPredictRunning}
              />

              <SearchableSelect
                label="Model"
                value={formData.model}
                options={modelSelectOptions}
                field="model"
                onChange={handleFieldChange}
                isLoading={isLoadingModels}
                isDisabled={isAnyQuickPredictRunning || !formData.project || (formData.project && modelOptions.length === 0 && !isLoadingModels)}
                disabledReason={!formData.project ? 'Select project first' : modelOptions.length === 0 && !isLoadingModels ? 'No models available' : undefined}
              />

              <SearchableSelect
                label="Destination Table"
                value={formData.destinationTable}
                options={destinationSelectOptions}
                field="destinationTable"
                onChange={handleFieldChange}
                isLoading={isLoadingDestinations}
                isDisabled={isAnyQuickPredictRunning || !formData.model || (formData.model && destinationTableOptions.length === 0 && !isLoadingDestinations)}
                disabledReason={!formData.model ? 'Select model first' : destinationTableOptions.length === 0 && !isLoadingDestinations ? 'No destination tables available' : undefined}
              />

              <SearchableSelect
                label="Columns"
                value={formData.column}
                options={columnSelectOptions}
                field="column"
                onChange={handleFieldChange}
                isLoading={isLoadingColumns}
                isDisabled={isAnyQuickPredictRunning || !formData.destinationTable || (formData.destinationTable && columnOptions.length === 0 && !isLoadingColumns)}
                disabledReason={!formData.destinationTable ? 'Select destination table first' : columnOptions.length === 0 && !isLoadingColumns ? 'No columns available' : undefined}
                error={columnsLoadError}
              />

              <NamePaginatedSelect
                label="Value"
                value={formData.name}
                options={nameOptions}
                field="name"
                onChange={handleFieldChange}
                pageSize={10}
                isLoading={isLoadingNameValues}
                isDisabled={isAnyQuickPredictRunning || !formData.column || !prescriptiveSessionId || (formData.column && nameOptions.length === 0 && !isLoadingNameValues)}
                disabledReason={!formData.column ? 'Select column first' : nameOptions.length === 0 && !isLoadingNameValues ? 'No values available' : undefined}
                error={nameLoadError}
              />

              <CalendarDropdownField
                label="Prediction From"
                value={formData.fromDate}
                onChange={(value) => handleFieldChange('fromDate', value)}
                isDisabled={isAnyQuickPredictRunning}
              />

              <CalendarDropdownField
                label="Prediction To"
                value={formData.toDate}
                onChange={(value) => handleFieldChange('toDate', value)}
                minDate={formData.fromDate || undefined}
                isDisabled={isAnyQuickPredictRunning || !formData.fromDate}
                enforceMinDate={true}
                disabledReason={!formData.fromDate ? 'Select Prediction From first' : undefined}
              />
            </div>

            <div>
              <button
                type="button"
                disabled={!isSearchEnabled || isAnyQuickPredictRunning}
                onClick={handleSearch}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${(isSearchEnabled && !isAnyQuickPredictRunning)
                  ? 'bg-[#8e78b7] text-white hover:bg-[#7d67a6] cursor-pointer'
                  : 'bg-[#8e78b7] text-white cursor-not-allowed opacity-40'
                }`}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {hasSearched && (
              <div className="relative z-0 mt-2">
                {searchError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {searchError}
                  </div>
                ) : (
                  <>
                    {modelingType === 'regression' && targetColumn && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Target Column:</span>
                        <span className="text-gray-900">{targetColumn}</span>
                      </div>
                    )}
                    <PredictiveTable
                      columns={resultColumns.length > 0 ? resultColumns : defaultResultColumns}
                      data={resultRows}
                      isLoading={isSearching}
                      isError={Boolean(searchError)}
                      refetch={handleSearch}
                    />
                  </>
                )}
              </div>
            )}
            <QuickPredictResultModal
              isOpen={isQuickPredictModalOpen}
              onClose={() => setIsQuickPredictModalOpen(false)}
              result={quickPredictResult}
              errorMessage={quickPredictError}
              desiredClass={quickPredictDesiredClass}
              isRegression={modelingType === 'regression'}
              limeTooltip={limeTooltip}
              counterfactualTooltip={counterfactualTooltip}
            />
        </div>
      </div>
    </div>
  </div>
  );
}

export default Predictive;

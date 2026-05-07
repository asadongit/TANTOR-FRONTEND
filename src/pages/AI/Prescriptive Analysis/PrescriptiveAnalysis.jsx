import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Search, X } from 'lucide-react';
import Breadcrumb from '../../../components/Breadcrumb';
import DataTable from '../../../components/DataTable';
import { useAuth } from '../../../context/AuthContext';
import InfoIcons from '../../../assets/ai/infoIcon.svg';

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

  const isSearchEnabled = Boolean(
    formData.project &&
    formData.model &&
    formData.destinationTable &&
    formData.column &&
    formData.name &&
    formData.fromDate &&
    formData.toDate
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

  const toColumnLabel = (key) =>
    String(key || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const normalizeDesiredClassValue = (value) => {
    const normalizedText = String(value ?? '').trim().replace(/^['\"](.*)['\"]$/, '$1');

    if (normalizedText === '') {
      return '';
    }

    if (/^-?\d+(\.\d+)?$/.test(normalizedText)) {
      return Number(normalizedText);
    }

    if (normalizedText.toLowerCase() === 'true') {
      return true;
    }

    if (normalizedText.toLowerCase() === 'false') {
      return false;
    }

    return normalizedText;
  };

  const extractDesiredClassRawValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      return value.value
        ?? value.desired_class
        ?? value.predicted_class
        ?? value.predicted_class_name
        ?? value.predicted_label
        ?? value.class
        ?? value.label
        ?? value.name
        ?? '';
    }

    return value;
  };

  const extractDesiredClassOptionsFromRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const preferredKeys = [
      'predictions',
      'prediction',
      'predicted_label',
      'predicted_class',
      'predicted_class_name',
      'target',
      'class',
      'label',
      'npa_flag',
      'status',
    ];

    const firstRow = rows[0] || {};
    const keyMap = Object.keys(firstRow).reduce((acc, key) => {
      acc[String(key).trim().toLowerCase()] = key;
      return acc;
    }, {});

    const matchedKey = preferredKeys
      .map((key) => keyMap[key])
      .find(Boolean);

    if (!matchedKey) {
      return [];
    }

    return [
      ...new Set(
        rows
          .map((row) => normalizeDesiredClassValue(extractDesiredClassRawValue(row?.[matchedKey])))
          .filter((item) => item !== '')
      ),
    ];
  };

  const hasDesiredClassSelection = (value, isRegression = false) => {
    if (isRegression) {
      // For regression: just check if the input is not empty
      return String(value ?? '').trim() !== '';
    }
    // For classification: normalize and check
    return normalizeDesiredClassValue(value) !== '';
  };

  const FieldTooltip = ({ lines, position = 'right' }) => {
    const [visible, setVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    const TOOLTIP_WIDTH = 288;

    const showTooltip = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const rawLeft = position === 'left' ? rect.right - TOOLTIP_WIDTH : rect.left;
        const maxLeft = Math.max(8, window.innerWidth - TOOLTIP_WIDTH - 8);
        const clampedLeft = Math.min(Math.max(8, rawLeft), maxLeft);

        setTooltipPos({
          top: rect.bottom + 8,
          left: clampedLeft,
        });
      }
      setVisible(true);
    };

    const arrowStyle = position === 'left'
      ? { right: '0.375rem', top: '-0.375rem' }
      : { left: '0.75rem', top: '-0.375rem' };

    return (
      <div className="relative inline-flex items-center">
        <button
          ref={buttonRef}
          type="button"
          className="ml-1.5 text-gray-400 hover:text-gray-500 focus:outline-none flex-shrink-0"
          onMouseEnter={showTooltip}
          onMouseLeave={() => setVisible(false)}
          tabIndex={-1}
          aria-label="Field information"
        >
          <img
            src={InfoIcons}
            alt="info"
            style={{
              width: 12,
              height: 12,
              filter: 'brightness(0) saturate(100%) invert(54%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%)'
            }}
          />
        </button>

        {visible && (
          <div
            className="fixed w-72 bg-[#332849] text-white text-xs p-3 rounded-lg shadow-xl z-[10000] space-y-1.5"
            style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px`, pointerEvents: 'none' }}
          >
            {lines.map((line, i) =>
              line.bold
                ? <p key={i}><strong>{line.bold}</strong>{line.rest}</p>
                : <p key={i}>{line}</p>
            )}
            <div
              className="absolute w-3 h-3 bg-[#332849] rotate-45 rounded-sm"
              style={arrowStyle}
            />
          </div>
        )}
      </div>
    );
  };

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

        if (isRegression) {
          return (
            <input
              type="text"
              placeholder="Enter value"
              value={selectedValue}
              onChange={(e) => {
                setSelectedDesiredClassByRow((prev) => ({ ...prev, [rowKey]: e.target.value }));
              }}
              className="h-8 px-3 py-1 border rounded-md border-[#CCCCCC] bg-white text-[#332849] text-xs focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
              style={{ fontFamily: 'Satoshi, sans-serif', width: '120px' }}
            />
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
        const isDisabled = !hasDesiredClassSelection(desiredClass, isRegression) || !row?.row_ref_id || !prescriptiveSessionId || isLoading;

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

  const toApiDateTime = (dateValue, endOfDay = false) => {
    if (!dateValue) return '';
    const timePart = endOfDay ? '23:59:59.999' : '00:00:00.000';
    return `${dateValue} ${timePart}`;
  };

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
      setResultColumns(buildColumnsFromRows(rows, classOptions, respModelingType === 'regression'));
      setResultRows(rows);
    } catch (error) {
      console.error('Error fetching prescriptive results:', error);
      setSearchError('Failed to fetch results. Please try again.');
      setResultRows([]);
      setModelingType('classification');
      setTargetColumn('');
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

    setColumnOptions([]);
    setNameOptions([]);
    setPrescriptiveSessionId('');
    setFormData((prev) => ({ ...prev, destinationTable: '', column: '', name: '' }));

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

    setNameOptions([]);
    setPrescriptiveSessionId('');
    setColumnsLoadError('');
    setNameLoadError('');
    setFormData((prev) => ({ ...prev, column: '', name: '' }));

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

    setFormData((prev) => ({ ...prev, name: '' }));
    setNameLoadError('');

    if (hostnameAI && prescriptiveSessionId && formData.column) {
      fetchColumnValues({ sessionId: prescriptiveSessionId, columnName: formData.column });
    } else {
      setNameOptions([]);
      setIsLoadingNameValues(false);
    }
  }, [formData.column, hostnameAI, prescriptiveSessionId]);

  const DesiredClassDropdown = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0, placeAbove: false });

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const DROPDOWN_EST_HEIGHT = 210;
        const spaceBelow = window.innerHeight - rect.bottom;
        const positionAbove = spaceBelow < DROPDOWN_EST_HEIGHT;

        setPopupPosition({
          top: positionAbove ? rect.top - 4 : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          placeAbove: positionAbove,
        });
      }
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt === value);
    const isEmptyValue = value === '' || value === null || value === undefined;
    const selectedLabel = selectedOption === undefined ? 'Select' : String(selectedOption);

    return (
      <div ref={dropdownRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-8 min-w-[90px] px-3 py-1 border rounded-md border-[#CCCCCC] bg-white text-[#332849] text-xs focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] flex items-center justify-between whitespace-nowrap"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          <span className={`${isEmptyValue ? 'text-gray-500' : 'text-[#332849]'}`}>
            {selectedLabel}
          </span>
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div 
            className="fixed z-[9999] bg-white border border-[#CCCCCC] rounded-md shadow-lg overflow-hidden"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              width: `${popupPosition.width}px`,
              transform: popupPosition.placeAbove ? 'translateY(-100%)' : 'none',
            }}
          >
            <div className="max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                  value === '' ? 'bg-[#F2ECFF] text-[#8e78b7] font-medium' : 'text-[#332849] hover:bg-[#F7F3FF]'
                }`}
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                Select
              </button>
              {options.map((option, index) => (
                <button
                  key={`${String(option)}-${index}`}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs text-left transition-colors ${
                    value === option ? 'bg-[#F2ECFF] text-[#8e78b7] font-medium' : 'text-[#332849] hover:bg-[#F7F3FF]'
                  }`}
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  {String(option)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SearchableSelect = ({ label, value, options, field, onChange, isLoading = false, isDisabled = false, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find((opt) => opt.value === value);
    const hasRealOptions = options.length > 1 || (options.length === 1 && options[0].value !== '');

    return (
      <div ref={dropdownRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
        <label
          className="block text-sm font-medium text-[#332849] mb-1.5"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          {label}
        </label>

        <div
          onClick={() => {
            if (!isLoading && !isDisabled && hasRealOptions) {
              setIsOpen((prev) => !prev);
            }
          }}
          className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${error ? 'border-red-500' : 'border-[#CCCCCC]'} ${(isLoading || isDisabled || !hasRealOptions) ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-[#332849]'}`}
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          <span className={`${!value ? 'text-gray-500' : ''} truncate pr-2`}>
            {isLoading ? 'Loading...' : !hasRealOptions ? 'No values available' : (selectedOption?.label || 'Select')}
          </span>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        {isOpen && !isLoading && !isDisabled && hasRealOptions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-8 py-1.5 border border-[#CCCCCC] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(field, opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-[#332849]'}`}
                    style={{ fontFamily: 'Satoshi, sans-serif' }}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const NamePaginatedSelect = ({
    label,
    value,
    options,
    field,
    onChange,
    pageSize = 10,
    isLoading = false,
    isDisabled = false,
    error,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      setCurrentPage(1);
    }, [searchTerm]);

    const filteredOptions = useMemo(
      () => options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
      [options, searchTerm]
    );

    const totalPages = Math.max(1, Math.ceil(filteredOptions.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginatedOptions = filteredOptions.slice(start, start + pageSize);
    const selectedOption = options.find((opt) => opt.value === value);
    const hasRealOptions = options.length > 0;

    return (
      <div ref={dropdownRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
        <label
          className="block text-sm font-medium text-[#332849] mb-1.5"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          {label}
        </label>

        <button
          type="button"
          onClick={() => {
            if (!isLoading && !isDisabled && hasRealOptions) {
              setIsOpen((prev) => !prev);
            }
          }}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] border-[#CCCCCC] flex items-center justify-between ${
            isLoading || isDisabled || !hasRealOptions
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'bg-white text-[#332849] cursor-pointer'
          }`}
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          <span className={`${!value ? 'text-gray-500' : 'text-[#332849]'} truncate pr-2`}>
            {isLoading ? 'Loading...' : !hasRealOptions ? 'No values available' : (selectedOption?.label || 'Select')}
          </span>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && !isLoading && !isDisabled && hasRealOptions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search value..."
                  className="w-full pl-8 pr-8 py-1.5 border border-[#CCCCCC] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {paginatedOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">No values found</div>
              ) : (
                paginatedOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(field, opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-[#332849]'}`}
                    style={{ fontFamily: 'Satoshi, sans-serif' }}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className={`text-xs px-2 py-1 rounded ${safePage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-[#8e78b7] hover:bg-purple-50'}`}
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                Prev
              </button>

              <span className="text-xs text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Page {safePage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className={`text-xs px-2 py-1 rounded ${safePage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-[#8e78b7] hover:bg-purple-50'}`}
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

  const CalendarDropdownField = ({ label, value, onChange, minDate, isDisabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayMonth, setDisplayMonth] = useState(() => {
      const base = value ? new Date(`${value}T00:00:00`) : new Date();
      return base.getMonth();
    });
    const [displayYear, setDisplayYear] = useState(() => {
      const base = value ? new Date(`${value}T00:00:00`) : new Date();
      return base.getFullYear();
    });
    const containerRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isDisabled) {
        setIsOpen(false);
      }
    }, [isDisabled]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formatDisplayDate = (isoDate) => {
      if (!isoDate) return 'dd-mm-yyyy';
      const [year, month, day] = isoDate.split('-');
      return `${day}-${month}-${year}`;
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

    const minDateObj = minDate ? new Date(`${minDate}T00:00:00`) : null;
    const selectedDateObj = value ? new Date(`${value}T00:00:00`) : null;

    const handlePreviousMonth = () => {
      if (displayMonth === 0) {
        setDisplayMonth(11);
        setDisplayYear((prev) => prev - 1);
      } else {
        setDisplayMonth((prev) => prev - 1);
      }
    };

    const handleNextMonth = () => {
      if (displayMonth === 11) {
        setDisplayMonth(0);
        setDisplayYear((prev) => prev + 1);
      } else {
        setDisplayMonth((prev) => prev + 1);
      }
    };

    const renderDayCells = () => {
      const cells = [];
      const firstDay = getFirstDay(displayMonth, displayYear);
      const daysCount = getDaysInMonth(displayMonth, displayYear);

      for (let i = 0; i < firstDay; i += 1) {
        cells.push(<div key={`empty-${i}`} className="h-9" />);
      }

      for (let day = 1; day <= daysCount; day += 1) {
        const current = new Date(displayYear, displayMonth, day);
        current.setHours(0, 0, 0, 0);

        const isDisabled = minDateObj ? current < minDateObj : false;
        const isSelected = selectedDateObj
          ? current.getTime() === selectedDateObj.getTime()
          : false;

        cells.push(
          <button
            key={day}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              const yyyy = String(displayYear);
              const mm = String(displayMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              onChange(`${yyyy}-${mm}-${dd}`);
              setIsOpen(false);
            }}
            className={`h-9 rounded-md text-sm transition-colors ${isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : isSelected
                ? 'bg-[#8e78b7] text-white font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        );
      }

      return cells;
    };

    const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 1 + i);

    return (
      <div ref={containerRef} className={`relative ${isOpen ? 'z-[80]' : 'z-40'}`}>
        <label
          className="block text-sm font-medium text-[#332849] mb-1.5"
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          {label}
        </label>

        <button
          type="button"
          onClick={() => {
            if (!isDisabled) {
              setIsOpen((prev) => !prev);
            }
          }}
          disabled={isDisabled}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] border-[#CCCCCC] flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-[#332849]'}`}
          style={{ fontFamily: 'Satoshi, sans-serif' }}
        >
          <span className={`${isDisabled ? 'text-gray-400' : value ? 'text-[#332849]' : 'text-gray-500'}`}>{formatDisplayDate(value)}</span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && !isDisabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={handlePreviousMonth} className="text-gray-600 hover:text-gray-900 px-1">
                {'<'}
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={displayMonth}
                  onChange={(e) => setDisplayMonth(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
                >
                  {monthNames.map((month, idx) => (
                    <option key={month} value={idx}>{month}</option>
                  ))}
                </select>

                <select
                  value={displayYear}
                  onChange={(e) => setDisplayYear(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7]"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button type="button" onClick={handleNextMonth} className="text-gray-600 hover:text-gray-900 px-1">
                {'>'}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day) => (
                <div key={day} className="text-[11px] text-gray-500 text-center font-medium">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {renderDayCells()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const QuickPredictResultModal = ({ isOpen, onClose, result, errorMessage, desiredClass, isRegression: isRegressionModel = false }) => {
    if (!isOpen) {
      return null;
    }

    const limeReport = result?.lime_report || null;
    const counterfactualRows = Array.isArray(result?.counterfactual_report)
      ? result.counterfactual_report
      : [];
    
    const modelType = limeReport?.model_type || '';
    const isRegression = isRegressionModel || modelType?.toLowerCase().includes('regression');
    const predictedValueKey = isRegression ? 'predicted_value' : 'predicted_class_name';
    const predictedValueLabel = isRegression ? 'Predicted Value' : 'Predicted Class';
    const desiredValueLabel = isRegression ? 'Desired Value' : 'Desired Class';

    const formatToFourDecimals = (value) => {
      if (value === null || value === undefined || value === '-') return value;
      const num = parseFloat(value);
      if (isNaN(num)) return value;
      return num.toFixed(4);
    };

    return createPortal(
      <div className="fixed inset-0 z-[15000] flex items-center justify-center bg-[#00000099] p-4">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
              Predictive Analysis Report
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close quick predict report"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#818181" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 p-6">
            {errorMessage ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    LIME
                    <FieldTooltip lines={limeTooltip} position="right" />
                  </h4>
                  {limeReport ? (
                    <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs text-gray-500">{desiredValueLabel}</p>
                          <p className="font-medium">{isRegression ? formatToFourDecimals(desiredClass) : desiredClass || '-'}</p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs text-gray-500">{predictedValueLabel}</p>
                          <p className="font-medium">{isRegression ? formatToFourDecimals(limeReport[predictedValueKey]) : limeReport[predictedValueKey] ?? '-'}</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-gray-600">
                              <th className="px-4 py-2 font-medium">S.No</th>
                              <th className="px-4 py-2 font-medium">Feature Condition</th>
                              <th className="px-4 py-2 font-medium">Contribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(limeReport.explanation_for_class || []).length > 0 ? (
                              limeReport.explanation_for_class.map((item, idx) => (
                                <tr key={`${item?.[0] || 'lime'}-${idx}`} className="border-t border-gray-100">
                                  <td className="px-4 py-2">{idx + 1}</td>
                                  <td className="px-4 py-2">{item?.[0] ?? '-'}</td>
                                  <td className="px-4 py-2">{item?.[1] ?? '-'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-3 text-center text-gray-500">
                                  No LIME explanation available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                      No LIME report available.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 flex items-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    Counterfactual
                    <FieldTooltip lines={counterfactualTooltip} position="right" />
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600">
                            <th className="px-4 py-2 font-medium">S.No</th>
                            <th className="px-4 py-2 font-medium">Feature</th>
                            <th className="px-4 py-2 font-medium">Original</th>
                            <th className="px-4 py-2 font-medium">Counterfactual</th>
                            <th className="px-4 py-2 font-medium">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {counterfactualRows.length > 0 ? (
                            counterfactualRows.map((item, idx) => (
                              <tr key={`${item?.Feature || 'cf'}-${idx}`} className="border-t border-gray-100">
                                <td className="px-4 py-2">{idx + 1}</td>
                                <td className="px-4 py-2">{item?.Feature ?? '-'}</td>
                                <td className="px-4 py-2">{item?.Original ?? '-'}</td>
                                <td className="px-4 py-2">{item?.Counterfactual ?? '-'}</td>
                                <td className="px-4 py-2">{item?.Change ?? '-'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                No counterfactual report available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

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
              />

              <SearchableSelect
                label="Model"
                value={formData.model}
                options={modelSelectOptions}
                field="model"
                onChange={handleFieldChange}
                isLoading={isLoadingModels}
                isDisabled={!formData.project}
              />

              <SearchableSelect
                label="Destination Table"
                value={formData.destinationTable}
                options={destinationSelectOptions}
                field="destinationTable"
                onChange={handleFieldChange}
                isLoading={isLoadingDestinations}
                isDisabled={!formData.model}
              />

              <SearchableSelect
                label="Columns"
                value={formData.column}
                options={columnSelectOptions}
                field="column"
                onChange={handleFieldChange}
                isLoading={isLoadingColumns}
                isDisabled={!formData.destinationTable}
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
                isDisabled={!formData.column || !prescriptiveSessionId}
                error={nameLoadError}
              />

              <CalendarDropdownField
                label="Prediction From"
                value={formData.fromDate}
                onChange={(value) => handleFieldChange('fromDate', value)}
              />

              <CalendarDropdownField
                label="Prediction To"
                value={formData.toDate}
                onChange={(value) => handleFieldChange('toDate', value)}
                minDate={formData.fromDate || undefined}
                isDisabled={!formData.fromDate}
              />
            </div>

            <div>
              <button
                type="button"
                disabled={!isSearchEnabled}
                onClick={handleSearch}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isSearchEnabled
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
                    <DataTable
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
            />
        </div>
      </div>
    </div>
  </div>
  );
}

export default Predictive;

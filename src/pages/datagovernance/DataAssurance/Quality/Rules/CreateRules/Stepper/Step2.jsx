import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Trash2, PlayCircle, RefreshCw, X, Info } from 'lucide-react';
import AceEditor from 'react-ace';
import Select, { components } from 'react-select';
import { useStepData } from './StepContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../../../context/AuthContext';
import { secureQuery } from '../../../../../DataCatalogue/Components/function.js';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/ext-language_tools';

const CheckboxOption = props => {
  const { isSelected, label, innerProps, selectProps } = props;
  const isMulti = selectProps.isMulti;

  return (
    <components.Option {...props}>
      <div className="flex items-center">
        {isMulti && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => { }}
            className="mr-2 form-checkbox text-[#8d77ba] h-4 w-4"
          />
        )}
        <span>{label}</span>
      </div>
    </components.Option>
  );
};

const CustomMultiValueLabel = props => {
  return (
    <components.MultiValueLabel
      {...props}
      innerProps={{
        ...props.innerProps,
        title: props.data.label
      }}
    />
  );
};

const InfoModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#8d77ba]">Instruction Manual – Writing Rule & Score Queries</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 mb-4">
              <strong>Note:</strong> All queries are executed on the Trino engine. Please follow Trino-compatible SQL syntax for all rule and score queries.
            </p>

            <p className="mb-6">
              <strong>Reference:</strong>{' '}
              <a
                href="https://trino.io/docs/current/functions.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8d77ba] hover:underline"
              >
                Trino SQL Documentation
              </a>
            </p>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#8d77ba] border-b pb-2 mb-3">Table Reference Format</h3>
              <p className="mb-2">Use fully qualified table names:</p>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm mb-2">
                connectionname.schemaname.tablename
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#8d77ba] border-b pb-2 mb-3">Column Reference Format</h3>
              <p className="mb-2">Use either:</p>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm mb-2">
                Simple: columnname<br />
                Fully qualified: connectionname.schemaname.tablename.columnname
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#8d77ba] border-b pb-2 mb-3">Rule Query Instructions</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Rule queries should return violating rows.</li>
                <li>If the query returns no rows, the rule is considered satisfied.</li>
                <li>If the query returns any rows, the rule is violated.</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#8d77ba] border-b pb-2 mb-3">Score Query Instructions</h3>
              <ul className="list-disc pl-5 space-y-2 mb-3">
                <li>Score query must return two columns:</li>
                <ul className="list-[circle] pl-5 mt-1 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">vio_count</code> – number of violating rows.</li>
                  <li><code className="bg-gray-100 px-1 rounded">total_count</code> – total number of applicable rows.</li>
                </ul>
              </ul>
              <p className="mt-3">
                Score is calculated in backend as:
              </p>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm mt-2">
                score = 100 - (vio_count * 100.0 / total_count)
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#8d77ba] text-white rounded-md hover:bg-[#7a67a0] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Step2({ data, onBack, onNext, step2Data, edit = false, fromRuleRunSummary = false, selectedRuleIds = [] }) {
  const { stepData, setStepData } = useStepData();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [querySearchText, setQuerySearchText] = useState('');
  const [validationFilter, setValidationFilter] = useState('all');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('rule');
  const ruleEditorRef = useRef(null);
  const scoreEditorRef = useRef(null);
  const [isCustomCreate, setIsCustomCreate] = useState(false);
  const [policyIds, setPolicyIds] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState({});
  const [isLoadingTables, setIsLoadingTables] = useState({});
  const [isLoadingColumns, setIsLoadingColumns] = useState({});
  const initialStep2Data = stepData.step2 || step2Data;

  const [validationStatus, setValidationStatusState] = useState(() => {
    const initialStatus = stepData.validationStatus || {};
    const newStatus = {};
    if (Array.isArray(initialStep2Data)) {
      initialStep2Data.forEach(ruleObj => {
        const groupName = ruleObj.group;
        const ruleId = ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId;
        const ruleIdx = data.rules[groupName]?.findIndex(r => r.id === ruleId);

        if (ruleIdx !== -1) {
          const queryKey = `${groupName}__${ruleIdx}`;
          (ruleObj.connection_details || []).forEach((conn, connIdx) => {
            const connKey = `${queryKey}__${connIdx}`;
            newStatus[connKey] = {
              ruleQueryStatus: initialStatus[connKey]?.ruleQueryStatus || 'validate_again', 
              scoreQueryStatus: initialStatus[connKey]?.scoreQueryStatus || (data?.category.toLowerCase() === 'custom' ? 'validate_again' : null), 
            };
          });
        }
      });
    }
    return newStatus;
  });

  useEffect(() => {
    setStepData(prev => ({ ...prev, validationStatus }));
  }, [validationStatus]);

  useEffect(() => {
    if (stepData.validationStatus) {
      setValidationStatusState(stepData.validationStatus);
    }
  }, []);

  const setValidationStatus = useCallback((updater) => {
    setValidationStatusState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const updated = { ...prev };
      for (const key in next) {
        if (updated[key]) {
          updated[key] = { ...updated[key], ...next[key] };
        } else {
          updated[key] = next[key];
        }
      }
      return updated;
    });
  }, []);



  const [expandedGroups, setExpandedGroups] = useState({});
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const separatorRef = useRef(null);

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeRuleIndex, setActiveRuleIndex] = useState(0);

  const groupNames = Object.keys(data.rules);

  function buildInitialState() {
    const initialQueries = {};
    const initialScoreQueries = {};
    const initialSelected = {};
    const initialConnections = {};

    if (initialStep2Data && Array.isArray(initialStep2Data)) {
      initialStep2Data.forEach(ruleObj => {
        const groupName = ruleObj.group;
        if (!initialQueries[groupName]) initialQueries[groupName] = [];
        if (!initialScoreQueries[groupName]) initialScoreQueries[groupName] = [];
        initialQueries[groupName].push({
          id: ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId,
          name: ruleObj.rule?.name || ruleObj.ruleName,
          query: ruleObj.rule?.query || ruleObj.query || '',
        });
        initialScoreQueries[groupName].push({
          id: ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId,
          name: ruleObj.rule?.name || ruleObj.ruleName,
          score_query: ruleObj.rule?.score_query || ruleObj.score_query || '',
        });
        if (!initialSelected[groupName]) initialSelected[groupName] = new Set();
        initialSelected[groupName].add(ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId);

        const ruleIdx = initialQueries[groupName].length - 1;

        const connectionsArr = ruleObj.connection_details || ruleObj.connections || [];
        initialConnections[`${groupName}__${ruleIdx}`] = (connectionsArr || []).map((conn, idx) => ({
          id: idx + 1,
          checked: true,
          connection: conn.connection || '',
          schema: Array.isArray(conn.schema) ? conn.schema.map(s => (typeof s === 'string' ? s.split('.').pop() : s)) : (conn.schema ? [conn.schema.split('.').pop()] : []),
          table: Array.isArray(conn.tables) ? conn.tables.map(t => (typeof t === 'string' ? t.split('.').pop() : t)) : (conn.tables ? [conn.tables.split('.').pop()] : []),
          column: Array.isArray(conn.columns) ? conn.columns.map(c => (typeof c === 'string' ? c.split('.').pop() : c)) : (conn.columns ? [conn.columns.split('.').pop()] : []),
        }));
      });
    } else {
      Object.entries(data.rules).forEach(([groupName, rules]) => {
        initialQueries[groupName] = rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          query: rule.query || `No Query defined for Rule: "${rule.name}"`,
        }));
        initialScoreQueries[groupName] = rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          score_query: rule.score_query || `No Score Query defined for Rule: "${rule.name}"`,
        }));
        initialSelected[groupName] = new Set(rules.map(rule => rule.id));
        rules.forEach((rule, rIdx) => {
          initialConnections[`${groupName}__${rIdx}`] = [
            {
              id: 1,
              checked: true,
              connection: '',
              schema: [],
              table: [],
              column: []
            }
          ];
        });
      });
    }
    return { initialQueries, initialScoreQueries, initialSelected, initialConnections };
  }

  const initialStateRef = useRef(buildInitialState());
  const [queries, setQueries] = useState(initialStateRef.current.initialQueries);
  const [scoreQueries, setScoreQueries] = useState(initialStateRef.current.initialScoreQueries);
  const [selectedRules, setSelectedRules] = useState(initialStateRef.current.initialSelected);
  const [connectionsByQuery, setConnectionsByQuery] = useState(initialStateRef.current.initialConnections);

  useEffect(() => {
    if (initialStep2Data && Array.isArray(initialStep2Data)) {
      const { initialQueries, initialScoreQueries, initialSelected, initialConnections } = buildInitialState();
      setQueries(initialQueries);
      setScoreQueries(initialScoreQueries);
      setSelectedRules(initialSelected);
      setConnectionsByQuery(initialConnections);
    }
  }, [initialStep2Data]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const toggleLeftPanel = () => {
    setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      let newWidthPercent = (mouseX / containerWidth) * 100;
      newWidthPercent = Math.max(30, Math.min(newWidthPercent, 60));

      setLeftPanelWidth(newWidthPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleQueryChange = (value, isScoreQuery = false) => {
    const currentGroup = groupNames[activeGroupIndex];
    const queryKey = `${currentGroup}__${activeRuleIndex}`; 

    if (isScoreQuery) {
      const updatedScoreQueries = { ...scoreQueries };
      if (updatedScoreQueries[currentGroup] && updatedScoreQueries[currentGroup][activeRuleIndex]) {
        updatedScoreQueries[currentGroup][activeRuleIndex].score_query = value;
        setScoreQueries(updatedScoreQueries);
      }
    } else {
      const updatedQueries = { ...queries };
      if (updatedQueries[currentGroup] && updatedQueries[currentGroup][activeRuleIndex]) {
        updatedQueries[currentGroup][activeRuleIndex].query = value;
        setQueries(updatedQueries);
      }
    }

    const conns = connectionsByQuery[queryKey] || [];
    setValidationStatus(prev => {
      const updated = { ...prev };
      conns.forEach((_, idx) => {
        const connKey = `${queryKey}__${idx}`;
        if (isScoreQuery) {
          updated[connKey] = { ...(updated[connKey] || {}), scoreQueryStatus: 'validate_again' };
        } else {
          updated[connKey] = { ...(updated[connKey] || {}), ruleQueryStatus: 'validate_again' };
        }
      });
      return updated;
    });
  };

  const handleRuleCheckbox = (groupName, ruleId) => {
    setSelectedRules(prev => {
      const groupSet = new Set(prev[groupName]);
      if (groupSet.has(ruleId)) {
        groupSet.delete(ruleId);
      } else {
        groupSet.add(ruleId);
      }
      if (
        groupName === groupNames[activeGroupIndex] &&
        queries[groupName] &&
        queries[groupName][activeRuleIndex] &&
        queries[groupName][activeRuleIndex].id === ruleId &&
        !groupSet.has(ruleId)
      ) {
        const selectedList = getAllSelectedRules();
        const currentFlatIndex = selectedList.findIndex(
          ([g, rIdx]) =>
            g === groupName &&
            queries[g][rIdx].id === ruleId
        );
        let nextIndex = currentFlatIndex + 1;
        if (nextIndex >= selectedList.length) nextIndex = currentFlatIndex - 1;
        if (nextIndex >= 0 && selectedList[nextIndex]) {
          const [nextGroup, nextRuleIdx] = selectedList[nextIndex];
          setActiveGroupIndex(groupNames.indexOf(nextGroup));
          setActiveRuleIndex(nextRuleIdx);
        }
      }
      return { ...prev, [groupName]: groupSet };
    });
  };

  const getAllSelectedRules = () => {
    const selected = [];
    groupNames.forEach((groupName, gIdx) => {
      if (!selectedRules[groupName]) return;
      data.rules[groupName].forEach((rule, rIdx) => {
        if (selectedRules[groupName].has(rule.id)) {
          selected.push([groupName, rIdx]);
        }
      });
    });
    return selected;
  };

  const getCurrentSelectedFlatIndex = () => {
    const selected = getAllSelectedRules();
    const currentGroup = groupNames[activeGroupIndex];
    const currentRule = queries[currentGroup]?.[activeRuleIndex];
    const idx = selected.findIndex(
      ([g, rIdx]) =>
        g === currentGroup &&
        queries[g][rIdx]?.id === currentRule?.id
    );
    return { idx, total: selected.length };
  };

  const goToNextQuery = () => {
    const selected = getAllSelectedRules();
    const { idx } = getCurrentSelectedFlatIndex();
    if (idx < selected.length - 1) {
      const [nextGroup, nextRuleIdx] = selected[idx + 1];
      setActiveGroupIndex(groupNames.indexOf(nextGroup));
      setActiveRuleIndex(nextRuleIdx);
    }
  };

  const goToPrevQuery = () => {
    const selected = getAllSelectedRules();
    const { idx } = getCurrentSelectedFlatIndex();
    if (idx > 0) {
      const [prevGroup, prevRuleIdx] = selected[idx - 1];
      setActiveGroupIndex(groupNames.indexOf(prevGroup));
      setActiveRuleIndex(prevRuleIdx);
    }
  };

  const handleRuleRowClick = (groupIdx, ruleIdx) => {
    setActiveGroupIndex(groupIdx);
    setActiveRuleIndex(ruleIdx);
  };

  const getQueryById = (data, id, isScoreQuery = false) => {
    if (!data?.rules) return '';
    for (const group of Object.values(data.rules)) {
      const rule = group.find(rule => rule.id === id);
      if (rule) {
        return isScoreQuery ? (rule.score_query || '') : (rule.query || '');
      }
    }
    return '';
  };

  useEffect(() => {
    const currentGroup = groupNames[activeGroupIndex];
    const rule = queries[currentGroup]?.[activeRuleIndex];
    if (rule && selectedRules[currentGroup]?.has(rule.id)) {
      const givenQuery = getQueryById(data, rule.id);
      const givenScoreQuery = getQueryById(data, rule.id, true);
      const isQueryEmpty = givenQuery === '' || givenQuery == null;
      const isScoreQueryEmpty = givenScoreQuery === '' || givenScoreQuery == null;
      setIsCustomCreate(!edit && data?.category.toLowerCase() === 'custom' && (!isQueryEmpty || !isScoreQueryEmpty));
    } else {
      setIsCustomCreate(false);
    }
  }, [activeGroupIndex, activeRuleIndex, queries, selectedRules, data, edit]);

  const getCurrentQuery = (isScoreQuery = false) => {
    const currentGroup = groupNames[activeGroupIndex];
    if (isScoreQuery) {
      const rule = scoreQueries[currentGroup]?.[activeRuleIndex];
      if (!rule || !selectedRules[currentGroup]?.has(rule.id)) return '';
      return rule.score_query;
    } else {
      const rule = queries[currentGroup]?.[activeRuleIndex];
      if (!rule || !selectedRules[currentGroup]?.has(rule.id)) return '';
      return rule.query;
    }
  };

  const [connectionOptions, setConnectionOptions] = useState([]);
  const [schemasByConnection, setSchemasByConnection] = useState({});
  const [tablesBySchema, setTablesBySchema] = useState({});
  const [columnsByTable, setColumnsByTable] = useState({});

  const fetchConnections = () => {
    setIsLoadingConnections(true);
    fetch(`${window._env_?.VITE_FAST_API}/connections/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matched_policy_ids: policyIds,
      }),
    })
      .then(response => response.json())
      .then(data => {
        const connectionsArr = Array.isArray(data) ? data : [];
        const formattedOptions = connectionsArr.map(conn => ({
          value: conn.connection_name,
          label: conn.connection_name,
        }));
        setConnectionOptions(formattedOptions);
      })
      .catch(error => {
        console.error('Error fetching connections:', error);
      })
      .finally(() => {
        setIsLoadingConnections(false);
      });
  };

  useEffect(() => {
    const fetchPolicyIds = async () => {
      try {
        const secureQueryResponse = await secureQuery({ user_query: "" }, token);
        const ids = secureQueryResponse.matched_policy_ids || [];
        setPolicyIds(ids);
      } catch (error) {
        console.error('Error fetching policy IDs:', error);
      }
    };
    fetchPolicyIds();
  }, [token]);

  useEffect(() => {
    if (policyIds.length > 0 && connectionOptions.length === 0) {
      fetchConnections();
    }
  }, [policyIds]);

  const fetchSchemas = (connectionName) => {
    if (!connectionName || schemasByConnection[connectionName] || !policyIds.length) return;
    setIsLoadingSchemas(prev => ({ ...prev, [connectionName]: true }));
    fetch(`${window._env_?.VITE_FAST_API}/schemas/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matched_policy_ids: policyIds,
        connection_name: connectionName,
      }),
    })
      .then(response => response.json())
      .then(data => {
        const schemasArr = Array.isArray(data) && data[0] && data[0][connectionName]
          ? data[0][connectionName]
          : [];
        setSchemasByConnection(prev => ({ ...prev, [connectionName]: schemasArr }));
      })
      .catch(error => {
        console.error('Error fetching schemas:', error);
      })
      .finally(() => {
        setIsLoadingSchemas(prev => ({ ...prev, [connectionName]: false }));
      });
  };

  const fetchTables = (connectionName, schemaName) => {
    if (!connectionName || !schemaName || tablesBySchema[`${connectionName}__${schemaName}`] || !policyIds.length) return;
    setIsLoadingTables(prev => ({ ...prev, [`${connectionName}__${schemaName}`]: true }));
    fetch(`${window._env_?.VITE_FAST_API}/tables/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matched_policy_ids: policyIds,
        connection_name: connectionName,
        schema_name: [schemaName],
      }),
    })
      .then(response => response.json())
      .then(data => {
        const schemas = Array.isArray(data.schemas) ? data.schemas : [];
        const tablesArr = schemas.find(s => s.connection_name === connectionName && s.schema === schemaName)?.tables || [];
        setTablesBySchema(prev => ({ ...prev, [`${connectionName}__${schemaName}`]: tablesArr }));
      })
      .catch(error => {
        console.error('Error fetching tables:', error);
      })
      .finally(() => {
        setIsLoadingTables(prev => ({ ...prev, [`${connectionName}__${schemaName}`]: false }));
      });
  };

  const fetchColumns = (connectionName, schemaName, tableName) => {
    if (!connectionName || !schemaName || !tableName || !policyIds.length) return;
    const tableNameOnly = tableName.split('.').pop();
    const key = `${schemaName}__${tableNameOnly}`;
    if (columnsByTable[key]) return;
    setIsLoadingColumns(prev => ({ ...prev, [key]: true }));
    fetch(`${window._env_?.VITE_FAST_API}/columns/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        matched_policy_ids: policyIds,
        connection_name: connectionName,
        schema_name: [schemaName],
        table_name: [tableNameOnly],
      }),
    })
      .then(response => response.json())
      .then(data => {
        const columnsArr = Array.isArray(data.columns)
          ? data.columns.find(c => c.connection_name === connectionName && c.schema === schemaName && c.table_name === tableNameOnly)?.columns.map(col => col.column_name) || []
          : [];
        setColumnsByTable(prev => ({ ...prev, [key]: columnsArr }));
      })
      .catch(error => {
        console.error('Error fetching columns:', error);
      })
      .finally(() => {
        setIsLoadingColumns(prev => ({ ...prev, [key]: false }));
      });
  };

  const getCurrentQueryKey = () => {
    const currentGroup = groupNames[activeGroupIndex];
    return `${currentGroup}__${activeRuleIndex}`;
  };

  const connections = connectionsByQuery[getCurrentQueryKey()] || [];

  const setConnectionsForCurrent = (newConnections, changedId = null, isDuplicate = false) => {
    setConnectionsByQuery(prev => ({
      ...prev,
      [getCurrentQueryKey()]: newConnections
    }));

    const queryKey = getCurrentQueryKey();
    setValidationStatus(prev => {
      const updated = { ...prev };
      if (changedId !== null && !isDuplicate) {
        const idx = newConnections.findIndex(conn => conn.id === changedId);
        if (idx !== -1) {
          const connKey = `${queryKey}__${idx}`;
          updated[connKey] = {
            ruleQueryStatus: 'validate_again',
            scoreQueryStatus: data?.category.toLowerCase() === 'custom' ? 'validate_again' : null,
          };
        }
      }
      if (isDuplicate) {
        newConnections.forEach((conn, idx) => {
          const connKey = `${queryKey}__${idx}`;
          if (!prev[connKey]) { 
            updated[connKey] = {
              ruleQueryStatus: 'validate_again',
              scoreQueryStatus: 'validate_again',
            };
          }
        });
        for (const key in updated) {
          if (key.startsWith(queryKey + '__') && !newConnections.some((c, i) => `${queryKey}__${i}` === key)) {
            delete updated[key];
          }
        }
      }
      return updated;
    });
  };

  const handleConnectionChange = (id, selectedOption) => {
    const value = selectedOption ? selectedOption.value : '';
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, connection: value, schema: [], table: [], column: [] }
          : conn
      ),
      id
    );
  };

  const handleSchemaChange = (id, selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, schema: values, table: [], column: [] }
          : conn
      ),
      id
    );
  };

  const handleTableChange = (id, selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, table: values, column: [] }
          : conn
      ),
      id
    );
  };

  const handleColumnChange = (id, selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, column: values }
          : conn
      ),
      id
    );
  };

  const handleCheck = (id) => {
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id ? { ...conn, checked: !conn.checked } : conn
      )
    );
  };

  const handleDelete = (id) => {
    setConnectionsForCurrent(connections.filter(conn => conn.id !== id));
  };

  const handleDuplicateConnection = (conn) => {
    setConnectionsForCurrent(
      [
        ...connections,
        {
          id: Date.now(),
          checked: true,
          connection: conn.connection,
          schema: conn.schema,
          table: conn.table,
          column: conn.column
        }
      ],
      null,
      true
    );
  };

  const handleRefresh = (conn) => {
    setConnectionsForCurrent(
      connections.map(c =>
        c.id === conn.id
          ? { ...c, connection: '', schema: [], table: [], column: [] }
          : c
      )
    );
  };

  const generateResultJson = () => {
    const result = [];
    const category = data.category;
    const type = data.type;
    groupNames.forEach((groupName, gIdx) => {
      (queries[groupName] || []).forEach((ruleObj, rIdx) => {
        if (!selectedRules[groupName]?.has(ruleObj.id)) return;
        const queryKey = `${groupName}__${rIdx}`;
        const connections = (connectionsByQuery[queryKey] || [])
          .filter(conn => conn.checked && conn.connection)
          .map(conn => {
            const connection = conn.connection;

            const schemas = (conn.schema || []).map(s => `${connection}.${s}`);

            const tables = (conn.table || []).map(t => {
              const tableName = t.split('.').pop();
              const schema = (conn.schema || [])[0] || '';
              return schema ? `${connection}.${schema}.${tableName}` : `${connection}.${tableName}`;
            });

            const columns = (conn.column || []).map(c => {
              const columnName = c.split('.').pop();
              const schema = (conn.schema || [])[0] || '';
              const table = (conn.table || [])[0] || '';
              return schema && table
                ? `${connection}.${schema}.${table}.${columnName}`
                : `${connection}.${columnName}`;
            });

            return {
              connection,
              schema: schemas.length === 1 ? schemas[0] : schemas.length > 1 ? schemas : '',
              tables: tables.length === 1 ? tables[0] : tables.length > 1 ? tables : '',
              columns: columns.length === 1 ? columns[0] : columns.length > 1 ? columns : '',
            };
          });

        const originalRule =
          (data.rules[groupName] || []).find(r => r.id === ruleObj.id) || {};

        const scoreQueryObj = (scoreQueries[groupName] || []).find(sq => sq.id === ruleObj.id) || {};

        const ruleData = {
          ...(ruleObj.id ? { id: ruleObj.id } : {}),
          category,
          type,
          group: groupName,
          rule: {
            id: ruleObj.id,
            name: ruleObj.name,
            query: ruleObj.query,
            score_query: scoreQueryObj.score_query || '',
            description: originalRule.description ?? originalRule.desc ?? "",
            severity: originalRule.severity ?? "High",
            status: originalRule.status ?? "Active",
            owner: originalRule.owner ?? "",
          },
        };

        if (connections.length > 0) {
          ruleData.connection_details = connections;
        }

        result.push(ruleData);
      });
    });
    return result;
  };

  const handleNextClick = () => {
    const json = generateResultJson();
    console.log(json);
    setStepData(prev => ({ ...prev, step2: json }));
    onNext(json);
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: '#8d77ba',
      '&:hover': { borderColor: '#7a67a0' },
      boxShadow: state.isFocused ? '0 0 0 1px #8d77ba' : null,
      minHeight: '38px',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f3f0f9',
      maxWidth: '90%',
      overflow: 'hidden',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#8d77ba',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#8d77ba',
      '&:hover': { backgroundColor: '#8d77ba', color: 'white' },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f3f0f9' : null,
      color: '#333',
      padding: '8px 12px',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999
    }),
    valueContainer: (base) => ({
      ...base,
      overflow: 'visible',
      flexWrap: 'wrap'
    })
  };

  const customComponents = {
    Option: CheckboxOption,
    MultiValueLabel: CustomMultiValueLabel
  };

  const getFirst = arr => Array.isArray(arr) && arr.length > 0 ? arr[0] : '';

  const replacePlaceholders = (query, conn, schemas, tables, columns) => {
    let result = query;
    const connectionName = conn || '';
    const schemaName = Array.isArray(schemas) && schemas.length > 0
      ? (schemas[0]?.split('.').pop() || schemas[0])
      : (schemas ? (schemas.split('.').pop() || schemas) : '');
    const tableName = Array.isArray(tables) && tables.length > 0
      ? (tables[0]?.split('.').pop() || tables[0])
      : (tables ? (tables.split('.').pop() || tables) : '');
    const columnName = Array.isArray(columns) && columns.length > 0
      ? (columns[0]?.split('.').pop() || columns[0])
      : (columns ? (columns.split('.').pop() || columns) : '');

    if (connectionName) {
      result = result.replace(/\bconnection\b/g, connectionName);
    }
    if (schemaName) {
      result = result.replace(/\bschema\b/g, schemaName);
    }
    if (tableName) {
      result = result.replace(/\btable\b/g, tableName);
    }
    if (columnName) {
      result = result.replace(/\bcolumn\b/g, columnName);
    }
    return result;
  };

  const handleRunSQL = async (groupName, ruleIdx, connIdx, isScoreQuery = false) => {
    const queryKey = `${groupName}__${ruleIdx}`;
    const conns = connectionsByQuery[queryKey] || [];
    const targetConn = conns[connIdx];
    if (!targetConn) return;

    const sameConnIndices = conns
      .map((c, idx) => (c.connection === targetConn.connection && c.checked ? idx : null))
      .filter(idx => idx !== null);

    for (const idx of sameConnIndices) {
      const conn = conns[idx];
      const connKey = `${queryKey}__${idx}`;
      const rule = isScoreQuery ? scoreQueries[groupName][ruleIdx] : queries[groupName][ruleIdx];
      if (!rule || !conn) continue;

      const queryField = isScoreQuery ? 'score_query' : 'query';
      const statusField = isScoreQuery ? 'scoreQueryStatus' : 'ruleQueryStatus'; 

      const replacedQuery = replacePlaceholders(
        rule[queryField],
        conn.connection,
        conn.schema,
        conn.table,
        conn.column
      );

      setValidationStatus(prev => ({
        ...prev,
        [connKey]: { ...(prev[connKey] || {}), [statusField]: 'pending' }
      }));

      try {
        const res = await fetch(`${window._env_?.VITE_FAST_API}/rules/executerule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: replacedQuery }),
        });
        if (res.ok) {
          setValidationStatus(prev => ({
            ...prev,
            [connKey]: { ...(prev[connKey] || {}), [statusField]: 'success' }
          }));
        } else {
          setValidationStatus(prev => ({
            ...prev,
            [connKey]: { ...(prev[connKey] || {}), [statusField]: 'error' }
          }));
        }
      } catch {
        setValidationStatus(prev => ({
          ...prev,
          [connKey]: { ...(prev[connKey] || {}), [statusField]: 'error' }
        }));
      }
    }
  };

  const allValidated = (() => {
    let all = true;
    groupNames.forEach((groupName) => {
      (queries[groupName] || []).forEach((ruleObj, ruleIdx) => {
        if (!selectedRules[groupName]?.has(ruleObj.id)) return; 

        const queryKey = `${groupName}__${ruleIdx}`;
        const conns = connectionsByQuery[queryKey] || [];

        conns.forEach((conn, connIdx) => {
          if (!conn.checked) return; 

          const connKey = `${queryKey}__${connIdx}`;
          const currentValidation = validationStatus[connKey];

          if (data?.category.toLowerCase() === 'pre-built') {
            if (currentValidation?.ruleQueryStatus !== 'success') {
              all = false;
              return; 
            }
          } else { 
            if (currentValidation?.ruleQueryStatus !== 'success' || currentValidation?.scoreQueryStatus !== 'success') {
              all = false;
              return; 
            }
          }
        });
        if (!all) return; 
      });
      if (!all) return; 
    });
    return all;
  })();

  const getUniqueValidationStatuses = () => {
    const statuses = new Set(['all']);
    Object.values(validationStatus).forEach(connStatus => {
      if (connStatus.ruleQueryStatus) statuses.add(connStatus.ruleQueryStatus);
      if (connStatus.scoreQueryStatus && data?.category.toLowerCase() === 'custom') {
        statuses.add(connStatus.scoreQueryStatus);
      }
    });
    return Array.from(statuses);
  };

  const shouldShowConnection = (groupName, ruleIdx, connIdx) => {
    const queryKey = `${groupName}__${ruleIdx}`;
    const connKey = `${queryKey}__${connIdx}`;
    const rule = queries[groupName]?.[ruleIdx];
    const scoreRule = scoreQueries[groupName]?.[ruleIdx];
    const currentValidation = validationStatus[connKey] || {};

    const meetsValidationFilter = () => {
      if (validationFilter === 'all') return true;
      if (data?.category.toLowerCase() === 'pre-built') {
        return currentValidation.ruleQueryStatus === validationFilter;
      } else { 
        if (validationFilter === 'success') {
          return currentValidation.ruleQueryStatus === 'success' && currentValidation.scoreQueryStatus === 'success';
        }
        return currentValidation.ruleQueryStatus === validationFilter || currentValidation.scoreQueryStatus === validationFilter;
      }
    };

    if (!meetsValidationFilter()) {
      return false;
    }

    if (querySearchText && rule && scoreRule) {
      const queryMatch = (rule.query || '').toLowerCase().includes(querySearchText.toLowerCase());
      const scoreQueryMatch = (scoreRule.score_query || '').toLowerCase().includes(querySearchText.toLowerCase());
      return queryMatch || scoreQueryMatch;
    }

    return true;
  };

  const searchAcrossQueries = useCallback(() => {
    if (!querySearchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [];
    let totalMatches = 0;

    groupNames.forEach((groupName, gIdx) => {
      (queries[groupName] || []).forEach((ruleObj, rIdx) => {
        if (!selectedRules[groupName]?.has(ruleObj.id)) return;

        const query = ruleObj.query || '';
        const scoreQuery = scoreQueries[groupName]?.[rIdx]?.score_query || '';
        let lastIndexQuery = 0;
        let lastIndexScoreQuery = 0;
        let count = 0;

        while (lastIndexQuery !== -1) {
          lastIndexQuery = query.toLowerCase().indexOf(querySearchText.toLowerCase(), lastIndexQuery);
          if (lastIndexQuery !== -1) {
            count++;
            lastIndexQuery += querySearchText.length;
          }
        }

        while (lastIndexScoreQuery !== -1) {
          lastIndexScoreQuery = scoreQuery.toLowerCase().indexOf(querySearchText.toLowerCase(), lastIndexScoreQuery);
          if (lastIndexScoreQuery !== -1) {
            count++;
            lastIndexScoreQuery += querySearchText.length;
          }
        }

        if (count > 0) {
          results.push({
            groupIndex: gIdx,
            ruleIndex: rIdx,
            groupName,
            ruleName: ruleObj.name,
            count,
            matches: totalMatches + 1,
            matchesTo: totalMatches + count
          });
          totalMatches += count;
        }
      });
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    return results;
  }, [querySearchText, groupNames, queries, scoreQueries, selectedRules]);

  useEffect(() => {
    if (querySearchText.trim()) {
      searchAcrossQueries();
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(-1);

      if (ruleEditorRef.current?.editor) {
        ruleEditorRef.current.editor.getSession().getSelection().clearSelection();
      }
      if (scoreEditorRef.current?.editor) {
        scoreEditorRef.current.editor.getSession().getSelection().clearSelection();
      }
    }
  }, [querySearchText]);

  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex >= 0 && currentSearchIndex < searchResults.length) {
      const searchResult = searchResults[currentSearchIndex];

      setActiveGroupIndex(searchResult.groupIndex);
      setActiveRuleIndex(searchResult.ruleIndex);

      setSearchLoaded(false);
      setTimeout(() => {
        if (activeTab === 'rule' && ruleEditorRef.current?.editor) {
          const editor = ruleEditorRef.current.editor;
          editor.findAll(querySearchText, {
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            preventScroll: true
          });
        } else if (activeTab === 'score' && scoreEditorRef.current?.editor) {
          const editor = scoreEditorRef.current.editor;
          editor.findAll(querySearchText, {
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            preventScroll: true
          });
        }
        setSearchLoaded(true);
      }, 100);
    }
  }, [currentSearchIndex, searchResults, querySearchText, activeTab]);

  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;

    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
  };

  const isPrebuiltEdit = data?.category.toLowerCase() === 'pre-built';

  const handleBackClick = () => {
    if (fromRuleRunSummary && selectedRuleIds.length > 0) {
      navigate('/datagovernance/data-assurance/rules', {
        state: { fromRuleRunSummary: true, selectedRuleIds: selectedRuleIds }
      })
    } else {
      if (edit) {
        navigate('/datagovernance/data-assurance/rules');
      } else {
        onBack();
      }
    }
  };

  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'score' && scoreEditorRef.current?.editor) {
      const editor = scoreEditorRef.current.editor;
      const currentScoreQuery = getCurrentQuery(true);
      editor.setValue(currentScoreQuery || '');
      if (querySearchText) {
        setTimeout(() => {
          editor.findAll(querySearchText, {
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            preventScroll: true
          });
          setSearchLoaded(true);
        }, 100);
      } else {
        editor.getSession().getSelection().clearSelection();
        setSearchLoaded(true);
      }
    }
  }, [activeGroupIndex, activeRuleIndex, activeTab, querySearchText]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div ref={containerRef} className="flex relative" style={{ minHeight: '600px' }}>
        {!isLeftPanelCollapsed && (
          <div
            className="border-r rounded-l-lg p-4 bg-gray-50 relative flex flex-col"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <h3 className="text-lg font-semibold mb-4">Scope</h3>

            <div className="space-y-3 overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 150px)' }}>
              {groupNames.map((groupName, index) => {
                const isExpanded = expandedGroups[groupName];
                const rulesCount = data.rules[groupName].length;
                const isActive = index === activeGroupIndex;

                const allSelected = data.rules[groupName].every(rule => selectedRules[groupName]?.has(rule.id));
                const someSelected = data.rules[groupName].some(rule => selectedRules[groupName]?.has(rule.id));

                const handleSelectAllGroup = (e) => {
                  const checked = e.target.checked;
                  setSelectedRules(prev => {
                    const groupSet = new Set(prev[groupName] || []);
                    if (checked) {
                      data.rules[groupName].forEach(rule => groupSet.add(rule.id));
                    } else {
                      data.rules[groupName].forEach(rule => groupSet.delete(rule.id));
                    }
                    return { ...prev, [groupName]: groupSet };
                  });
                };

                return (
                  <div
                    key={groupName}
                    className={`border rounded-lg bg-white overflow-hidden`}
                  >
                    <div
                      className={`p-3 flex justify-between items-center cursor-pointer ${isExpanded ? 'bg-[#8d77ba] bg-opacity-10 border-b' :
                        isActive ? 'bg-[#8d77ba] bg-opacity-5' : ''
                        }`}
                      onClick={() => toggleGroup(groupName)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center bg-[#8d77ba] text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroupIndex(index);
                          }}
                        >
                          {groupName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{groupName}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{rulesCount}</span>
                        {isExpanded ?
                          <Minus className="h-4 w-4 text-gray-600" /> :
                          <Plus className="h-4 w-4 text-gray-600" />
                        }
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 py-2 text-sm">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="py-1 text-left font-medium w-8">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={el => {
                                    if (el) el.indeterminate = !allSelected && someSelected;
                                  }}
                                  onChange={handleSelectAllGroup}
                                  className="form-checkbox text-[#8d77ba] h-4 w-4"
                                />
                              </th>
                              <th className="py-1 text-left font-medium">Name</th>
                              <th className="py-1 text-left font-medium">Status</th>
                              <th className="py-1 text-left font-medium">Severity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.rules[groupName].map((rule, rIndex) => (
                              <tr
                                key={rule.id}
                                className={`border-b last:border-b-0 cursor-pointer ${isActive && rIndex === activeRuleIndex ? 'bg-[#8d77ba] bg-opacity-10' : ''
                                  }`}
                                onClick={() => handleRuleRowClick(index, rIndex)}
                              >
                                <td className="py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedRules[groupName]?.has(rule.id) || false}
                                    onChange={e => {
                                      e.stopPropagation();
                                      handleRuleCheckbox(groupName, rule.id);
                                    }}
                                    className="form-checkbox text-[#8d77ba] h-4 w-4"
                                  />
                                </td>
                                <td className="py-2">{rule.name}</td>
                                <td className="py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${rule.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                    }`}>
                                    {rule.status}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${rule.severity === 'High' ? 'bg-red-100 text-red-700' :
                                    rule.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                    {rule.severity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={toggleLeftPanel}
              className="mt-4 w-6 h-10 flex items-center justify-center bg-white shadow-md rounded-r border border-gray-400 hover:border-[#8d77ba] transition-colors absolute left-full bottom-4 z-10"
              title={isLeftPanelCollapsed ? "Show panel" : "Hide panel"}
              type="button"
            >
              <div className="flex items-center justify-center text-gray-600 hover:text-[#8d77ba]">
                <ChevronLeft size={16} className={`transition-transform duration-300 ${isLeftPanelCollapsed ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>
        )}

        {!isLeftPanelCollapsed && (
          <div
            ref={separatorRef}
            className="w-1 bg-gradient-to-r from-gray-200 to-gray-100 cursor-col-resize flex items-center justify-center relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-0.5 h-8 bg-[#8d77ba] rounded-full mx-auto"></div>
              <div className="w-0.5 h-8 bg-[#8d77ba] rounded-full mx-0.5"></div>
            </div>
          </div>
        )}

        {isLeftPanelCollapsed && (
          <button
            onClick={toggleLeftPanel}
            className="absolute bottom-4 left-0 z-10 w-6 h-10 flex items-center justify-center bg-white shadow-md rounded-r border border-gray-200 hover:border-[#8d77ba] transition-colors"
            title="Show panel"
            type="button"
          >
            <div className="flex items-center justify-center text-gray-600 hover:text-[#8d77ba]">
              <ChevronRight size={16} />
            </div>
          </button>
        )}

        <div
          className={`p-4 ${isLeftPanelCollapsed ? '' : 'pl-6'}`}
          style={{
            width: isLeftPanelCollapsed ? 'calc(100% - 6px)' : `calc(100% - ${leftPanelWidth}% - 1px)`,
            transition: 'width 0.3s ease, padding-left 0.3s ease'
          }}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold mr-2">Apply To</h4>

              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search in queries..."
                    value={querySearchText}
                    onChange={(e) => setQuerySearchText(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#8d77ba] text-sm"
                    title="Search for text within queries"
                  />
                  {querySearchText && (
                    <>
                      <div className="absolute right-2 flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {searchResults.length > 0 && searchLoaded ? (
                            `${searchResults[currentSearchIndex] ?
                              `${searchResults[currentSearchIndex].matches}-${searchResults[currentSearchIndex].matchesTo}` : ""} of ${searchResults.reduce((total, result) => total + result.count, 0)
                            }`
                          ) : ""}
                        </span>

                        <button
                          disabled={searchResults.length === 0}
                          onClick={goToPrevSearchResult}
                          className={`p-1 rounded-md ${searchResults.length === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="Previous result"
                        >
                          <ChevronUp size={14} />
                        </button>

                        <button
                          disabled={searchResults.length === 0}
                          onClick={goToNextSearchResult}
                          className={`p-1 rounded-md ${searchResults.length === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                          title="Next result"
                        >
                          <ChevronDown size={14} />
                        </button>

                        <button
                          onClick={() => setQuerySearchText('')}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          title="Clear search"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <select
                  value={validationFilter}
                  onChange={(e) => setValidationFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8d77ba] text-sm"
                  title="Filter by validation status"
                >
                  <option value="all">All Validations</option>
                  {getUniqueValidationStatuses().includes('success') && (
                    <option value="success">Valid Queries</option>
                  )}
                  {getUniqueValidationStatuses().includes('error') && (
                    <option value="error">Invalid Queries</option>
                  )}
                </select>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                {connections.map((conn, idx) => {
                  if (!shouldShowConnection(groupNames[activeGroupIndex], activeRuleIndex, idx)) {
                    return null;
                  }

                  const schemaOpts = conn.connection ? (schemasByConnection[conn.connection] || []) : [];
                  const tableOpts = [];
                  const columnOpts = [];

                  (conn.schema || []).forEach(schema => {
                    const tableKey = conn.connection && schema ? `${conn.connection}__${schema}` : '';
                    if (tableKey && tablesBySchema[tableKey]) {
                      tablesBySchema[tableKey].forEach(tbl => {
                        tableOpts.push({ schema, table: tbl });
                      });
                    }
                  });

                  (conn.schema || []).forEach(schema => {
                    (conn.table || []).forEach(table => {
                      const tableNameOnly = table.split('.').pop();
                      const colKey = schema && tableNameOnly ? `${schema}__${tableNameOnly}` : '';
                      if (colKey && columnsByTable[colKey]) {
                        columnsByTable[colKey].forEach(col => {
                          columnOpts.push({ schema, table: tableNameOnly, column: col });
                        });
                      }
                    });
                  });

                  const schemaDropdownOpts = schemaOpts.map(opt => ({
                    value: opt,
                    label: `${conn.connection}.${opt}`,
                  }));

                  const tableDropdownOpts = tableOpts.map(({ schema, table }) => ({
                    value: table,
                    label: `${conn.connection}.${schema}.${table}`,
                  }));

                  const columnDropdownOpts = columnOpts.map(({ schema, table, column }) => ({
                    value: column,
                    label: `${conn.connection}.${schema}.${table}.${column}`,
                  }));

                  const selectedSchema = (conn.schema || []).map(s => ({
                    value: s,
                    label: `${conn.connection}.${s}`,
                  }));

                  const selectedTables = (conn.table || []).map(t => ({
                    value: t,
                    label: `${conn.connection}.${conn.schema[0] || ''}.${t}`,
                  }));

                  const selectedColumns = (conn.column || []).map(c => ({
                    value: c,
                    label: `${conn.connection}.${conn.schema[0] || ''}.${conn.table[0] || ''}.${c}`,
                  }));

                  let statusIcon = null;
                  const connKey = `${groupNames[activeGroupIndex]}__${activeRuleIndex}__${idx}`;
                  const currentConnValidation = validationStatus[connKey];

                  const ruleStatus = currentConnValidation?.ruleQueryStatus;
                  const scoreStatus = currentConnValidation?.scoreQueryStatus;

                  if (data?.category.toLowerCase() === 'pre-built') {
                    if (ruleStatus === 'success') {
                      statusIcon = <span className="text-green-600 text-xs font-semibold mr-2">Valid Query</span>;
                    } else if (ruleStatus === 'error') {
                      statusIcon = <span className="text-red-600 text-xs font-semibold mr-2">Invalid Query</span>;
                    } else if (ruleStatus === 'pending') {
                      statusIcon = <span className="text-yellow-600 text-xs font-semibold mr-2">Validating Rule...</span>;
                    } else if (ruleStatus === 'validate_again') {
                      statusIcon = <span className="text-orange-600 text-xs font-semibold mr-2">Validate Rule</span>;
                    }
                  } else { 
                    if (ruleStatus === 'success' && scoreStatus === 'success') {
                      statusIcon = <span className="text-green-600 text-xs font-semibold mr-2">Valid Queries</span>;
                    } else if (ruleStatus === 'error' || scoreStatus === 'error') {
                      statusIcon = <span className="text-red-600 text-xs font-semibold mr-2">Invalid Queries</span>;
                    } else if (ruleStatus === 'pending' || scoreStatus === 'pending') {
                      statusIcon = <span className="text-yellow-600 text-xs font-semibold mr-2">Validating...</span>;
                    } else if (ruleStatus === 'validate_again' || scoreStatus === 'validate_again' || !ruleStatus || !scoreStatus) {
                      statusIcon = <span className="text-orange-600 text-xs font-semibold mr-2">Validate Queries</span>;
                    }
                  }

                  return (
                    <div
                      key={conn.id}
                      className={`border border-[#8d77ba] rounded-lg p-4 ${!conn.checked ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={conn.checked}
                            onChange={() => handleCheck(conn.id)}
                            className="form-checkbox text-[#8d77ba] h-5 w-5 mr-2"
                          />
                          <span className="font-medium">Connection {idx + 1}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {/* Rule Query Status */}
                          {currentConnValidation?.ruleQueryStatus === 'success' && (
                            <span className="text-green-600 text-xs font-semibold">Rule Query: Valid</span>
                          )}
                          {currentConnValidation?.ruleQueryStatus === 'error' && (
                            <span className="text-red-600 text-xs font-semibold">Rule Query: Invalid</span>
                          )}
                          {currentConnValidation?.ruleQueryStatus === 'pending' && (
                            <span className="text-yellow-600 text-xs font-semibold">Rule Query: Validating...</span>
                          )}
                          {(currentConnValidation?.ruleQueryStatus === 'validate_again' || !currentConnValidation?.ruleQueryStatus) && (
                            <span className="text-orange-600 text-xs font-semibold">Rule Query: Validate</span>
                          )}

                          {/* Score Query Status (Only for custom categories) */}
                          {data?.category.toLowerCase() === 'custom' && (
                            <>
                              {currentConnValidation?.scoreQueryStatus === 'success' && (
                                <span className="text-green-600 text-xs font-semibold">Score Query: Valid</span>
                              )}
                              {currentConnValidation?.scoreQueryStatus === 'error' && (
                                <span className="text-red-600 text-xs font-semibold">Score Query: Invalid</span>
                              )}
                              {currentConnValidation?.scoreQueryStatus === 'pending' && (
                                <span className="text-yellow-600 text-xs font-semibold">Score Query: Validating...</span>
                              )}
                              {(currentConnValidation?.scoreQueryStatus === 'validate_again' || !currentConnValidation?.scoreQueryStatus) && (
                                <span className="text-orange-600 text-xs font-semibold">Score Query: Validate</span>
                              )}
                            </>
                          )}
                          <button
                            className="p-2 border rounded hover:bg-gray-100 relative group"
                            type="button"
                            title="Run SQL (required)"
                            onClick={() => handleRunSQL(groupNames[activeGroupIndex], activeRuleIndex, idx, activeTab === 'score')}
                            disabled={!conn.checked}
                          >
                            <div className="relative">
                              <PlayCircle size={18} />
                              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">
                                *
                              </span>
                            </div>
                          </button>
                          <button
                            className="p-2 border rounded hover:bg-gray-100"
                            type="button"
                            title="Add Connection"
                            onClick={() => handleDuplicateConnection(conn)}
                            disabled={!conn.checked}
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            className="p-2 border rounded hover:bg-gray-100"
                            type="button"
                            title="Refresh"
                            onClick={() => handleRefresh(conn)}
                            disabled={!conn.checked}
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            className="p-2 border rounded hover:bg-gray-100"
                            type="button"
                            onClick={() => handleDelete(conn.id)}
                            disabled={connections.length === 1 || !conn.checked}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="w-full space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={conn.connection ? { value: conn.connection, label: conn.connection } : null}
                            options={connectionOptions}
                            onChange={(selected) => handleConnectionChange(conn.id, selected)}
                            placeholder="Select Connection"
                            isDisabled={!conn.checked}
                            isLoading={isLoadingConnections}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            components={customComponents}
                            onMenuOpen={() => {
                              if (policyIds.length > 0 && connectionOptions.length === 0) {
                                fetchConnections();
                              }
                            }}
                          />
                          <Select
                            isMulti
                            value={selectedSchema}
                            options={schemaDropdownOpts}
                            onChange={(selected) => handleSchemaChange(conn.id, selected)}
                            placeholder="Select Schema"
                            isDisabled={!conn.connection || !conn.checked}
                            isLoading={isLoadingSchemas[conn.connection] || false}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
                            onMenuOpen={() => {
                              if (conn.connection && !schemasByConnection[conn.connection]) {
                                fetchSchemas(conn.connection);
                              }
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            isMulti
                            value={selectedTables}
                            options={tableDropdownOpts}
                            onChange={(selected) => handleTableChange(conn.id, selected)}
                            placeholder="Select Table"
                            isDisabled={!(conn.schema && conn.schema.length) || !conn.checked}
                            isLoading={conn.schema?.some(schema => isLoadingTables[`${conn.connection}__${schema}`]) || false}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
                            onMenuOpen={() => {
                              if (conn.connection && conn.schema) {
                                conn.schema.forEach(schema => {
                                  if (!tablesBySchema[`${conn.connection}__${schema}`]) {
                                    fetchTables(conn.connection, schema);
                                  }
                                });
                              }
                            }}
                          />
                          <Select
                            isMulti
                            value={selectedColumns}
                            options={columnDropdownOpts}
                            onChange={(selected) => handleColumnChange(conn.id, selected)}
                            placeholder="Select Column"
                            isDisabled={!(conn.table && conn.table.length) || !conn.checked}
                            isLoading={conn.schema?.some(schema =>
                              conn.table?.some(table => {
                                const tableNameOnly = table.split('.').pop();
                                return isLoadingColumns[`${schema}__${tableNameOnly}`];
                              }) || false
                            )}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
                            onMenuOpen={() => {
                              if (conn.connection && conn.schema && conn.table) {
                                conn.schema.forEach(schema => {
                                  conn.table.forEach(table => {
                                    const tableNameOnly = table.split('.').pop();
                                    const key = `${schema}__${tableNameOnly}`;
                                    if (!columnsByTable[key]) {
                                      fetchColumns(conn.connection, schema, table);
                                    }
                                  });
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {connections.length > 0 && connections.every((_, idx) =>
                  !shouldShowConnection(groupNames[activeGroupIndex], activeRuleIndex, idx)
                ) && (
                    <div className="text-center p-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
                      {querySearchText ? (
                        <div>
                          <p className="font-medium mb-1">No queries found containing "{querySearchText}"</p>
                          <p className="text-sm">Try a different search term or clear the search</p>
                        </div>
                      ) : (
                        <p>No connections match your filter criteria.</p>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center w-full">
              {data?.category.toLowerCase() === 'pre-built' && (
                <div className="flex mb-4">
                  <h3 className="font-medium">Rule Query</h3>
                </div>
              )}
              {searchResults.length > 0 && currentSearchIndex >= 0 && searchResults[currentSearchIndex] && (
                <span className="ml-3 text-xs text-gray-500 italic">
                  Showing results from: {searchResults[currentSearchIndex].ruleName} ({searchResults[currentSearchIndex].groupName})
                </span>
              )}
            </div>
          </div>

          {data?.category.toLowerCase() === 'custom' && (
            <div className="mb-4 flex justify-between w-full pr-4">
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 font-medium ${activeTab === 'rule' ? 'border-b-2 border-[#8d77ba] text-[#8d77ba]' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('rule')}
                >
                  Rule Query
                </button>
                <button
                  className={`px-4 py-2 font-medium ${activeTab === 'score' ? 'border-b-2 border-[#8d77ba] text-[#8d77ba]' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('score')}
                >
                  Score Query
                </button>
              </div>
              <div
                className="p-1 rounded-full text-gray-600 cursor-pointer justify-center text-center mt-4"
                title="Custom Rule Information"
                onClick={() => setShowInfoModal(true)}
              >
                <Info size={20} />
              </div>
            </div>
          )}

          <div className="border rounded-lg mb-4">
            {data?.category.toLowerCase() === 'custom' ? (
              <>
                <div style={{ display: activeTab === 'rule' ? 'block' : 'none' }}>
                  <AceEditor
                    ref={ruleEditorRef}
                    mode="sql"
                    theme="tomorrow"
                    name="rule-query-editor"
                    value={getCurrentQuery(false)}
                    onChange={(value) => handleQueryChange(value, false)}
                    fontSize={14}
                    width="100%"
                    height="300px"
                    showPrintMargin={false}
                    showGutter={true}
                    highlightActiveLine={true}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: true,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                    readOnly={isPrebuiltEdit || isCustomCreate}
                    wrapEnabled={true}
                    onLoad={(editor) => {
                      if (activeTab === 'rule') {
                        editor.execCommand("find");
                        editor.findAll(querySearchText, {
                          caseSensitive: false,
                          wholeWord: false,
                          regExp: false,
                          preventScroll: false
                        });
                        editor.execCommand("find");
                        setSearchLoaded(true);
                      }
                    }}
                  />
                </div>
                <div style={{ display: activeTab === 'score' ? 'block' : 'none' }}>
                  <AceEditor
                    ref={scoreEditorRef}
                    mode="sql"
                    theme="tomorrow"
                    name="score-query-editor"
                    value={getCurrentQuery(true)}
                    onChange={(value) => handleQueryChange(value, true)}
                    fontSize={14}
                    width="100%"
                    height="300px"
                    showPrintMargin={false}
                    showGutter={true}
                    highlightActiveLine={true}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: true,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                    readOnly={isPrebuiltEdit || isCustomCreate}
                    wrapEnabled={true}
                    onLoad={(editor) => {
                      if (activeTab === 'score') {
                        editor.execCommand("find");
                        editor.findAll(querySearchText, {
                          caseSensitive: false,
                          wholeWord: false,
                          regExp: false,
                          preventScroll: false
                        });
                        editor.execCommand("find");
                        setSearchLoaded(true);
                      }
                    }}
                  />
                </div>
              </>
            ) : (
              <AceEditor
                ref={ruleEditorRef}
                mode="sql"
                theme="tomorrow"
                name="query-editor"
                value={getCurrentQuery(false)}
                onChange={(value) => handleQueryChange(value, false)}
                fontSize={14}
                width="100%"
                height="300px"
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
                readOnly={isPrebuiltEdit || isCustomCreate}
                wrapEnabled={true}
                onLoad={(editor) => {
                  editor.execCommand("find");
                  editor.findAll(querySearchText, {
                    caseSensitive: false,
                    wholeWord: false,
                    regExp: false,
                    preventScroll: false
                  });
                  editor.execCommand("find");
                  setSearchLoaded(true);
                }}
              />
            )}

            <div className="flex justify-between items-center p-3 bg-gray-50 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevQuery}
                  disabled={getCurrentSelectedFlatIndex().idx <= 0}
                  className={`p-2 rounded hover:bg-gray-200 ${getCurrentSelectedFlatIndex().idx <= 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                    }`}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="mx-2 text-sm text-gray-600">
                  {getCurrentSelectedFlatIndex().idx + 1} of {getCurrentSelectedFlatIndex().total}
                </span>
                <button
                  onClick={goToNextQuery}
                  disabled={getCurrentSelectedFlatIndex().idx >= getCurrentSelectedFlatIndex().total - 1}
                  className={`p-2 rounded hover:bg-gray-200 ${getCurrentSelectedFlatIndex().idx >= getCurrentSelectedFlatIndex().total - 1
                    ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                    }`}
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              {querySearchText && searchResults.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Search results:</span>
                  <button
                    onClick={goToPrevSearchResult}
                    className="p-1 rounded border hover:bg-gray-100"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <span className="text-sm">
                    {currentSearchIndex + 1} of {searchResults.length}
                  </span>
                  <button
                    onClick={goToNextSearchResult}
                    className="p-1 rounded border hover:bg-gray-100"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 p-4 border-t gap-3">
        <button
          onClick={handleBackClick}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={false}
        >
          Back
        </button>
        <button
          onClick={handleNextClick}
          className={`px-6 py-2 rounded-lg transition-colors ${allValidated
            ? 'bg-[#8d77ba] text-white hover:bg-[#7a67a0]'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          disabled={!allValidated}
        >
          Next
        </button>
      </div>
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}

export default Step2;
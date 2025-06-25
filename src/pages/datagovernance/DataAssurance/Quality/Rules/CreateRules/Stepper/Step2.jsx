import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Trash2, PlayCircle, RefreshCw, X } from 'lucide-react';
import AceEditor from 'react-ace';
import Select, { components } from 'react-select';
import { useStepData } from './StepContext';
import { useNavigate } from 'react-router-dom';

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/ext-language_tools';
import { useAuth } from '../../../../../../../context/AuthContext';

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
            onChange={() => {}}
            className="mr-2 form-checkbox text-[#8d77ba] h-4 w-4"
          />
        )}
        <span>{label}</span>
      </div>
    </components.Option>
  );
};

//lable with tooltip
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

function Step2({ data, onBack, onNext, step2Data, edit }) {
  const { stepData, setStepData } = useStepData();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [querySearchText, setQuerySearchText] = useState('');
  const [validationFilter, setValidationFilter] = useState('all');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const editorRef = useRef(null);

  const [validationStatus, setValidationStatusState] = useState(() => stepData.validationStatus || {});

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
      return { ...prev, ...next };
    });
  }, []);

  const initialStep2Data = stepData.step2 || step2Data;

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
    const initialSelected = {};
    const initialConnections = {};

    if (initialStep2Data && Array.isArray(initialStep2Data)) {
      initialStep2Data.forEach(ruleObj => {
        const groupName = ruleObj.group;
        if (!initialQueries[groupName]) initialQueries[groupName] = [];
        initialQueries[groupName].push({
          id: ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId,
          name: ruleObj.rule?.name || ruleObj.ruleName,
          query: ruleObj.rule?.query || ruleObj.query || '',
        });
        if (!initialSelected[groupName]) initialSelected[groupName] = new Set();
        initialSelected[groupName].add(ruleObj.rule?.id || ruleObj.id || ruleObj.ruleId);

        const ruleIdx = initialQueries[groupName].length - 1;

        const connectionsArr = ruleObj.connection_details || ruleObj.connections || [];
        initialConnections[`${groupName}__${ruleIdx}`] = (connectionsArr || []).map((conn, idx) => ({
          id: idx + 1,
          checked: true,
          connection: conn.connection || '',
          schema: Array.isArray(conn.schema) ? conn.schema.map(s => (typeof s === 'string' ? s.split('.').pop() : s)) : (conn.schema ? [conn.schema] : []),
          table: Array.isArray(conn.tables) ? conn.tables.map(t => (typeof t === 'string' ? t.split('.').pop() : t)) : (conn.tables ? [conn.tables] : []),
          column: Array.isArray(conn.columns) ? conn.columns.map(c => (typeof c === 'string' ? c.split('.').pop() : c)) : (conn.columns ? [conn.columns] : []),
        }));
      });
    } else {
      Object.entries(data.rules).forEach(([groupName, rules]) => {
        initialQueries[groupName] = rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          query: rule.query || `No Query defined for Rule:  "${rule.name}"`,
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
    return { initialQueries, initialSelected, initialConnections };
  }

  const initialStateRef = useRef(buildInitialState());
  const [queries, setQueries] = useState(initialStateRef.current.initialQueries);
  const [selectedRules, setSelectedRules] = useState(initialStateRef.current.initialSelected);
  const [connectionsByQuery, setConnectionsByQuery] = useState(initialStateRef.current.initialConnections);

  useEffect(() => {
    if (initialStep2Data && Array.isArray(initialStep2Data)) {
      const { initialQueries, initialSelected, initialConnections } = buildInitialState();
      setQueries(initialQueries);
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

  const handleQueryChange = (value) => {
    const currentGroup = groupNames[activeGroupIndex];
    const updatedQueries = { ...queries };
    if (updatedQueries[currentGroup] && updatedQueries[currentGroup][activeRuleIndex]) {
      updatedQueries[currentGroup][activeRuleIndex].query = value;
      setQueries(updatedQueries);

      const queryKey = `${currentGroup}__${activeRuleIndex}`;
      const conns = connectionsByQuery[queryKey] || [];
      setValidationStatus(prev => {
        const updated = { ...prev };
        conns.forEach((_, idx) => {
          const connKey = `${queryKey}__${idx}`;
          delete updated[connKey];
        });
        return updated;
      });
    }
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

  const getCurrentQuery = () => {
    const currentGroup = groupNames[activeGroupIndex];
    const rule = queries[currentGroup]?.[activeRuleIndex];
    if (!rule || !selectedRules[currentGroup]?.has(rule.id)) return '';
    return rule.query;
  };

  const [connectionOptions, setConnectionOptions] = useState([]);
  const [schemasByConnection, setSchemasByConnection] = useState({});
  const [tablesBySchema, setTablesBySchema] = useState({});
  const [columnsByTable, setColumnsByTable] = useState({});

  const fetchConnections = () => {
    fetch(`${import.meta.env.VITE_FAST_API}/rules/addrule/connections`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then(response => response.json())
      .then(data => {
        const connectionsArr = Array.isArray(data.connections) ? data.connections : [];
        const formattedOptions = connectionsArr.map(conn => ({
          value: conn,
          label: conn
        }));
        setConnectionOptions(formattedOptions);
      })
      .catch(error => {
        console.error('Error fetching connections:', error);
      });
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchSchemas = (connectionName) => {
    if (!connectionName || schemasByConnection[connectionName]) return;
    fetch(`${import.meta.env.VITE_FAST_API}/rules/addrule/schema/${encodeURIComponent(connectionName)}`,
  {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  })
      .then(response => response.json())
      .then(data => {
        const schemasArr = Array.isArray(data.schemas) ? data.schemas : [];
        setSchemasByConnection(prev => ({ ...prev, [connectionName]: schemasArr }));
      })
      .catch(error => {
        console.error('Error fetching schemas:', error);
      });
  };

  const fetchTables = (connectionName, schemaName) => {
    if (!connectionName || !schemaName || tablesBySchema[`${connectionName}__${schemaName}`]) return;
    fetch(`${import.meta.env.VITE_FAST_API}/rules/addrule/tables`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ connection_name: connectionName, table_schema: schemaName }),
      }
    )
      .then(response => response.json())
      .then(data => {
        const tablesArr = Array.isArray(data.tables) ? data.tables : [];
        setTablesBySchema(prev => ({ ...prev, [`${connectionName}__${schemaName}`]: tablesArr }));
      })
      .catch(error => {
        console.error('Error fetching tables:', error);
      });
  };

  const fetchColumns = (connectionName, schemaName, tableName) => {
    if (!connectionName || !schemaName || !tableName) return;
    const tableNameOnly = tableName.split('.').pop();
    const key = `${schemaName}__${tableNameOnly}`;
    if (columnsByTable[key]) return;

    fetch(`${import.meta.env.VITE_FAST_API}/rules/addrule/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ connection_name: connectionName, table_schema: schemaName, table_name: tableNameOnly }),
    })
      .then(response => response.json())
      .then(data => {
        const columnsArr = Array.isArray(data.columns) ? data.columns : [];
        setColumnsByTable(prev => ({ ...prev, [key]: columnsArr }));
      })
      .catch(error => {
        console.error('Error fetching columns:', error);
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
          if (
            prev[connKey] === 'success' ||
            prev[connKey] === 'error' ||
            prev[connKey] === 'pending' ||
            prev[connKey] === 'validate_again'
          ) {
            updated[connKey] = "validate_again";
          } else {
            delete updated[connKey];
          }
        }
      }
      if (isDuplicate) {
        newConnections.forEach((conn, idx) => {
          const connKey = `${queryKey}__${idx}`;
          if (!(connKey in prev)) {
            delete updated[connKey];
          }
        });
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
    if (value) fetchSchemas(value);
  };

  const handleSchemaChange = (id, selectedOptions) => {
    const conn = connections.find(c => c.id === id);
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, schema: values, table: [], column: [] }
          : conn
      ),
      id
    );
    if (conn && conn.connection) {
      values.forEach(schema => fetchTables(conn.connection, schema));
    }
  };

  const handleTableChange = (id, selectedOptions) => {
    const conn = connections.find(c => c.id === id);
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setConnectionsForCurrent(
      connections.map(conn =>
        conn.id === id
          ? { ...conn, table: values, column: [] }
          : conn
      ),
      id
    );
    if (conn && conn.connection && conn.schema) {
      (conn.schema || []).forEach(schema =>
        values.forEach(table => fetchColumns(conn.connection, schema, table))
      );
    }
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

  const handleDelete = (id) => {
    setConnectionsForCurrent(connections.filter(conn => conn.id !== id));
  };


  const handleDuplicateConnection = (conn) => {
    setConnectionsForCurrent([
      ...connections,
      {
        id: Date.now(),
        checked: true,
        connection: conn.connection,
        schema: conn.schema,
        table: conn.table,
        column: conn.column
      }
    ], null, true);
    if (conn.connection) fetchSchemas(conn.connection);
    if (conn.connection && conn.schema) fetchTables(conn.connection, conn.schema);
    if (conn.connection && conn.schema && conn.table) fetchColumns(conn.connection, conn.schema, conn.table);
  };

  const handleRefresh = (conn) => {
    setConnectionsForCurrent(
      connections.map(c =>
        c.id === conn.id
          ? { ...c, connection: '', schema: '', table: '', column: '' }
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

            const schemas = (conn.schema || []).map(s => {
              const schemaName = s.split('.').pop();
              return `${connection}.${schemaName}`;
            });

            const tables = (conn.table || []).map(t => {
              const tableName = t.split('.').pop();
              let schema = '';
              for (const s of conn.schema || []) {
                const schemaName = s.split('.').pop();
                const tableKey = `${connection}__${schemaName}`;
                if (tablesBySchema[tableKey] && tablesBySchema[tableKey].includes(tableName)) {
                  schema = schemaName;
                  break;
                }
              }
              return schema ? `${connection}.${schema}.${tableName}` : `${connection}.${tableName}`;
            });

            const columns = (conn.column || []).map(c => {
              const columnName = c.split('.').pop();
              let schema = '', table = '';
              for (const s of conn.schema || []) {
                const schemaName = s.split('.').pop();
                for (const t of conn.table || []) {
                  const tableNameOnly = t.split('.').pop();
                  const colKey = `${schemaName}__${tableNameOnly}`;
                  if (columnsByTable[colKey] && columnsByTable[colKey].includes(columnName)) {
                    schema = schemaName;
                    table = tableNameOnly;
                    break;
                  }
                }
                if (schema && table) break;
              }
              return (schema && table)
                ? `${connection}.${schema}.${table}.${columnName}`
                : `${connection}.${columnName}`;
            });

            return {
              connection,
              schema: schemas.length === 1 ? schemas[0] : schemas.length > 1 ? schemas : '',
              tables: tables.length === 1 ? tables[0] : tables.length > 1 ? tables : '',
              columns: columns.length === 1 ? columns[0] : columns.length > 1 ? columns : ''
            };
          });

      const originalRule =
        (data.rules[groupName] || []).find(r => r.id === ruleObj.id) || {};

      const ruleData = {
        ...(ruleObj.id ? { id: ruleObj.id } : {}),
        category,
        type,
        group: groupName,
        rule: {
          id: ruleObj.id,
          name: ruleObj.name,
          query: ruleObj.query,
          description: originalRule.description ?? originalRule.desc ?? "",
          severity: originalRule.severity ?? "High",
          status: originalRule.status ?? "Active",
          owner: originalRule.owner ?? "",
        }
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

  const handleRunSQL = async (groupName, ruleIdx, connIdx) => {
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
      const rule = queries[groupName][ruleIdx];
      if (!rule || !conn) continue;

      const replacedQuery = replacePlaceholders(
        rule.query,
        conn.connection,
        conn.schema,
        conn.table,
        conn.column
      );

      setValidationStatus(prev => ({ ...prev, [connKey]: 'pending' }));

      try {
        const res = await fetch(`${import.meta.env.VITE_FAST_API}/rules/executerule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: replacedQuery }),
        });
        if (res.ok) {
          setValidationStatus(prev => ({ ...prev, [connKey]: 'success' }));
        } else {
          setValidationStatus(prev => ({ ...prev, [connKey]: 'error' }));
        }
      } catch {
        setValidationStatus(prev => ({ ...prev, [connKey]: 'error' }));
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
          if (validationStatus[connKey] !== 'success') {
            all = false;
          }
        });
      });
    });
    return all;
  })();

  const getUniqueValidationStatuses = () => {
    const statuses = new Set(['all']);
    Object.values(validationStatus).forEach(status => {
      if (status) statuses.add(status);
    });
    return Array.from(statuses);
  };

  const shouldShowConnection = (groupName, ruleIdx, connIdx) => {
    const queryKey = `${groupName}__${ruleIdx}`;
    const connKey = `${queryKey}__${connIdx}`;
    const rule = queries[groupName]?.[ruleIdx];

    if (validationFilter !== 'all') {
      if (validationStatus[connKey] !== validationFilter) {
        return false;
      }
    }

    if (querySearchText && rule) {
      return rule.query.toLowerCase().includes(querySearchText.toLowerCase());
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
        let lastIndex = 0;
        let count = 0;
        while (lastIndex !== -1) {
          lastIndex = query.toLowerCase().indexOf(querySearchText.toLowerCase(), lastIndex);
          if (lastIndex !== -1) {
            count++;
            lastIndex += querySearchText.length;
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
  }, [querySearchText, groupNames, queries, selectedRules]);

  useEffect(() => {
    if (querySearchText.trim()) {
      searchAcrossQueries();
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(-1);

      if (editorRef.current?.editor) {
        editorRef.current.editor.getSession().getSelection().clearSelection();
      }
    }
  }, [querySearchText, searchAcrossQueries]);

  useEffect(() => {
    if (searchResults.length > 0 && currentSearchIndex >= 0 && currentSearchIndex < searchResults.length) {
      const searchResult = searchResults[currentSearchIndex];

      setActiveGroupIndex(searchResult.groupIndex);
      setActiveRuleIndex(searchResult.ruleIndex);

      setSearchLoaded(false);
      setTimeout(() => {
        if (editorRef.current?.editor) {
          const editor = editorRef.current.editor;

          editor.findAll(querySearchText, {
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            preventScroll: true
          });

          setSearchLoaded(true);
        }
      }, 100);
    }
  }, [currentSearchIndex, searchResults, querySearchText]);

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

  const isPrebuiltEdit = edit && data?.category === 'Pre-built';

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
                      className={`p-3 flex justify-between items-center cursor-pointer ${
                        isExpanded ? 'bg-[#8d77ba] bg-opacity-10 border-b' :
                        isActive ? 'bg-[#8d77ba] bg-opacity-5' : ''
                      }`}
                      onClick={() => toggleGroup(groupName)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center bg-[#8d77ba] text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroup(index);
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
                                className={`border-b last:border-b-0 cursor-pointer ${
                                  isActive && rIndex === activeRuleIndex ? 'bg-[#8d77ba] bg-opacity-10' : ''
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
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    rule.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {rule.status}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    rule.severity === 'High' ? 'bg-red-100 text-red-700' :
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
                    placeholder="Search in SQL queries..."
                    value={querySearchText}
                    onChange={(e) => setQuerySearchText(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#8d77ba] text-sm"
                    title="Search for text within SQL queries"
                  />
                  {querySearchText && (
                    <>
                      <div className="absolute right-2 flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {searchResults.length > 0 && searchLoaded ? (
                            `${searchResults[currentSearchIndex] ?
                              `${searchResults[currentSearchIndex].matches}-${searchResults[currentSearchIndex].matchesTo}` : ""} of ${
                              searchResults.reduce((total, result) => total + result.count, 0)
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
                  // Apply filters to connections
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
                    label: conn.connection ? `${conn.connection}.${opt}` : opt
                  }));

                  const tableDropdownOpts = tableOpts.map(({ schema, table }) => ({
                    value: table,
                    label: conn.connection ? `${conn.connection}.${schema}.${table}` : table
                  }));

                  const columnDropdownOpts = columnOpts.map(({ schema, table, column }) => ({
                    value: column,
                    label: conn.connection ? `${conn.connection}.${schema}.${table}.${column}` : column
                  }));


                  const selectedSchema = (conn.schema || []).map(s => ({
                    value: s,
                    label: conn.connection ? `${conn.connection}.${s}` : s
                  }));

                  const selectedTables = (conn.table || []).map(t => {
                    const schema = conn.schema && conn.schema.length > 0 ? conn.schema[0] : '';
                    return {
                      value: t,
                      label: conn.connection && schema ? `${conn.connection}.${schema}.${t}` : t
                    };
                  });

                  const selectedColumns = (conn.column || []).map(c => {
                    const schema = conn.schema && conn.schema.length > 0 ? conn.schema[0] : '';
                    const table = conn.table && conn.table.length > 0 ? conn.table[0] : '';
                    return {
                      value: c,
                      label: conn.connection && schema && table ? `${conn.connection}.${schema}.${table}.${c}` : c
                    };
                  });

                  const connKey = `${groupNames[activeGroupIndex]}__${activeRuleIndex}__${idx}`;
                  let statusIcon = null;
                  if (validationStatus[connKey] === 'success') {
                    statusIcon = <span className="text-green-600 text-xs font-semibold mr-2">Valid Query</span>;
                  } else if (validationStatus[connKey] === 'error') {
                    statusIcon = <span className="text-red-600 text-xs font-semibold mr-2">Invalid Query</span>;
                  } else if (validationStatus[connKey] === 'pending') {
                    statusIcon = <span className="text-yellow-600 text-xs font-semibold mr-2">Validating...</span>;
                  } else if (validationStatus[connKey] === 'validate_again') {
                    statusIcon = <span className="text-orange-600 text-xs font-semibold mr-2">Validate Again</span>;
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

                          {statusIcon}

                          <button
                            className="p-2 border rounded hover:bg-gray-100"
                            type="button"
                            title="Run SQL"
                            onClick={() => handleRunSQL(groupNames[activeGroupIndex], activeRuleIndex, idx)}
                            disabled={!conn.checked}
                          >
                            <PlayCircle size={18} />
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
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            components={customComponents}
                          />

                          <Select
                            isMulti
                            value={selectedSchema}
                            options={schemaDropdownOpts}
                            onChange={(selected) => handleSchemaChange(conn.id, selected)}
                            placeholder="Select Schema"
                            isDisabled={!conn.connection || !conn.checked}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
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
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
                          />

                          <Select
                            isMulti
                            value={selectedColumns}
                            options={columnDropdownOpts}
                            onChange={(selected) => handleColumnChange(conn.id, selected)}
                            placeholder="Select Column"
                            isDisabled={!(conn.table && conn.table.length) || !conn.checked}
                            styles={selectStyles}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            components={customComponents}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show message when no connections match the filter */}
                {connections.length > 0 && connections.every((_, idx) =>
                  !shouldShowConnection(groupNames[activeGroupIndex], activeRuleIndex, idx)
                ) && (
                  <div className="text-center p-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
                    {querySearchText ? (
                      <div>
                        <p className="font-medium mb-1">No SQL queries found containing "{querySearchText}"</p>
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

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="text-md font-medium">Query Editor</h3>
              {searchResults.length > 0 && currentSearchIndex >= 0 && searchResults[currentSearchIndex] && (
                <span className="ml-3 text-xs text-gray-500 italic">
                  Showing results from: {searchResults[currentSearchIndex].ruleName} ({searchResults[currentSearchIndex].groupName})
                </span>
              )}
            </div>
          </div>

          <div className="border rounded-lg mb-4">
            <AceEditor
              ref={editorRef}
              mode="sql"
              theme="tomorrow"
              name="query-editor"
              value={getCurrentQuery()}
              onChange={handleQueryChange}
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
              readOnly={isPrebuiltEdit}
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

            <div className="flex justify-between items-center p-3 bg-gray-50 border-t">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevQuery}
                  disabled={getCurrentSelectedFlatIndex().idx <= 0}
                  className={`p-2 rounded hover:bg-gray-200 ${
                    getCurrentSelectedFlatIndex().idx <= 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
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
                  className={`p-2 rounded hover:bg-gray-200 ${
                    getCurrentSelectedFlatIndex().idx >= getCurrentSelectedFlatIndex().total - 1
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
          onClick={() => {
            if (edit) {
              navigate('/datagovernance/data-assurance/rules');
            } else {
              onBack();
            }
          }}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={false}
        >
          Back
        </button>
        <button
          onClick={handleNextClick}
          className={`px-6 py-2 rounded-lg transition-colors ${
            allValidated
              ? 'bg-[#8d77ba] text-white hover:bg-[#7a67a0]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!allValidated}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Step2;
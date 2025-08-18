import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

const DATATYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "double", label: "Double" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "timestamp", label: "Timestamp" }
];

export const validatePySparkExpression = (code) => {
  const errors = [];

  if (!code || code.trim().length === 0) {
    return { isValid: true, errors: [] };
  }

  const dangerousPatterns = [
    // Import statements
    /\bimport\s+/gi,
    /\bfrom\s+\w+\s+import\s+/gi,
    /\b__import__\s*\(/gi,

    // System and OS operations
    /\bos\./gi,
    /\bsys\./gi,
    /\bsubprocess\./gi,
    /\bshutil\./gi,
    /\bsocket\./gi,
    /\bplatform\./gi,
    /\bgetpass\./gi,
    /\bwebbrowser\./gi,
    /\burllib\./gi,
    /\brequests\./gi,
    /\bhttp\./gi,

    // File operations
    /\bopen\s*\(/gi,
    /\bfile\s*\(/gi,
    /\bwith\s+open\s*\(/gi,
    /\.read\s*\(/gi,
    /\.write\s*\(/gi,
    /\.close\s*\(/gi,

    // Execution functions
    /\bexec\s*\(/gi,
    /\beval\s*\(/gi,
    /\bcompile\s*\(/gi,
    /\bexecfile\s*\(/gi,

    // Input/Output
    /\binput\s*\(/gi,
    /\braw_input\s*\(/gi,
    /\bprint\s*\(/gi,

    // Reflection and introspection
    /\bglobals\s*\(/gi,
    /\blocals\s*\(/gi,
    /\bvars\s*\(/gi,
    /\bdir\s*\(/gi,
    /\bgetattr\s*\(/gi,
    /\bsetattr\s*\(/gi,
    /\bdelattr\s*\(/gi,
    /\bhasattr\s*\(/gi,
    /\bisinstance\s*\(/gi,
    /\btype\s*\(/gi,
    /\bcallable\s*\(/gi,

    // Magic methods and attributes
    /\b__.*__\b/gi,

    // Module reloading
    /\breload\s*\(/gi,
    /\bimportlib\./gi,

    // Class and function definitions
    /\bclass\s+\w+/gi,
    /\bdef\s+\w+/gi,
    /\blambda\s*:/gi,

    // Exception handling that could hide errors
    /\btry\s*:/gi,
    /\bexcept\s*:/gi,
    /\bfinally\s*:/gi,
    /\braise\s+/gi,

    // Control flow that could cause issues
    /\bfor\s+\w+\s+in\s+/gi,
    /\bwhile\s+/gi,
    /\bif\s+.*?:/gi,
    /\belse\s*:/gi,
    /\belif\s+.*?:/gi,

    // Memory and garbage collection
    /\bgc\./gi,
    /\bdel\s+/gi,

    // Threading and multiprocessing
    /\bthread/gi,
    /\bmultiprocessing/gi,
    /\basync\s+/gi,
    /\bawait\s+/gi,

    // Database connections
    /\bconnect\s*\(/gi,
    /\bexecute\s*\(/gi,
    /\bcommit\s*\(/gi,
    /\brollback\s*\(/gi,

    // Network operations
    /\bsend\s*\(/gi,
    /\breceive\s*\(/gi,
    /\bbind\s*\(/gi,
    /\blisten\s*\(/gi,

    // Dangerous builtins
    /\b__builtins__/gi,
    /\bgetattr\s*\(/gi,
    /\bsetattr\s*\(/gi,

    // System exit
    /\bexit\s*\(/gi,
    /\bquit\s*\(/gi,
    /\bsys\.exit/gi,

    // Assignment operations , prevent variable assignments
    /\w+\s*=/g,

    // Semicolons for multiple statements
    /;/g,

    // Quotes that could break out of context
    /'''/g,
    /"""/g,
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      errors.push(`Potentially unsafe code detected: ${pattern.source.replace(/\\/g, '')}`);
    }
  });

  const allowedFunctions = [
    'col', 'lit', 'when', 'otherwise', 'cast', 'isNull', 'isNotNull',
    'length', 'size', 'upper', 'lower', 'trim', 'ltrim', 'rtrim',
    'substring', 'substr', 'concat', 'concat_ws', 'split', 'regexp_replace',
    'regexp_extract', 'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow',
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log', 'log10',
    'max', 'min', 'sum', 'avg', 'count', 'first', 'last',
    'date_format', 'to_date', 'to_timestamp', 'year', 'month', 'dayofmonth',
    'hour', 'minute', 'second', 'date_add', 'date_sub', 'datediff',
    'coalesce', 'isnull', 'nanvl', 'array', 'struct', 'map',
    'sort_array', 'array_contains', 'explode', 'posexplode',
    'from_json', 'to_json', 'get_json_object', 'json_tuple',
    'hash', 'crc32', 'md5', 'sha1', 'sha2', 'base64', 'unbase64',
    'encode', 'decode', 'format_number', 'format_string'
  ];

  const functionPattern = /\b(\w+)\s*\(/g;
  let match;
  while ((match = functionPattern.exec(code)) !== null) {
    const functionName = match[1];
    if (!allowedFunctions.includes(functionName)) {
      errors.push(`Function '${functionName}' is not allowed. Only PySpark column functions are permitted.`);
    }
  }

  if (code.includes('\n') || code.includes('\r')) {
    errors.push('Multi-line expressions are not allowed');
  }

  let parenCount = 0;
  for (let char of code) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      errors.push('Unbalanced parentheses detected');
      break;
    }
  }
  if (parenCount !== 0) {
    errors.push('Unbalanced parentheses detected');
  }

  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
  }

  if (inString) {
    errors.push('Unbalanced quotes detected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getExpressionParams = (transformation) => {
  return {
    exp: transformation.params?.exp || "",
    datatype: transformation.params?.datatype || "string"
  };
};

const ExpressionOperationFields = ({
  transformation,
  sourceCols,
  updateTransformation,
  onAddNewTargetColumn,
  setTransformationValidity
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInput, setModalInput] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const modalInputRef = useRef(null);

  const columnOptions = Array.isArray(sourceCols)
    ? sourceCols.map(col => {
        const colName = typeof col === "string" ? col : col.name;
        const datatype = typeof col === "object" && col.datatype ? col.datatype : "";
        return {
          value: colName,
          label: datatype ? `${colName} (${datatype})` : colName
        };
      })
    : [];

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      border: '1px solid #e2e8f0',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      boxShadow: 'none'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#8E77BB'
        : state.isFocused
          ? '#f3f4f6'
          : 'white',
      color: state.isSelected ? 'white' : '#111827',
      fontSize: '0.875rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#111827'
    })
  };

  const handleDatatypeChange = (selectedOption) => {
    const datatype = selectedOption ? selectedOption.value : "string";
    updateTransformation(transformation.id, "params", {
      ...transformation.params,
      datatype
    });
  };

  const handleExpressionChange = (code) => {
    const validation = validatePySparkExpression(code);
    setValidationErrors(validation.errors);

    // Update transformation validity
    if (setTransformationValidity) {
      setTransformationValidity(transformation.id, validation.isValid);
    }

    updateTransformation(transformation.id, "params", {
      ...transformation.params,
      exp: code
    });
  };

  const handleTargetChange = (selected) => {
    if (!selected) {
      updateTransformation(transformation.id, "target_column", []);
      return;
    }
    updateTransformation(transformation.id, "target_column", [selected.value]);
  };

  const CustomMenuList = (props) => {
    const isCurrentTargetNew =
      transformation.target_column &&
      transformation.target_column[0] &&
      !columnOptions.some(opt => opt.value === transformation.target_column[0]);

    return (
      <components.MenuList {...props}>
        {!isCurrentTargetNew && (
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer'
            }}
            onMouseDown={e => {
              e.preventDefault();
              setShowAddModal(true);
              setModalInput("");
            }}
          >
            <span style={{ color: '#8E77BB', fontWeight: 500 }}>Add New +</span>
          </div>
        )}
        {props.children}
      </components.MenuList>
    );
  };

  const handleModalOk = () => {
    const name = modalInput.trim();
    if (name) {
      setShowAddModal(false);
      updateTransformation(transformation.id, "target_column", [name]);
      if (onAddNewTargetColumn && typeof onAddNewTargetColumn === "function") {
        const datatype = transformation.params?.datatype || "string";
        onAddNewTargetColumn(name, transformation.source_dataframe, "expression", datatype);
      }
    }
  };

  const handleModalInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleModalOk();
    }
  };

  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      modalInputRef.current.focus();
    }
  }, [showAddModal]);

  const selectedDatatypeOption = DATATYPE_OPTIONS.find(
    opt => opt.value === (transformation.params?.datatype || "string")
  );

  const selectedTargetOption =
    transformation.target_column && transformation.target_column[0]
      ? { value: transformation.target_column[0], label: transformation.target_column[0] }
      : null;

  const AddColumnModal = showAddModal && (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.2)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={() => setShowAddModal(false)}
    >
      <div
        style={{
          background: "white",
          padding: 24,
          borderRadius: 8,
          minWidth: 320,
          boxShadow: "0 2px 16px rgba(0,0,0,0.15)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 text-base font-medium text-gray-700">Add New Target Column</div>
        <input
          ref={modalInputRef}
          type="text"
          className="w-full p-2 mb-4 border border-gray-300 rounded text-gray-800"
          placeholder="Enter new column name"
          value={modalInput}
          onChange={e => setModalInput(e.target.value)}
          onKeyDown={handleModalInputKeyDown}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-[#8E77BB] text-white"
            onClick={handleModalOk}
            disabled={!modalInput.trim()}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-xs text-gray-700 mb-1">Data type</label>
          <Select
            options={DATATYPE_OPTIONS}
            value={selectedDatatypeOption}
            onChange={handleDatatypeChange}
            placeholder="Select data type"
            className="text-sm"
            styles={customStyles}
            menuPlacement="auto"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-700 mb-1">Target column</label>
          <Select
            options={columnOptions}
            value={selectedTargetOption}
            onChange={handleTargetChange}
            placeholder="Select target column"
            className="text-sm"
            styles={customStyles}
            isClearable
            components={{ MenuList: CustomMenuList }}
            menuPlacement="auto"
          />
        </div>
      </div>

      <div className="flex-1">
        <label className="block text-xs text-gray-700 mb-1">
          Value

        </label>

        <div className="border border-gray-300 rounded">
          <AceEditor
            mode="python"
            theme="github"
            value={transformation.params?.exp || ""}
            onChange={handleExpressionChange}
            width="100%"
            height="150px"
            fontSize="14px"
            showPrintMargin={false}
            showGutter={false}
            highlightActiveLine={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: false,
              tabSize: 2,
              useWorker: false
            }}
            placeholder="Enter PySpark expression"
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="font-medium text-red-800 mb-1">
              {validationErrors.some(error => error.includes('unsafe')) ? 'Security Warning:' : 'Validation Error:'}
            </div>
            {validationErrors.map((error, index) => (
              <div key={index} className="text-red-700">• {error}</div>
            ))}
          </div>
        )}


      </div>

      {AddColumnModal}
    </div>
  );
};

export default ExpressionOperationFields;

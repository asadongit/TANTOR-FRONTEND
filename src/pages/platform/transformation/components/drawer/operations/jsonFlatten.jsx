import React from "react";

const normalizeType = (t) => (typeof t === "string" ? t.trim() : "");
const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

const getColName = (c) => (typeof c === "object" && c ? c.name : c);
const getColType = (c) => (typeof c === "object" && c ? c.datatype : "");

const buildSchemaFromSourceCols = (sourceCols, jsonColName, columnFormat) => {
  const schema = {};
  (Array.isArray(sourceCols) ? sourceCols : []).forEach((c) => {
    const name = (getColName(c) || "").trim();
    if (!name) return;
    if (jsonColName && name === jsonColName) return;

    const dtRaw = getColType(c);
    const dt = normalizeType(dtRaw) || "STRING";
    let format = null;
    if (Array.isArray(columnFormat) && columnFormat.length > 0 && columnFormat[0][name]) {
      format = columnFormat[0][name];
    }
    schema[name] = format ? `${dt}(${format})` : dt;
  });
  return schema;
};

export const getJsonFlattenParams = (t) => {
  const params = t?.params || {};
  const jsonColumns = params.jsonColumns && typeof params.jsonColumns === "object" ? params.jsonColumns : {};
  return { jsonColumns };
};

const JsonFlattenOperationFields = ({ transformation, updateTransformation, setTransformationValidity, sourceCols, columnFormat }) => {

  const jsonColName = transformation?.source_column?.[0] || "";
  const selectableCols = Array.isArray(sourceCols) ? sourceCols : [];

  const writeParamsForJsonColumn = React.useCallback(
    (nextJsonColName) => {
      const key = (nextJsonColName || "").trim();
      const schema = key ? buildSchemaFromSourceCols(selectableCols, key, columnFormat) : {};

      const nextParams = key ? { jsonColumns: { [key]: { schema } } } : { jsonColumns: {} };
      updateTransformation(transformation.id, "params", nextParams);

      if (typeof setTransformationValidity === "function") {
        setTransformationValidity(transformation.id, Boolean(key) && Object.keys(schema).length > 0);
      }
    },
    [selectableCols, columnFormat, setTransformationValidity, transformation.id, updateTransformation]
  );

  React.useEffect(() => {
    if (!isNonEmpty(jsonColName)) {
      if (typeof setTransformationValidity === "function") {
        setTransformationValidity(transformation.id, false);
      }
      return;
    }
    writeParamsForJsonColumn(jsonColName);
  }, [jsonColName, selectableCols, setTransformationValidity, transformation.id, writeParamsForJsonColumn]);

  const handleJsonColumnChange = (value) => {
    updateTransformation(transformation.id, "source_column", value ? [value] : []);
    writeParamsForJsonColumn(value);
  };

  return (
    <>
      <div className="mb-3">
        <label className="block text-xs text-gray-700 mb-1">JSON Column</label>
        <input
          type="text"
          className="w-full p-2 text-black text-xs border border-gray-300 rounded bg-white"
          value={jsonColName}
          onChange={(e) => handleJsonColumnChange(e.target.value)}
          placeholder="Enter JSON column name"
        />
      </div>
    </>
  );
};

export default JsonFlattenOperationFields;

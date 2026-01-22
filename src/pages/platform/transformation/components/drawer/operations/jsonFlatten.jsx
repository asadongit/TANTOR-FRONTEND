import React from "react";

const normalizeType = (t) => (typeof t === "string" ? t.trim() : "");
const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

const getColName = (c) => (typeof c === "object" && c ? c.name : c);
const getColType = (c) => (typeof c === "object" && c ? c.datatype : "");

const buildSchemaFromSourceCols = (sourceCols, columnFormat) => {
  const schema = {};
  (Array.isArray(sourceCols) ? sourceCols : []).forEach((c) => {
    const name = (getColName(c) || "").trim();
    if (!name) return;
    if (name === "schema") return;

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
  const selectableCols = Array.isArray(sourceCols) ? sourceCols : [];

  const writeParamsForJsonFlatten = React.useCallback(
    () => {
      const schema = buildSchemaFromSourceCols(selectableCols, columnFormat);
      const nextParams = { jsonColumns: {"schema": schema} };

      // console.log(nextParams)
      updateTransformation(transformation.id, "params", nextParams);

      if (typeof setTransformationValidity === "function") {
        setTransformationValidity(transformation.id, Object.keys(schema).length > 0);
      }
    },
    [selectableCols, columnFormat, setTransformationValidity, transformation.id, updateTransformation]
  );

  React.useEffect(() => {
    writeParamsForJsonFlatten();
  }, [writeParamsForJsonFlatten]);

  return (
    <>
    </>
  );
};

export default JsonFlattenOperationFields;

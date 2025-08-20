export const DataTypeGroups = {
  numeric: [
    "int", "integer", "numeric", "int4", "int8", "number"
  ],
  string: [
    "varchar", "varchar2", "string", "character varying", "text", "char"
  ],
  date: [
    "date", "datetime", "timestamp", "time"
  ],
  boolean: [
    "bool", "boolean"
  ],
  float: [
    "float", "double", "double precision", "decimal"
  ]
};

export function isNumericType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  if (isFloatType(type)) return true;
  return DataTypeGroups.numeric.some(dt => t.includes(dt));
}

export function isStringType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return DataTypeGroups.string.some(dt => t.includes(dt));
}

export function isFloatType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  if (/decimal\s*\([\d\s,]+\)/.test(t)) return true;
  if (/float\s*\([\d\s,]+\)/.test(t)) return true;
  if (/double\s*\([\d\s,]+\)/.test(t)) return true;
  return DataTypeGroups.float.some(dt => t.includes(dt));
}


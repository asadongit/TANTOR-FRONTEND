export const DataTypeGroups = {
  numeric: [
    "int", "integer", "numeric", "int4", "int8","number"
  ],
  string: [
    "varchar", "varchar2", "string"
  ],
  date: [
    "date", "datetime", "timestamp", "time"
  ],
  boolean: [
    "bool", "boolean"
  ]
};

export function isNumericType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return DataTypeGroups.numeric.some(dt => t.includes(dt));
}

export function isStringType(type) {
  if (!type) return false;
  const t = type.toLowerCase();
  return DataTypeGroups.string.some(dt => t.includes(dt));
}


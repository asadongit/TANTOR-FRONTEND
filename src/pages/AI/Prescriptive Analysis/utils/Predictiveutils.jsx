export const toColumnLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

export const normalizeDesiredClassValue = (value) => {
  const normalizedText = String(value ?? '').trim().replace(/^["'](.*)["']$/, '$1');

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

export const sanitizeNumericInput = (input) => {
  const raw = String(input ?? '');
  const s = raw.trim();
  if (s === '') return '';

  if (s === '-') return '-';
  if (s === '.') return '0.';
  if (s === '-.') return '-0.';

  const hasTrailingDot = /\.$/.test(s);
  let cleaned = s.replace(/[^0-9.\-]/g, '');

  let leadingMinus = false;
  if (cleaned.startsWith('-')) {
    leadingMinus = true;
    cleaned = cleaned.slice(1);
  }
  cleaned = cleaned.replace(/-/g, '');

  const parts = cleaned.split('.');
  const intPart = parts.shift() || '';
  const fracPart = parts.join('');

  let result = intPart;
  if (fracPart !== '') {
    result = (intPart === '' ? '0' : intPart) + '.' + fracPart;
  } else if (hasTrailingDot) {
    result = (intPart === '' ? '0' : intPart) + '.';
  }

  if (result === '' && fracPart === '') {
    return hasTrailingDot ? '0.' : '';
  }

  if (leadingMinus) result = '-' + result;
  return result;
};

export const extractDesiredClassRawValue = (value) => {
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

export const extractDesiredClassOptionsFromRows = (rows) => {
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

export const hasDesiredClassSelection = (value, isRegression = false) => {
  if (isRegression) {
    return String(value ?? '').trim() !== '';
  }

  return normalizeDesiredClassValue(value) !== '';
};

export const getDesiredValueRange = (desiredClassOptions, modelingType) => {
  if (modelingType !== 'regression' || desiredClassOptions.length < 2) {
    return null;
  }

  const numericValues = desiredClassOptions
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  if (numericValues.length < 2) {
    return null;
  }

  return {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
  };
};

export const isDesiredValueInRange = (value, desiredValueRange) => {
  if (!desiredValueRange) {
    return true;
  }

  const numericValue = Number(String(value ?? '').trim());
  if (Number.isNaN(numericValue)) {
    return false;
  }

  return numericValue >= desiredValueRange.min && numericValue <= desiredValueRange.max;
};

export const getDesiredValueError = (value, desiredValueRange) => {
  if (!String(value ?? '').trim()) {
    return 'Please enter a value';
  }

  if (!desiredValueRange) {
    return 'Please enter a valid number';
  }

  return `Enter a value between ${desiredValueRange.min.toFixed(2)} and ${desiredValueRange.max.toFixed(2)}`;
};

export const formatToFourDecimals = (value) => {
  if (value === null || value === undefined || value === '-') return value;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(4);
};

export const toApiDateTime = (dateValue, endOfDay = false) => {
  if (!dateValue) return '';
  const timePart = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return `${dateValue} ${timePart}`;
};

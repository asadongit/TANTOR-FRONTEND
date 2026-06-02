export const OPERATORS = [
    { label: '=', value: 'EQ' },
    { label: '!=', value: 'NE' },
    { label: '>', value: 'GT' },
    { label: '>=', value: 'GE' },
    { label: '<', value: 'LT' },
    { label: '<=', value: 'LE' }
];

export const OPERATOR_MAP = {
    EQ: '=',
    NE: '!=',
    GT: '>',
    GE: '>=',
    LT: '<',
    LE: '<='
};

export const getOperatorLabel = (value) => {
    return OPERATOR_MAP[value] || value;
};

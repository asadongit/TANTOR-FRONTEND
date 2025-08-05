/**
 * Generates a SQL query based on source node data, rule filter, and filter component data
 */
export const generateSQLQuery = ({
  tableName,
  selectedColumns,
  complexQuery
}) => {
  try {
    if (!tableName || !selectedColumns || selectedColumns.length === 0) {
      return '';
    }

    // Start building the query
    let query = 'SELECT\n';

    // Handle column selection with proper formatting
    const columnPart = selectedColumns
      .filter(col => col.output !== false)
      .map(col => {
        let columnStr = '  ' + col.name; // Add indentation
        
        // Handle aggregate function if exists
        if (col.aggregate.length > 0 && col.aggregate !== 'NONE') {
          // columnStr = `  ${col.aggregate}(${col.name})`;
          const aggregates = col.aggregate;
          const aggregateStr = aggregates.map(aggr => `   ${aggr}(${col.name})`).join(",\n");
          columnStr = aggregateStr;
        }
        // Add alias if exists
        if (col.alias && col.alias.trim() !== '') {
          columnStr += ` AS "${col.alias.trim()}"`;
        }
        
        return columnStr;
      })
      .join(',\n');

    query += columnPart;
    query += `\nFROM ${tableName}`;

    // Add WHERE clause from filter conditions
    if (complexQuery && complexQuery.trim() !== '') {
      query += '\nWHERE\n  ' + complexQuery;
    }

    // Add GROUP BY if any aggregates are used
    const groupByColumns = selectedColumns
      // .filter(col => col.groupBy || (col.aggregate && col.aggregate !== 'NONE'))
      .filter(col => col.groupBy)
      .map(col => col.name);
    
    if (groupByColumns.length > 0) {
      query += '\nGROUP BY\n  ' + groupByColumns.join(',\n  ');
    }

    // Add ORDER BY if sort is specified
    const sortColumns = selectedColumns
      .filter(col => col.sort && col.sort !== 'NONE')
      .map(col => `${col.name} ${col.sort}`);
    
    if (sortColumns.length > 0) {
      query += '\nORDER BY\n  ' + sortColumns.join(',\n  ');
    }

    return query;
  } catch (error) {
    console.error('Error generating SQL query:', error);
    return 'Error generating SQL query';
  }
};

/**
 * Generates WHERE clause from filter conditions
 */
const generateWhereClause = (conditions) => {
  if (!conditions || conditions.length === 0) return '';

  return conditions.map(group => {
    if (!group.conditions || !Array.isArray(group.conditions)) return '';

    const groupConditions = group.conditions
      .map((condition, index) => {
        if (condition.type === 'group') {
          // Handle nested group
          const nestedConditions = generateWhereClause([condition]);
          return index === 0 ? nestedConditions : `${condition.joinType || 'AND'} ${nestedConditions}`;
        }

        // Handle basic condition
        const { column, operator, value, value2, conditionType } = condition;
        if (!column || !operator) return '';

        const columnType = (conditionType || '').toLowerCase();
        const shouldQuote = !['decimal', 'double', 'integer'].includes(columnType);

        let formattedValue = value;
        if (shouldQuote && typeof value === 'string') {
          formattedValue = `'${value}'`;
        }

        // Handle different operator types
        switch (operator.toUpperCase()) {
          case 'BETWEEN':
            if (value2 !== undefined) {
              const formattedValue2 = shouldQuote ? `'${value2}'` : value2;
              return index === 0
                ? `${column} BETWEEN ${formattedValue} AND ${formattedValue2}`
                : `${condition.joinType || 'AND'} ${column} BETWEEN ${formattedValue} AND ${formattedValue2}`;
            }
            return '';
          case 'IN':
          case 'NOT IN':
            if (Array.isArray(value)) {
              const values = value.map(v => shouldQuote ? `'${v}'` : v).join(', ');
              return index === 0
                ? `${column} ${operator} (${values})`
                : `${condition.joinType || 'AND'} ${column} ${operator} (${values})`;
            }
            return '';
          case 'IS NULL':
          case 'IS NOT NULL':
            return index === 0
              ? `${column} ${operator}`
              : `${condition.joinType || 'AND'} ${column} ${operator}`;
          default:
            return index === 0
              ? `${column} ${operator} ${formattedValue}`
              : `${condition.joinType || 'AND'} ${column} ${operator} ${formattedValue}`;
        }
      })
      .filter(Boolean);

    return groupConditions.length > 0 ? `(${groupConditions.join(' ')})` : '';
  }).filter(Boolean).join(` ${conditions[0]?.joinType || 'AND'} `);
}; 
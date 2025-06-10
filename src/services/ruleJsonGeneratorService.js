export const getSegregatedColumns = (columns) => {
    const metricColumns = [];
    const groupByColumns = [];
    
    columns.forEach(column => {
        if (column.dimType.toLowerCase() === "metric" && column.aggregate) {
            metricColumns.push({
                id: column.id,
                name: column.name,
                aggregate: column.aggregate,
            });
        }
        
        if (column.dimType.toLowerCase() === "dimension" && column.groupBy === true) {
            groupByColumns.push({
                id: column.id,
                name: column.name,
            });
        }
    })

    return {
        metricColumns,
        groupByColumns
    };
}

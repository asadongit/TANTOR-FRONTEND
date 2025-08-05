import { useState, useMemo } from 'react';

const SchemaDetailsViewComponent = ({ tableData, componentInfo, activeTabBusiness }) => {
  const mapTableTags = (data, connectionName, schema) => {
    const connectionKey = `${connectionName}:${schema}`;
    const schemaData = data[connectionKey];
    
    if (!schemaData) {
      return {
        domain: [],
        category: [],
        sub_category: [],
        tag: [],
        sub_tag: [],
        terms: []
      };
    }

    const uniqueTags = {
      domain: new Map(),
      category: new Map(),
      sub_category: new Map(),
      tag: new Map(),
      sub_tag: new Map(),
      terms: new Map()
    };

    Object.values(schemaData).forEach(table => {
      if (table.table_tags) {
        Object.keys(uniqueTags).forEach(tagType => {
          if (table.table_tags[tagType] && Array.isArray(table.table_tags[tagType])) {
            table.table_tags[tagType].forEach(tag => {
              if (tag.id && !uniqueTags[tagType].has(tag.id)) {
                uniqueTags[tagType].set(tag.id, tag);
              }
            });
          }
        });
      }
    });

    const result = {};
    Object.keys(uniqueTags).forEach(tagType => {
      result[tagType] = Array.from(uniqueTags[tagType].values());
    });

    return result;
  };

  const uniqueTags = useMemo(() => {
    if (!tableData || !componentInfo) return {
      domain: [],
      category: [],
      sub_category: [],
      tag: [],
      sub_tag: [],
      terms: []
    };
    
    return mapTableTags(tableData, componentInfo.connectionName, componentInfo.schema);
  }, [tableData, componentInfo]);

  const createTableRows = () => {
    const rows = [];
    const maxLength = Math.max(
      uniqueTags.domain.length,
      uniqueTags.category.length,
      uniqueTags.sub_category.length,
      uniqueTags.terms.length,
      uniqueTags.tag.length,
      uniqueTags.sub_tag.length,
      1 // At least one row for schema info
    );

    for (let i = 0; i < maxLength; i++) {
      rows.push({
        id: i + 1,
        schema: i === 0 ? componentInfo?.schema || 'N/A' : '',
        domain: uniqueTags.domain[i]?.name || '',
        category: uniqueTags.category[i]?.name || '',
        sub_category: uniqueTags.sub_category[i]?.name || '',
        term: uniqueTags.terms[i]?.name || '',
        tag: uniqueTags.tag[i]?.name || '',
        sub_tag: uniqueTags.sub_tag[i]?.name || ''
      });
    }

    return rows;
  };

  const tableRows = createTableRows();

  return (
    <>
      {activeTabBusiness === "schema-details" && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5 text-sm max-h-96 overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#29304a] text-white">
                <th className="text-left p-4 min-w-[60px]">ID</th>
                <th className="text-left p-4 min-w-[120px]">Schema</th>
                <th className="text-left p-4 min-w-[150px]">Domain</th>
                <th className="text-left p-4 min-w-[150px]">Category</th>
                <th className="text-left p-4 min-w-[150px]">Sub-category</th>
                <th className="text-left p-4 min-w-[120px]">Term</th>
                <th className="text-left p-4 min-w-[180px]">Tag</th>
                <th className="text-left p-4 min-w-[120px]">Sub-tag</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length > 0 ? (
                tableRows.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4">{String(row.id).padStart(2, '0')}</td>
                    <td className="p-4 font-medium">{row.schema}</td>
                    <td className="p-4">
                      {row.domain && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.domain}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.category && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.sub_category && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.sub_category}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.term && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.term}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.tag && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.tag}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {row.sub_tag && (
                        <span className="inline-block px-2 py-1 text-gray-500 rounded-full text-xs">
                          {row.sub_tag}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td className="p-4 text-center" colSpan="8">
                    <span className="text-gray-500 italic">No data available</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};


export default SchemaDetailsViewComponent;
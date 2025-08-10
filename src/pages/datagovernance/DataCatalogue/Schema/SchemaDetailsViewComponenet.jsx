import { useMemo } from 'react';

// Helper function to format titles nicely (e.g., 'sub_category' -> 'Sub-category')
const formatTitle = (title) => {
  const formatted = title.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const SchemaDetailsViewComponent = ({ tableData, componentInfo, activeTabBusiness }) => {
  const mapTableTags = (data, connectionName, schema) => {
    const connectionKey = `${connectionName}:${schema}`;
    const schemaData = data[connectionKey];

    if (!schemaData) {
      return { domain: [], category: [], sub_category: [], tag: [], sub_tag: [] };
    }

    const uniqueTags = {
      domain: new Map(),
      category: new Map(),
      sub_category: new Map(),
      tag: new Map(),
      sub_tag: new Map()
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
    if (!tableData || !componentInfo) {
      return { domain: [], category: [], sub_category: [], tag: [], sub_tag: [] };
    }
    return mapTableTags(tableData, componentInfo.connectionName, componentInfo.schema);
  }, [tableData, componentInfo]);


  const hasData = useMemo(() => Object.values(uniqueTags).some(arr => arr.length > 0), [uniqueTags]);

  return (
    <>
      {activeTabBusiness === "schema-details" && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-5 text-sm max-h-96 overflow-y-auto">
          {hasData ? (
            <table className="w-full">
              <tbody className='divide-y divide-gray-200'>
                {Object.entries(uniqueTags).map(([type, values]) => (
                  <tr key={type} className="hover:bg-gray-50">
                    <td className="p-4 w-1/3 font-medium text-gray-600 align-top">
                      {formatTitle(type)}
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">
                        {(() => {
                          const names = values.map(v => v.name);
                          if (names.length === 0) {
                            return <span className="text-gray-500">N/A</span>;
                          }

                          const fullText = names.join(', ');
                          if (names.length > 3 || fullText.length > 100) {
                            const visibleNames = names.slice(0, 3);
                            return (
                              <span title={fullText}>
                                {visibleNames.join(', ')}
                                <span className="text-gray-500 italic">...</span>
                              </span>
                            );
                          }
                          return fullText;
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center">
              <span className="text-gray-500 italic">No business data available for this schema.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SchemaDetailsViewComponent;
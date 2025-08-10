import { useMemo } from 'react';

const CompositeViewComponent = ({ tableData, componentInfo, activeTabBusiness }) => {
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

  const TagPills = ({ tags, maxDisplay = 10 }) => {
    const displayTags = tags.slice(0, maxDisplay);
    const remainingCount = tags.length - maxDisplay;

    if (tags.length === 0) {
      return <span className="text-sm px-3 py-1 rounded-2xl bg-[#8d77ba]">NA</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {displayTags.map((tag, index) => (
          <span 
            key={tag.id || index} 
            className="p-2 rounded-2xl bg-[#8d77ba] text-sm hover:bg-purple-100 transition-colors cursor-pointer"
            title={tag.description || tag.name}
          >
            {tag.name}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="p-2 rounded-lg bg-blue-50 text-blue-600 text-sm">
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {activeTabBusiness === "composite-view" && (
        <div className="flex-col">
          <div className="flex">
            <div className="w-[50%]">
              <div className="mt-3 font-medium">Domain</div>
              <div className="mt-3 text-white">
                <TagPills tags={uniqueTags.domain} />
              </div>
            </div>
            <div className="w-[50%]">
              <div className="mt-3 font-medium">Category</div>
              <div className="mt-3 text-white">
                <TagPills tags={uniqueTags.category} />
              </div>
            </div>
          </div>

          <div className="flex mt-5">
            <div className="w-[50%]">
              <div className="mt-3 font-medium">Sub-category</div>
              <div className="mt-3 text-white">
                <TagPills tags={uniqueTags.sub_category} />
              </div>
            </div>
             <div className="w-[50%]">
              <div className="mt-3 font-medium">Tags</div>
              <div className="mt-3 text-white">
                <TagPills tags={uniqueTags.tag} />
              </div>
            </div>
          </div>

          <div className="flex mt-5">
            <div className="w-[50%]">
              <div className="mt-3 font-medium">Sub-tags</div>
              <div className="mt-3 text-white">
                <TagPills tags={uniqueTags.sub_tag} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompositeViewComponent;
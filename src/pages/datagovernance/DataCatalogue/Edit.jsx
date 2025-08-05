import { Pencil, CircleX, Plus, X, ChevronDown, Loader2, Search } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AddCatalogueModal from '../BusinessCatalogue/AddCatalogueModal';

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/business_catalogue/add`;
const OWNER_OPTIONS = ['Admin'];

const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* for Chrome, Safari, and Opera */
  }
  .hide-scrollbar {
    -ms-overflow-style: none;  /* for Internet Explorer and Edge */
    scrollbar-width: none;  /* for Firefox */
  }
`;

const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, disabled = false, isLoading = false, onOpen = () => { }, direction = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      onOpen();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  const getLabel = (value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const selectClass = 'w-full border rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#8d77ba] focus:border-[#8d77ba] disabled:bg-gray-100 disabled:cursor-not-allowed';

  const tooltipText = selectedValues.map(getLabel).join(', ');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dropdownMenuClasses = `
    absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg
    ${direction === 'top' ? 'bottom-full mb-1' : 'mt-1'}
  `;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <style>{styles}</style>
      <button
        type="button"
        onClick={handleToggle}
        className={`${selectClass} flex justify-between items-center text-left`}
        disabled={disabled}
        title={tooltipText}
      >
        <div className="flex-grow w-0 flex flex-nowrap gap-1 overflow-x-auto hide-scrollbar">
          {selectedValues.length > 0 ? (
            selectedValues.map(value => (
              <span
                key={value}
                className="bg-[#8d77ba] text-white text-xs font-semibold mr-2 px-2.5 py-1 rounded-full flex items-center flex-shrink-0"
              >
                {getLabel(value)}
                <X
                  className="w-3 h-3 ml-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(value);
                  }}
                />
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={dropdownMenuClasses}>
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8d77ba]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-2 text-center text-gray-500">Loading...</div>
            ) : filteredOptions.length > 0 ? (
              <ul>
                {filteredOptions.map(option => (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      readOnly
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-[#8d77ba] focus:ring-[#8d77ba]"
                    />
                    {option.label}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-2 text-center text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Edit = ({ onClose, editDetails, type }) => {
  const { decodedToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [subTags, setSubTags] = useState([]);
  const [terms, setTerms] = useState([]);

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSubTags, setSelectedSubTags] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingSubTags, setIsLoadingSubTags] = useState(false);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  const [saveError, setSaveError] = useState('');

  const isUserAuthorized = decodedToken?.resource_access?.darch?.roles?.some(role =>
    ['data steward', 'data owner'].includes(role.toLowerCase())
  );

  const fetchDomains = useCallback(() => 
  fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/domain`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'accept': 'application/json' 
    },
    body: JSON.stringify({ business_catalogue: false })
  })
  .then(res => res.json())
  .then(setDomains)
  .catch(e => console.error('Error fetching domains:', e)), 
[]);

  const fetchTags = useCallback((domainIds) => {
    if (domainIds.length === 0) return;
    setIsLoadingTags(true);
    fetch(`${API_BASE_URL}/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ domain_id: domainIds.map(Number) })
    })
      .then(res => res.json()).then(apiTags => {
        setTags(prev => {
          const combined = [...prev, ...apiTags];
          return Array.from(new Map(combined.map(item => [item.tag_id, item])).values());
        });
      })
      .catch(e => console.error('Error fetching tags:', e))
      .finally(() => setIsLoadingTags(false));
  }, []);

  const fetchTerms = useCallback((domainIds) => {
    if (domainIds.length === 0 || type !== 'column') return;
    setIsLoadingTerms(true);
    fetch(`${API_BASE_URL}/terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ domain_id: domainIds.map(Number) })
    })
      .then(res => res.json()).then(apiTerms => {
        setTerms(prev => {
          const combined = [...prev, ...apiTerms];
          return Array.from(new Map(combined.map(item => [item.term_id, item])).values());
        });
      })
      .catch(e => console.error('Error fetching terms:', e))
      .finally(() => setIsLoadingTerms(false));
  }, [type]);

  const fetchCategories = useCallback((domainIds) => {
    if (domainIds.length === 0) return;
    setIsLoadingCategories(true);
    fetch(`${API_BASE_URL}/category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ 'business_catalogue': false ,domain_id: domainIds.map(Number) })
    })
      .then(res => res.json()).then(apiCategories => {
        setCategories(prev => {
          const combined = [...prev, ...apiCategories];
          return Array.from(new Map(combined.map(item => [item.category_id, item])).values());
        });
      })
      .catch(e => console.error('Error fetching categories:', e))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const fetchSubCategories = useCallback((domainIds, categoryIds) => {
    if (categoryIds.length === 0 || domainIds.length === 0) return;
    setIsLoadingSubCategories(true);
    fetch(`${API_BASE_URL}/sub_category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ 'business_catalogue': false ,domain_id: domainIds.map(Number), category_id: categoryIds.map(Number) })
    })
      .then(res => res.json()).then(apiSubCategories => {
        setSubCategories(prev => {
          const combined = [...prev, ...apiSubCategories];
          return Array.from(new Map(combined.map(item => [item.sub_category_id, item])).values());
        });
      })
      .catch(e => console.error('Error fetching sub-categories:', e))
      .finally(() => setIsLoadingSubCategories(false));
  }, []);

  // UPDATED: fetchSubTags now accepts domainIds and tagIds
  const fetchSubTags = useCallback((domainIds, tagIds) => {
    if (tagIds.length === 0 || domainIds.length === 0) return;
    setIsLoadingSubTags(true);
    fetch(`${API_BASE_URL}/sub_tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      // UPDATED: Payload now includes both domain_id and tag_id
      body: JSON.stringify({ domain_id: domainIds.map(Number), tag_id: tagIds.map(Number) })
    })
      .then(res => res.json()).then(apiSubTags => {
        setSubTags(prev => {
          const combined = [...prev, ...apiSubTags];
          return Array.from(new Map(combined.map(item => [item.sub_tag_id, item])).values());
        });
      })
      .catch(e => console.error('Error fetching sub-tags:', e))
      .finally(() => setIsLoadingSubTags(false));
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      try {
        await fetchDomains();

        const prefillData = editDetails.prefill;
        if (prefillData) {
          const selectedDomainIds = prefillData.domain?.map(item => item.id) || [];
          const selectedCategoryIds = prefillData.category?.map(item => item.id) || [];
          const selectedTagIds = prefillData.tag?.map(item => item.id) || [];

          setSelectedDomains(selectedDomainIds);
          setSelectedCategories(selectedCategoryIds);
          setSelectedSubCategories(prefillData.sub_category?.map(item => item.id) || []);
          setSelectedTags(selectedTagIds);
          setSelectedSubTags(prefillData.sub_tag?.map(item => item.id) || []);

          if (prefillData.category?.length) setCategories(prefillData.category.map(c => ({ ...c, category_id: c.id })));
          if (prefillData.sub_category?.length) setSubCategories(prefillData.sub_category.map(sc => ({ ...sc, sub_category_id: sc.id })));
          if (prefillData.tag?.length) setTags(prefillData.tag.map(t => ({ ...t, tag_id: t.id })));
          if (prefillData.sub_tag?.length) setSubTags(prefillData.sub_tag.map(st => ({ ...st, sub_tag_id: st.id })));
          if (type === 'column') {
            setSelectedTerms(prefillData.term?.map(item => item.id) || []);
            if (prefillData.term?.length) setTerms(prefillData.term.map(t => ({ ...t, term_id: t.id })));
          }

          const dependentFetches = [];
          if (selectedDomainIds.length > 0) {
            dependentFetches.push(fetchCategories(selectedDomainIds));
            dependentFetches.push(fetchTags(selectedDomainIds));
            dependentFetches.push(fetchTerms(selectedDomainIds));
            if (selectedCategoryIds.length > 0) {
              dependentFetches.push(fetchSubCategories(selectedDomainIds, selectedCategoryIds));
            }
            if (selectedTagIds.length > 0) {
              // UPDATED: Pass both domain and tag IDs when fetching sub-tags on initialization
              dependentFetches.push(fetchSubTags(selectedDomainIds, selectedTagIds));
            }
          }
          await Promise.all(dependentFetches);
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        setSaveError("Failed to load form details.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeForm();
  }, [editDetails, type, fetchDomains, fetchCategories, fetchSubCategories, fetchTags, fetchSubTags, fetchTerms]);


  const handleOpenCategories = () => {
    if (categories.length === 0 && !isLoadingCategories && selectedDomains.length > 0) {
      fetchCategories(selectedDomains);
    }
  };

  const handleOpenSubCategories = () => {
    if (subCategories.length === 0 && !isLoadingSubCategories && selectedDomains.length > 0 && selectedCategories.length > 0) {
      fetchSubCategories(selectedDomains, selectedCategories);
    }
  };

  const handleOpenTags = () => {
    if (tags.length === 0 && !isLoadingTags && selectedDomains.length > 0) {
      fetchTags(selectedDomains);
    }
  };

  // UPDATED: Check for selectedDomains before fetching sub-tags
  const handleOpenSubTags = () => {
    if (subTags.length === 0 && !isLoadingSubTags && selectedDomains.length > 0 && selectedTags.length > 0) {
      fetchSubTags(selectedDomains, selectedTags);
    }
  };

  const handleOpenTerms = () => {
    if (terms.length === 0 && !isLoadingTerms && selectedDomains.length > 0) {
      fetchTerms(selectedDomains);
    }
  };

  const handleDomainChange = (newValues) => {
    setSelectedDomains(newValues);
    // Reset all dependent fields
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedTags([]);
    setSelectedSubTags([]);
    setSelectedTerms([]);
    setCategories([]);
    setSubCategories([]);
    setTags([]);
    setSubTags([]);
    setTerms([]);
  };

  const handleCategoryChange = (newValues) => {
    setSelectedCategories(newValues);
    // Reset dependent sub-category field
    setSelectedSubCategories([]);
    setSubCategories([]);
  };

  const handleTagChange = (newValues) => {
    setSelectedTags(newValues);
    // Reset dependent sub-tag field
    setSelectedSubTags([]);
    setSubTags([]);
  };

  const handleSave = async () => {
    setSaveError('');
    const hasSelection = [selectedDomains, selectedCategories, selectedSubCategories, selectedTags, selectedSubTags, selectedTerms].some(arr => arr.length > 0);

    if (!hasSelection) {
      setSaveError('Error: At least one selection is required.');
      return;
    }

    let payload;
    let endpoint;

    if (type === 'column') {
      endpoint = `${window._env_?.VITE_FAST_API}/data_catalogue/add_catalogue_element_column`;
      payload = {
        elements: [{
          connection_set: [{
            connection_name: editDetails.connection_name,
            table_schema: editDetails.table_schema,
            table_name: editDetails.table_name,
            column: editDetails.column
          }],
          id_set: [{
            column_name: editDetails.column,
            domain_id: selectedDomains.map(Number),
            category_id: selectedCategories.map(Number),
            sub_category_id: selectedSubCategories.map(Number),
            term_id: selectedTerms.map(Number),
            tag_id: selectedTags.map(Number),
            sub_tag_id: selectedSubTags.map(Number)
          }]
        }]
      };
    } else {
      endpoint = `${window._env_?.VITE_FAST_API}/data_catalogue/add_catalogue_element_table`;
      payload = {
        elements: [{
          connection_set: editDetails.connection_set,
          id_set: [{
            domain_id: selectedDomains.map(Number),
            category_id: selectedCategories.map(Number),
            sub_category_id: selectedSubCategories.map(Number),
            tag_id: selectedTags.map(Number),
            sub_tag_id: selectedSubTags.map(Number)
          }]
        }]
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      console.log('Save successful:', await response.json());
      onClose();
    } catch (error) {
      console.error('Error saving catalogue element:', error);
      setSaveError(`Save failed: ${error.message}`);
    }
  };

  const formSectionClass = 'w-full';

  if (isLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-full max-h-screen bg-white'>
        <Loader2 className="w-8 h-8 animate-spin text-[#8d77ba]" />
        <p className="mt-2 text-gray-600">Loading details...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col justify-between h-full max-h-screen bg-white'>
      <div className='flex-grow overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10'>
          <div className='flex items-center gap-x-3 text-[#8d77ba]'><Pencil className="w-4 h-4" /><span className='font-semibold'>Edit {type === 'column' ? 'Column' : 'Table'}</span></div>
          <button onClick={onClose} aria-label="Close" className='text-gray-500 hover:text-gray-600'><CircleX className="w-5 h-5" /></button>
        </div>

        {/* Form Section */}
        <div className='flex flex-col items-start gap-5 p-6 pt-2 text-sm'>
          {/* DOMAIN */}
          <div className={formSectionClass}>
            <div className='flex justify-between items-center mb-2'>
              <div className='font-medium'>Domain</div>
              {isUserAuthorized && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className='flex items-center gap-x-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-[#8d77ba] text-white hover:bg-opacity-90'
                  aria-label="Add new catalogue item"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={domains?.map(d => ({ value: d.domain_id, label: d.name })) || []}
                selectedValues={selectedDomains}
                onChange={handleDomainChange}
                placeholder="Select Domains"
              />
            </div>
          </div>

          {/* Category */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Category</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={categories?.map(c => ({ value: c.category_id, label: c.name })) || []}
                selectedValues={selectedCategories}
                onChange={handleCategoryChange}
                placeholder="Select Categories"
                disabled={selectedDomains.length === 0}
                isLoading={isLoadingCategories}
                onOpen={handleOpenCategories}
              />
            </div>
          </div>

          {/* Sub Category */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Sub-Category</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={subCategories?.map(sc => ({ value: sc.sub_category_id, label: sc.name })) || []}
                selectedValues={selectedSubCategories}
                onChange={setSelectedSubCategories}
                placeholder="Select Sub-Categories"
                disabled={selectedCategories.length === 0}
                isLoading={isLoadingSubCategories}
                onOpen={handleOpenSubCategories}
                direction="top"
              />
            </div>
          </div>

          {/* Tags */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Tags</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={tags?.map(t => ({ value: t.tag_id, label: t.name })) || []}
                selectedValues={selectedTags}
                onChange={handleTagChange}
                placeholder="Select Tags"
                direction="top"
                disabled={selectedDomains.length === 0}
                isLoading={isLoadingTags}
                onOpen={handleOpenTags}
              />
            </div>
          </div>

          {/* Sub tags */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Sub-tags</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={subTags?.map(st => ({ value: st.sub_tag_id, label: st.name })) || []}
                selectedValues={selectedSubTags}
                onChange={setSelectedSubTags}
                placeholder="Select Sub-tags"
                disabled={selectedTags.length === 0}
                isLoading={isLoadingSubTags}
                onOpen={handleOpenSubTags}
                direction="top"
              />
            </div>
          </div>

          {/* Terms */}
          {type === 'column' && (
            <div className={formSectionClass}>
              <div className='mb-2 font-medium'>Terms</div>
              <div className='flex justify-between items-start gap-x-2'>
                <MultiSelectDropdown
                  options={terms?.map(t => ({ value: t.term_id, label: t.name })) || []}
                  selectedValues={selectedTerms}
                  onChange={setSelectedTerms}
                  placeholder="Select Terms"
                  direction="top"
                  disabled={selectedDomains.length === 0}
                  isLoading={isLoadingTerms}
                  onOpen={handleOpenTerms}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className='border-t px-5 py-3 text-sm sticky bottom-0 bg-white z-10'>
        {saveError && <div className="text-red-600 text-center mb-3">{saveError}</div>}
        <div className='flex justify-end gap-x-4'>
          <button onClick={onClose} className='w-36 h-10 border border-gray-400 text-gray-400 p-2 rounded-md hover:bg-gray-100'>Cancel</button>
          <button onClick={handleSave} className='w-36 h-10 p-2 border border-[#8d77ba] rounded-md text-[#8d77ba] hover:bg-[#8d77ba] hover:text-white'>Save</button>
        </div>
      </div>

      {/* Add Catalogue Modal */}
      <AddCatalogueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
};

export default Edit;
import { Pencil, CircleX, Plus, X, ChevronDown, Loader2, Search } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';

const API_BASE_URL = `${window._env_?.VITE_FAST_API}/business_catalogue/add`;
const OWNER_OPTIONS = ['Admin'];

const AddModal = ({ type, dependencies = {}, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active',
    owner: [],
    stakeholder: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef(null);

  const [stakeholders, setStakeholders] = useState([]);
  const [isStakeholdersLoading, setIsStakeholdersLoading] = useState(false);
  const [showStakeholderOptions, setShowStakeholderOptions] = useState(false);
  const [stakeholderSearchTerm, setStakeholderSearchTerm] = useState('');
  const stakeholderRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target)) {
        setIsOwnerDropdownOpen(false);
      }
      if (stakeholderRef.current && !stakeholderRef.current.contains(event.target)) {
        setShowStakeholderOptions(false);
        setStakeholderSearchTerm('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (type === 'domain') {
      const fetchStakeholders = async () => {
        setIsStakeholdersLoading(true);
        try {
          const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names`);
          if (!response.ok) throw new Error('Could not load stakeholders');
          const data = await response.json();
          setStakeholders(data);
        } catch (err) {
          console.error("Failed to fetch stakeholders:", err);
          setError(prev => (prev ? prev + " | " : "") + err.message);
        } finally {
          setIsStakeholdersLoading(false);
        }
      };
      fetchStakeholders();
    }
  }, [type]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (ownerValue) => {
    setFormData(prev => {
      const newOwners = prev.owner.includes(ownerValue)
        ? prev.owner.filter(o => o !== ownerValue)
        : [...prev.owner, ownerValue];
      return { ...prev, owner: newOwners };
    });
  };

  const handleStakeholderSelect = (username) => {
    if (!formData.stakeholder.includes(username)) {
      setFormData(prev => ({
        ...prev,
        stakeholder: [...prev.stakeholder, username]
      }));
    }
    setStakeholderSearchTerm('');
    setShowStakeholderOptions(false);
  };

  const handleStakeholderRemove = (username) => {
    setFormData(prev => ({
      ...prev,
      stakeholder: prev.stakeholder.filter(s => s !== username)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.name) {
      setError('Name is a required field.');
      setIsLoading(false);
      return;
    }

    const standardPayload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      owner: formData.owner,
    };

    let payload = {};
    switch (type) {
      case 'domain':
        payload = { domain: { standard: standardPayload, stakeholder: formData.stakeholder } };
        break;
      case 'category':
        payload = { category: { domain_id: dependencies.domain_id[0], standard: standardPayload } };
        break;
      case 'subcategory':
        payload = { subcategory: { domain_id: dependencies.domain_id[0], category_id: dependencies.category_id[0], standard: standardPayload } };
        break;
      case 'tag':
        payload = { tag: { standard: standardPayload } };
        break;
      case 'subtag':
        payload = { subtag: { tag_id: dependencies.tag_id[0], standard: standardPayload } };
        break;
      case 'term':
        payload = { term: { standard: standardPayload } };
        break;
      default:
        setError('Invalid component type.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/add_new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      await response.json();
      onSuccess(type);
    } catch (err) {
      setError(`Failed to add ${type}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStakeholders = stakeholders
    .filter(user => !formData.stakeholder.includes(user.username))
    .filter(user =>
      user.username.toLowerCase().includes(stakeholderSearchTerm.toLowerCase())
    );

  const title = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
            {/* Name and Description fields remain the same */}
            <div>
              <label htmlFor="name" className="block mb-1 font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded-md p-2 focus:ring-1 focus:ring-[#8d77ba] focus:border-[#8d77ba]" required />
            </div>
            <div>
              <label htmlFor="description" className="block mb-1 font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full border rounded-md p-2 focus:ring-1 focus:ring-[#8d77ba] focus:border-[#8d77ba]"></textarea>
            </div>

            {/* Owner Dropdown */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">Owner(s)</label>
              <div className="relative" ref={ownerDropdownRef}>
                <button type="button" onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)} className="flex justify-between items-center w-full border rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#8d77ba]">
                  <span className="flex-grow text-left">
                    {formData.owner.length > 0 ? formData.owner.join(', ') : <span className="text-gray-500">Select Owners</span>}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOwnerDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isOwnerDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <ul>
                      {OWNER_OPTIONS.map(option => (
                        <li key={option} onClick={() => handleOwnerChange(option)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center">
                          <input type="checkbox" readOnly checked={formData.owner.includes(option)} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#8d77ba] focus:ring-[#8d77ba]" />
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* --- UPDATED: Advanced Stakeholder Input (only for domain) --- */}
            {type === 'domain' && (
              <div className="relative" ref={stakeholderRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder(s)</label>
                <div
                  className="min-h-[42px] p-1 border border-gray-300 bg-white rounded-md focus-within:ring-1 focus-within:ring-[#8d77ba] flex flex-wrap items-center gap-2"
                  onClick={() => setShowStakeholderOptions(true)}
                >
                  {formData.stakeholder.map(username => (
                    <span key={username} className="bg-[#e4dcf5] text-[#584185] text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5">
                      {username}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStakeholderRemove(username); }}
                        className="text-[#584185] hover:text-black"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {!formData.stakeholder.length && !isStakeholdersLoading && <span className="text-gray-500 px-1">Select stakeholders</span>}
                  {isStakeholdersLoading && <Loader2 className="animate-spin h-4 w-4 text-gray-400 mx-auto" />}
                </div>

                {showStakeholderOptions && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute top-1/2 left-2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search stakeholders..."
                          className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm"
                          value={stakeholderSearchTerm}
                          onChange={(e) => setStakeholderSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {filteredStakeholders.length > 0 ? (
                        filteredStakeholders.map((user) => (
                          <li
                            key={user.id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            onClick={() => handleStakeholderSelect(user.username)}
                          >
                            {user.username}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-gray-500 text-sm">
                          {isStakeholdersLoading ? 'Loading...' : 'No results found.'}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
            {error && <div className="text-red-600 text-center text-sm mb-3">{error}</div>}
            <div className="flex justify-end gap-x-4">
              <button type="button" onClick={onClose} className='w-28 h-10 border border-gray-400 text-gray-600 p-2 rounded-md hover:bg-gray-100'>Cancel</button>
              <button type="submit" disabled={isLoading} className='w-28 h-10 p-2 border border-[#8d77ba] rounded-md text-white bg-[#8d77ba] hover:bg-opacity-90 disabled:bg-gray-300'>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  console.log("edit details are @@@@@", editDetails);

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
  const [isLoadingSubTags, setIsLoadingSubTags] = useState(false);

  const [saveError, setSaveError] = useState('');
  const [modalConfig, setModalConfig] = useState(null);

  const fetchDomains = useCallback(() => fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/domain`).then(res => res.json()).then(setDomains).catch(e => console.error('Error fetching domains:', e)), []);
  const fetchTags = useCallback(() => fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/tag`).then(res => res.json()).then(setTags).catch(e => console.error('Error fetching tags:', e)), []);
  const fetchTerms = useCallback(() => fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/terms`).then(res => res.json()).then(setTerms).catch(e => console.error('Error fetching terms:', e)), []);

  const fetchCategories = useCallback((domainIds) => {
    if (domainIds.length === 0) return;
    setIsLoadingCategories(true);
    fetch(`${API_BASE_URL}/category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ domain_id: domainIds.map(Number) })
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
    if (categoryIds.length === 0) return;
    setIsLoadingSubCategories(true);
    fetch(`${API_BASE_URL}/sub_category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ domain_id: domainIds.map(Number), category_id: categoryIds.map(Number) })
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

  const fetchSubTags = useCallback((tagIds) => {
    if (tagIds.length === 0) return;
    setIsLoadingSubTags(true);
    fetch(`${API_BASE_URL}/sub_tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ tag_id: tagIds.map(Number) })
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
        await Promise.all([
          fetchDomains(),
          fetchTags(),
          type === 'column' ? fetchTerms() : Promise.resolve(),
        ]);

        const prefillData = editDetails.prefill;
        if (prefillData) {
          const selectedDomainIds = prefillData.domain?.map(item => item.id) || [];
          const selectedTagIds = prefillData.tag?.map(item => item.id) || [];
          setSelectedDomains(selectedDomainIds);
          setSelectedTags(selectedTagIds);

          if (prefillData.category?.length) {
            setCategories(prefillData.category.map(c => ({ ...c, category_id: c.id })));
            setSelectedCategories(prefillData.category.map(item => item.id));
          }
          if (prefillData.sub_category?.length) {
            setSubCategories(prefillData.sub_category.map(sc => ({ ...sc, sub_category_id: sc.id })));
            setSelectedSubCategories(prefillData.sub_category.map(item => item.id));
          }
          if (prefillData.sub_tag?.length) {
            setSubTags(prefillData.sub_tag.map(st => ({ ...st, sub_tag_id: st.id })));
            setSelectedSubTags(prefillData.sub_tag.map(item => item.id));
          }
          if (type === 'column' && prefillData.term?.length) {
            setTerms(prefillData.term.map(t => ({ ...t, term_id: t.id })));
            setSelectedTerms(prefillData.term.map(item => item.id));
          }

          const dependentFetches = [];
          if (selectedDomainIds.length > 0) {
            dependentFetches.push(fetchCategories(selectedDomainIds));
            if (prefillData.category?.length) {
              dependentFetches.push(fetchSubCategories(selectedDomainIds, prefillData.category.map(c => c.id)));
            }
          }
          if (selectedTagIds.length > 0) {
            dependentFetches.push(fetchSubTags(selectedTagIds));
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
  }, [editDetails, type, fetchDomains, fetchTags, fetchTerms, fetchCategories, fetchSubCategories, fetchSubTags]);

  useEffect(() => {
    fetchDomains();
    fetchTags();
    if (type === 'column') {
      fetchTerms();
    }
  }, [type, fetchDomains, fetchTags, fetchTerms]);

  const handleOpenCategories = () => {
    if (categories.length === 0 && !isLoadingCategories) {
      fetchCategories(selectedDomains);
    }
  };

  const handleOpenSubCategories = () => {
    if (subCategories.length === 0 && !isLoadingSubCategories) {
      fetchSubCategories(selectedDomains, selectedCategories);
    }
  };

  const handleOpenSubTags = () => {
    if (subTags.length === 0 && !isLoadingSubTags) {
      fetchSubTags(selectedTags);
    }
  };


  const handleDomainChange = (newValues) => {
    setSelectedDomains(newValues);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setCategories([]);
    setSubCategories([]);
  };

  const handleCategoryChange = (newValues) => {
    setSelectedCategories(newValues);
    setSelectedSubCategories([]);
    setSubCategories([]);
  };

  const handleTagChange = (newValues) => {
    setSelectedTags(newValues);
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

    const payload = {
      elements: [{
        connection_set: editDetails.connection_set,
        id_set: [{
          domain_id: selectedDomains.map(Number),
          category_id: selectedCategories.map(Number),
          sub_category_id: selectedSubCategories.map(Number),
          tag_id: selectedTags.map(Number),
          sub_tag_id: selectedSubTags.map(Number),
          term_id: type === 'column' ? selectedTerms.map(Number) : [],
        }]
      }]
    };

    try {
      const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/add_catalogue_element_table`, {
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
  const buttonClass = 'mt-0.5 flex items-center border border-[#8d77ba] text-[#8d77ba] hover:bg-[#8d77ba] hover:text-white p-2 rounded-md disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed';

  const handleOpenModal = (modalType) => {
    let dependencies = {};
    if (modalType === 'category' || modalType === 'subcategory') {
      dependencies.domain_id = selectedDomains.map(Number);
    }
    if (modalType === 'subcategory') {
      dependencies.category_id = selectedCategories.map(Number);
    }
    if (modalType === 'subtag') {
      dependencies.tag_id = selectedTags.map(Number);
    }
    setModalConfig({ type: modalType, dependencies });
  };


  const handleAddSuccess = (addedType) => {
    switch (addedType) {
      case 'domain':
        fetchDomains();
        break;
      case 'category':
        fetchCategories(selectedDomains);
        break;
      case 'subcategory':
        fetchSubCategories(selectedDomains, selectedCategories);
        break;
      case 'tag':
        fetchTags();
        break;
      case 'subtag':
        fetchSubTags(selectedTags);
        break;
      case 'term':
        fetchTerms();
        break;
      default:
        break;
    }
    setModalConfig(null);
  };

  if (isLoading) {
    return (
      <div className='flex flex-col justify-center items-center h-full max-h-screen bg-white'>
        <Loader2 className="w-8 h-8 animate-spin text-[#8d77ba]" />
        <p className="mt-2 text-gray-600">Loading options...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col justify-between h-full max-h-screen bg-white'>
      <div className='flex-grow overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10'>
          <div className='flex items-center gap-x-3 text-[#8d77ba]'><Pencil className="w-4 h-4" /><span className='font-semibold'>Edit Column</span></div>
          <button onClick={onClose} aria-label="Close" className='text-gray-500 hover:text-gray-600'><CircleX className="w-5 h-5" /></button>
        </div>

        {/* Form Section */}
        <div className='flex flex-col items-start gap-5 p-6 pt-2 text-sm'>
          <div>
            <div className='mb-2 font-medium'>Top users</div>
            <div className='text-gray-500'><p>ABCD</p><p>ABCD</p><p>ABCD</p></div>
          </div>

          {/* DOMAIN */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Domain</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={domains.map(d => ({ value: d.domain_id, label: d.name }))}
                selectedValues={selectedDomains}
                onChange={handleDomainChange}
                placeholder="Select Domains"
              />
              <button onClick={() => handleOpenModal('domain')} className={buttonClass}><Plus className='w-4 h-4' /></button>
            </div>
          </div>

          {/* Category */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Category</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={categories.map(c => ({ value: c.category_id, label: c.name }))}
                selectedValues={selectedCategories}
                onChange={handleCategoryChange}
                placeholder="Select Categories"
                disabled={selectedDomains.length === 0}
                isLoading={isLoadingCategories}
                onOpen={handleOpenCategories}
              />
              <button onClick={() => handleOpenModal('category')} className={buttonClass} disabled={selectedDomains.length === 0}><Plus className='w-4 h-4' /></button>
            </div>
          </div>

          {/* Sub Category */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Sub-Category</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={subCategories.map(sc => ({ value: sc.sub_category_id, label: sc.name }))}
                selectedValues={selectedSubCategories}
                onChange={setSelectedSubCategories}
                placeholder="Select Sub-Categories"
                disabled={selectedCategories.length === 0}
                isLoading={isLoadingSubCategories}
                onOpen={handleOpenSubCategories}
                direction="top"
              />
              <button onClick={() => handleOpenModal('subcategory')} className={buttonClass} disabled={selectedCategories.length === 0}><Plus className='w-4 h-4' /></button>
            </div>
          </div>

          {/* Tags */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Tags</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={tags.map(t => ({ value: t.tag_id, label: t.name }))}
                selectedValues={selectedTags}
                onChange={handleTagChange}
                placeholder="Select Tags"
                direction="top"
              />
              <button onClick={() => handleOpenModal('tag')} className={buttonClass}><Plus className='w-4 h-4' /></button>
            </div>
          </div>

          {/* Sub tags */}
          <div className={formSectionClass}>
            <div className='mb-2 font-medium'>Sub-tags</div>
            <div className='flex justify-between items-start gap-x-2'>
              <MultiSelectDropdown
                options={subTags.map(st => ({ value: st.sub_tag_id, label: st.name }))}
                selectedValues={selectedSubTags}
                onChange={setSelectedSubTags}
                placeholder="Select Sub-tags"
                disabled={selectedTags.length === 0}
                isLoading={isLoadingSubTags}
                onOpen={handleOpenSubTags}
                direction="top"
              />
              <button onClick={() => handleOpenModal('subtag')} className={buttonClass} disabled={selectedTags.length === 0}><Plus className='w-4 h-4' /></button>
            </div>
          </div>

          {/* Terms */}
          {type === 'column' && (
            <div className={formSectionClass}>
              <div className='mb-2 font-medium'>Terms</div>
              <div className='flex justify-between items-start gap-x-2'>
                <MultiSelectDropdown
                  options={terms.map(t => ({ value: t.term_id, label: t.name }))}
                  selectedValues={selectedTerms}
                  onChange={setSelectedTerms}
                  placeholder="Select Terms"
                  direction="top"
                />
                <button onClick={() => handleOpenModal('term')} className={buttonClass}><Plus className='w-4 h-4' /></button>
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
      {modalConfig && (
        <AddModal
          type={modalConfig.type}
          dependencies={modalConfig.dependencies}
          onClose={() => setModalConfig(null)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
};

export default Edit;
import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Loader2, Search, Plus, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const AddCatalogueModal = ({ isOpen, onClose, onAddComplete }) => {
    const { token, decodedToken } = useAuth();
    const [activeTab, setActiveTab] = useState('Domain');

    const initialFormData = {
        domain: { id: null, name: '', description: '', owner: '', stakeholder: [], status: '' },
        category: [],
        subcategory: [],
        term: [],
        tag: [],
        subtag: [],
    };

    const [formData, setFormData] = useState(initialFormData);
    const [activeItemIndex, setActiveItemIndex] = useState(0);

    const [domainSuggestions, setDomainSuggestions] = useState([]);
    const [allDomains, setAllDomains] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef(null);

    const [categorySuggestions, setCategorySuggestions] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
    const categorySuggestionsRef = useRef(null);

    const [subCategorySuggestions, setSubCategorySuggestions] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [isSubCategoryLoading, setIsSubCategoryLoading] = useState(false);
    const [showSubCategorySuggestions, setShowSubCategorySuggestions] = useState(false);
    const subCategorySuggestionsRef = useRef(null);

    const [termSuggestions, setTermSuggestions] = useState([]);
    const [allTerms, setAllTerms] = useState([]);
    const [isTermLoading, setIsTermLoading] = useState(false);
    const [showTermSuggestions, setShowTermSuggestions] = useState(false);
    const termSuggestionsRef = useRef(null);

    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [isTagLoading, setIsTagLoading] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const tagSuggestionsRef = useRef(null);

    const [subTagSuggestions, setSubTagSuggestions] = useState([]);
    const [allSubTags, setAllSubTags] = useState([]);
    const [isSubTagLoading, setIsSubTagLoading] = useState(false);
    const [showSubTagSuggestions, setShowSubTagSuggestions] = useState(false);
    const subTagSuggestionsRef = useRef(null);

    const [stakeholders, setStakeholders] = useState([]);
    const [isStakeholdersLoading, setIsStakeholdersLoading] = useState(false);
    const [showStakeholderOptions, setShowStakeholderOptions] = useState(false);
    const [stakeholderSearchTerm, setStakeholderSearchTerm] = useState('');
    const stakeholderRef = useRef(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [errorTabs, setErrorTabs] = useState({});
    const [owners, setOwners] = useState([]);
    const [isOwnersLoading, setIsOwnersLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const tabs = ['Domain', 'Category', 'Sub-category', 'Term', 'Tag', 'Sub-tag'];

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setActiveTab('Domain');
            setActiveItemIndex(0);
            setErrorTabs({});
            setError(null);
            setSaveError(null);
            setErrors({});
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchOwners = async () => {
                setIsOwnersLoading(true);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names/owners`);
                    if (!response.ok) throw new Error('Failed to fetch owners');
                    const data = await response.json();
                    setOwners(data);
                } catch (error) {
                    console.error("Failed to fetch owners:", error);
                    setError(prev => (prev ? prev + " | " : "") + "Could not load owners.");
                } finally {
                    setIsOwnersLoading(false);
                }
            };
            fetchOwners();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'Domain') {
            const fetchDomains = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/domain`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({ 'business_catalogue': true })
                    });
                    if (!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();
                    setAllDomains(data);
                } catch (error) {
                    console.error("Failed to fetch domains:", error);
                    setError("Could not load existing domains. You can still enter a new one.");
                } finally {
                    setIsLoading(false);
                }
            };

            const fetchStakeholders = async () => {
                setIsStakeholdersLoading(true);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names/stakeholders`);
                    if (!response.ok) throw new Error('Network response was not ok for stakeholders');
                    const data = await response.json();
                    setStakeholders(data);
                } catch (error) {
                    console.error("Failed to fetch stakeholders:", error);
                    setError(prev => (prev ? prev + " | " : "") + "Could not load stakeholders.");
                } finally {
                    setIsStakeholdersLoading(false);
                }
            };

            fetchDomains();
            fetchStakeholders();
        }
    }, [isOpen, activeTab]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            if (activeTab === 'Category' && formData.domain.id) {
                setIsCategoryLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/category`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({ 'business_catalogue': true, domain_id: [formData.domain.id] })
                    });
                    if (!response.ok) throw new Error('Failed to fetch categories');
                    const data = await response.json();
                    setAllCategories(data);
                } catch (err) {
                    console.error("Failed to fetch categories:", err);
                    setError("Could not load existing categories for this domain. You can still enter a new one.");
                    setAllCategories([]);
                } finally {
                    setIsCategoryLoading(false);
                }
            } else {
                setAllCategories([]);
            }
        };
        fetchCategories();
    }, [activeTab, formData.domain.id]);

    // Fetch subcategories
    useEffect(() => {
        const fetchSubCategories = async () => {
            if (activeTab === 'Sub-category' && formData.domain.id && formData.category.length > 0) {
                setIsSubCategoryLoading(true);
                setError(null);
                try {
                    const categoryIds = formData.category.map(cat => cat.id).filter(id => id);
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/sub_category`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            domain_id: [formData.domain.id],
                            category_id: categoryIds,
                            business_catalogue: true,
                        })
                    });
                    if (!response.ok) throw new Error('Failed to fetch sub-categories');
                    const data = await response.json();
                    setAllSubCategories(data);
                } catch (err) {
                    console.error("Failed to fetch sub-categories:", err);
                    setError("Could not load existing sub-categories. You can still enter a new one.");
                    setAllSubCategories([]);
                } finally {
                    setIsSubCategoryLoading(false);
                }
            } else {
                setAllSubCategories([]);
            }
        };
        fetchSubCategories();
    }, [activeTab, formData.domain.id, formData.category]);

    // Fetch terms
    useEffect(() => {
        const fetchTerms = async () => {
            if (activeTab === 'Term') {
                setIsTermLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/terms`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({})
                    });
                    if (!response.ok) throw new Error('Failed to fetch terms');
                    const data = await response.json();
                    setAllTerms(data);
                } catch (err) {
                    console.error("Failed to fetch terms:", err);
                    setError("Could not load existing terms. You can still enter a new one.");
                    setAllTerms([]);
                } finally {
                    setIsTermLoading(false);
                }
            } else {
                setAllTerms([]);
            }
        };
        fetchTerms();
    }, [activeTab]);

    // Fetch tags
    useEffect(() => {
        const fetchTags = async () => {
            if (activeTab === 'Tag') {
                setIsTagLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/tag`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({})
                    });
                    if (!response.ok) throw new Error('Failed to fetch tags');
                    const data = await response.json();
                    setAllTags(data);
                } catch (err) {
                    console.error("Failed to fetch tags:", err);
                    setError("Could not load existing tags. You can still enter a new one.");
                    setAllTags([]);
                } finally {
                    setIsTagLoading(false);
                }
            } else {
                setAllTags([]);
            }
        };
        fetchTags();
    }, [activeTab]);

    // Fetch subtags
    useEffect(() => {
        const fetchSubTags = async () => {
            if (activeTab === 'Sub-tag' && formData.tag.length > 0) {
                setIsSubTagLoading(true);
                setError(null);
                try {
                    const tagIds = formData.tag.map(tag => tag.id).filter(id => id);
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/sub_tag`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({ tag_id: tagIds })
                    });
                    if (!response.ok) throw new Error('Failed to fetch sub-tags');
                    const data = await response.json();
                    setAllSubTags(data);
                } catch (err) {
                    console.error("Failed to fetch sub-tags:", err);
                    setError("Could not load existing sub-tags. You can still enter a new one.");
                    setAllSubTags([]);
                } finally {
                    setIsSubTagLoading(false);
                }
            } else {
                setAllSubTags([]);
            }
        };
        fetchSubTags();
    }, [activeTab, formData.tag]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) setShowSuggestions(false);
            if (stakeholderRef.current && !stakeholderRef.current.contains(event.target)) {
                setShowStakeholderOptions(false);
                setStakeholderSearchTerm('');
            }
            if (categorySuggestionsRef.current && !categorySuggestionsRef.current.contains(event.target)) setShowCategorySuggestions(false);
            if (subCategorySuggestionsRef.current && !subCategorySuggestionsRef.current.contains(event.target)) setShowSubCategorySuggestions(false);
            if (termSuggestionsRef.current && !termSuggestionsRef.current.contains(event.target)) setShowTermSuggestions(false);
            if (tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(event.target)) setShowTagSuggestions(false);
            if (subTagSuggestionsRef.current && !subTagSuggestionsRef.current.contains(event.target)) setShowSubTagSuggestions(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Validation
    const validateForms = () => {
        const allErrors = {};
        let firstErrorTab = null;

        const isTabDirty = (tabKey) => {
            if (tabKey === 'domain') {
                const data = formData.domain;
                return data.name?.trim() || data.description?.trim() || data.owner || data.status || data.stakeholder?.length > 0;
            } else {
                return formData[tabKey] && formData[tabKey].length > 0;
            }
        };

        const isAnythingEntered = tabs.some(tab => isTabDirty(tab.toLowerCase().replace('-', '')));

        if (!isAnythingEntered) {
            setSaveError("Nothing to save. Please fill out at least one form tab.");
            setErrors({});
            setErrorTabs({});
            return false;
        }

        // Validate domain
        if (isTabDirty('domain')) {
            const tabErrors = {};
            const data = formData.domain;

            if (!data.name?.trim()) tabErrors.name = 'Name is required.';
            if (!data.description?.trim()) tabErrors.description = 'Description is required.';
            if (!data.stakeholder || data.stakeholder.length === 0) tabErrors.stakeholder = 'At least one stakeholder is required.';
            if (!data.owner) tabErrors.owner = 'Owner must be selected.';
            if (!data.status) tabErrors.status = 'Status must be selected.';

            if (Object.keys(tabErrors).length > 0) {
                allErrors.domain = tabErrors;
                if (!firstErrorTab) firstErrorTab = 'Domain';
            }
        }

        // Validate other tabs
        for (const tab of tabs.slice(1)) {
            const tabKey = tab.toLowerCase().replace('-', '');
            const data = formData[tabKey];

            if (data && data.length > 0) {
                const tabErrors = {};

                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    const itemErrors = {};

                    if (!item.name?.trim()) itemErrors.name = 'Name is required.';
                    if (!item.desc?.trim()) itemErrors.desc = 'Description is required.';
                    if (!item.owner) itemErrors.owner = 'Owner must be selected.';
                    if (!item.status) itemErrors.status = 'Status must be selected.';

                    if (Object.keys(itemErrors).length > 0) {
                        tabErrors[i] = itemErrors;
                    }
                }

                if (Object.keys(tabErrors).length > 0) {
                    allErrors[tabKey] = tabErrors;
                    if (!firstErrorTab) firstErrorTab = tab;
                }
            }
        }

        const newErrorTabs = Object.keys(allErrors).reduce((acc, key) => {
            acc[key.replace('_', '')] = true;
            return acc;
        }, {});
        setErrorTabs(newErrorTabs);

        if (firstErrorTab) {
            setActiveTab(firstErrorTab);
            setErrors(allErrors[firstErrorTab.toLowerCase().replace('-', '')]);
            setSaveError(null);
            return false;
        }

        setErrors({});
        setSaveError(null);
        return true;
    };

    const handleSave = async () => {
        if (!validateForms()) return;

        setIsSaving(true);
        setSaveError(null);

        const transformLevel = (level, data, parentData = {}) => {
            const ownerAsArray = data.owner ? [data.owner] : [];
            const creatorArray = decodedToken?.resource_access?.darch?.roles || [];

            const standardObject = {
                name: data.name,
                description: data.desc || data.description || '',
                status: data.status,
                owner: ownerAsArray,
                creator: creatorArray
            };

            const finalObject = {
                ...parentData,
                standard: standardObject
            };

            if (level === 'domain') {
                finalObject.stakeholder = data.stakeholder || [];
            }

            return finalObject;
        };

        const payload = {};

        // Transform domain
        if (formData.domain.name && formData.domain.status) {
            payload.domain = [transformLevel('domain', formData.domain, { domain_id: formData.domain.id })];
        }

        // Transform categories
        if (formData.category.length > 0) {
            const domainIdForPayload = formData.domain.id;
            payload.category = formData.category
                .filter(cat => cat.name && cat.status)
                .map(cat => transformLevel('category', cat, { domain_id: domainIdForPayload }));
        }

        if (formData.subcategory.length > 0) {
            payload.subcategory = formData.subcategory
                .filter(subcat => subcat.name && subcat.status && subcat.category_name)
                .map(subcat => transformLevel('subcategory', subcat, {
                    category_name: subcat.category_name
                }));
        }

        // Transform terms
        if (formData.term.length > 0) {
            payload.term = formData.term
                .filter(term => term.name && term.status)
                .map(term => transformLevel('term', term));
        }

        // Transform tags
        if (formData.tag.length > 0) {
            payload.tag = formData.tag
                .filter(tag => tag.name && tag.status)
                .map(tag => transformLevel('tag', tag));
        }

        if (formData.subtag.length > 0) {
            payload.subtag = formData.subtag
                .filter(subtag => subtag.name && subtag.status && subtag.tag_name)
                .map(subtag => transformLevel('subtag', subtag, {
                    tag_name: subtag.tag_name
                }));
        }

        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/add_new_entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'An unexpected error occurred.' }));
                throw new Error(errorData.detail || `Server responded with status: ${response.status}`);
            }

            if (onAddComplete) {
                onAddComplete();
            } else {
                toast.success('Catalogue added successfully!');
                onClose();
            }
        } catch (err) {
            console.error("Failed to save catalogue:", err);
            setSaveError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const isLastItemIncomplete = (tabKey) => {
        const items = formData[tabKey];
        if (items.length === 0) return false;

        const lastItem = items[items.length - 1];
        if (!lastItem.name?.trim() || !lastItem.desc?.trim() || !lastItem.owner || !lastItem.status) {
            return true;
        }

        if (tabKey === 'subcategory' && !lastItem.category_name) return true;
        if (tabKey === 'subtag' && !lastItem.tag_name) return true;

        return false;
    };

    const addNewItem = (tabKey) => {
        const newItem = { id: `new_${Date.now()}`, name: '', desc: '', owner: '', status: '' };

        if (tabKey === 'subcategory') {
            newItem.category_name = null;
        }
        if (tabKey === 'subtag') {
            newItem.tag_name = null;
        }

        setFormData(prev => ({
            ...prev,
            [tabKey]: [...prev[tabKey], newItem]
        }));
        setActiveItemIndex(formData[tabKey].length);
    };


    const removeItem = (tabKey, index) => {
        setFormData(prev => ({
            ...prev,
            [tabKey]: prev[tabKey].filter((_, i) => i !== index)
        }));
        if (activeItemIndex >= formData[tabKey].length - 1) {
            setActiveItemIndex(Math.max(0, formData[tabKey].length - 2));
        }
    };

    const updateItem = (tabKey, index, field, value) => {
        setFormData(prev => ({
            ...prev,
            [tabKey]: prev[tabKey].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));

        if (errors[index] && errors[index][field]) {
            setErrors(prev => ({
                ...prev,
                [index]: { ...prev[index], [field]: undefined }
            }));
        }
    };

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setActiveItemIndex(0);
        setError(null);
        setErrors({});
        setSaveError(null);
    };

    const handleNext = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            handleTabChange(tabs[currentIndex + 1]);
        }
    };

    const handlePrevious = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            handleTabChange(tabs[currentIndex - 1]);
        }
    };

    const handleDomainNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            domain: { ...prev.domain, id: null, name: value }
        }));

        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));

        if (value) {
            const filtered = allDomains.filter(d => d.name.toLowerCase().includes(value.toLowerCase()));
            setDomainSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (domain) => {
        setFormData(prev => ({
            ...prev,
            domain: {
                ...prev.domain,
                id: domain.domain_id,
                name: domain.name,
            }
        }));
        setShowSuggestions(false);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            domain: { ...prev.domain, [field]: value }
        }));
        if (errors[field]) {
            setErrors(prevErrors => ({ ...prevErrors, [field]: undefined }));
        }
        if (saveError) {
            setSaveError(null);
        }
    };

    const handleStakeholderSelect = (username) => {
        if (!formData.domain.stakeholder.includes(username)) {
            const updated = [...formData.domain.stakeholder, username];
            handleInputChange('stakeholder', updated);
        }
        setStakeholderSearchTerm('');
        setShowStakeholderOptions(false);
    };

    const handleStakeholderRemove = (username) => {
        const updated = formData.domain.stakeholder.filter(s => s !== username);
        handleInputChange('stakeholder', updated);
    };

    const filteredStakeholders = stakeholders
        .filter(user => !formData.domain.stakeholder.includes(user.username))
        .filter(user => user.username.toLowerCase().includes(stakeholderSearchTerm.toLowerCase()));

    const createSuggestionHandlers = (tabKey, allDataKey, suggestionsKey, showSuggestionsKey, setShowSuggestionsFunc, setSuggestionsFunc) => {
        const handleNameChange = (e, index) => {
            const value = e.target.value;
            updateItem(tabKey, index, 'name', value);
            updateItem(tabKey, index, 'id', null);

            if (value && window[allDataKey] && window[allDataKey].length > 0) {
                const filtered = window[allDataKey].filter(item =>
                    item.name.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestionsFunc(filtered);
                setShowSuggestionsFunc(true);
            } else {
                setShowSuggestionsFunc(false);
            }
        };

        const handleSuggestionClick = (item, index, idField) => {
            updateItem(tabKey, index, 'id', item[idField]);
            updateItem(tabKey, index, 'name', item.name);
            setShowSuggestionsFunc(false);
        };

        return { handleNameChange, handleSuggestionClick };
    };

    const ParentHierarchy = ({ data }) => {
        const MAX_DISPLAY_ITEMS = 2;
        const formatValue = (value) => {
            if (!Array.isArray(value)) {
                return value || '';
            }
            if (value.length > MAX_DISPLAY_ITEMS) {
                return `${value.slice(0, MAX_DISPLAY_ITEMS).join(', ')}, ...`;
            }
            return value.join(', ');
        };

        const getTooltip = (value) => {
            if (Array.isArray(value) && value.length > MAX_DISPLAY_ITEMS) {
                return value.join(', ');
            }
            return '';
        };

        return (
            <div className="flex flex-wrap items-center gap-6 mb-6">
                {Object.entries(data)
                    .filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : value))
                    .map(([key, value]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-500 mb-1 capitalize">{key.replace('_', ' ')}</label>
                            <input
                                type="text"
                                disabled
                                value={formatValue(value)}
                                title={getTooltip(value)}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    ))}
            </div>
        );
    };


    const handleMultiItemNameChange = (e, index, tabKey, allItems, setSuggestions, showSuggestions) => {
        const value = e.target.value;
        updateItem(tabKey, index, 'name', value);
        updateItem(tabKey, index, 'id', null);

        if (value && allItems.length > 0) {
            const filtered = allItems.filter(item =>
                item.name.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            showSuggestions(true);
        } else {
            showSuggestions(false);
        }
    };

    const handleMultiItemSuggestionClick = (item, index, tabKey, idField, showSuggestions) => {
        updateItem(tabKey, index, 'id', item[idField]);
        updateItem(tabKey, index, 'name', item.name);
        showSuggestions(false);
    };

    // Render form content
    const renderFormContent = () => {
        if (activeTab === 'Domain') {
            return (
                <div className="space-y-6 py-8">
                    {error && <div className="text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative" ref={suggestionsRef}>
                            <label htmlFor="domain-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                id="domain-name"
                                type="text"
                                placeholder="Enter or select domain name"
                                value={formData.domain.name}
                                onChange={handleDomainNameChange}
                                onFocus={() => setShowSuggestions(true)}
                                autoComplete="off"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {isLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                            {showSuggestions && domainSuggestions.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                    {domainSuggestions.map((domain) => (
                                        <li key={domain.domain_id} className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSuggestionClick(domain)}>
                                            {domain.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label htmlFor="domain-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                id="domain-description"
                                type="text"
                                placeholder="Description"
                                value={formData.domain.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                autoComplete="off"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="domain-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                            <select
                                id="domain-owner"
                                value={formData.domain.owner}
                                onChange={(e) => handleInputChange('owner', e.target.value)}
                                className={`w-full px-3 py-2 border bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors.owner ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">{isOwnersLoading ? 'Loading...' : 'Select'}</option>
                                {owners.map(owner => (
                                    <option key={owner} value={owner}>{owner}</option>
                                ))}
                            </select>
                            {errors.owner && <p className="text-red-600 text-xs mt-1">{errors.owner}</p>}
                        </div>
                        <div>
                            <label htmlFor="domain-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                id="domain-status"
                                value={formData.domain.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className={`w-full px-3 py-2 border bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Deprecated">Deprecated</option>
                            </select>
                            {errors.status && <p className="text-red-600 text-xs mt-1">{errors.status}</p>}
                        </div>
                    </div>
                    <div className="relative" ref={stakeholderRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder</label>
                        <div
                            onClick={() => setShowStakeholderOptions(prev => !prev)}
                            className={`min-h-[42px] p-2 border bg-white rounded-md focus-within:ring-1 focus-within:ring-[#8e78b7] flex flex-wrap items-center gap-2 cursor-pointer ${errors.stakeholder ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            {isStakeholdersLoading && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
                            {formData.domain.stakeholder.length > 0 ? (
                                formData.domain.stakeholder.map(username => (
                                    <span key={username} className="bg-[#e4dcf5] text-[#584185] text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-2">
                                        {username}
                                        <button
                                            type="button"
                                            title="Close"
                                            onClick={(e) => { e.stopPropagation(); handleStakeholderRemove(username); }}
                                            className="text-[#584185] hover:text-black focus:outline-none"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            ) : (!isStakeholdersLoading && <span className="text-gray-500">Select stakeholders</span>)}
                        </div>
                        {errors.stakeholder && <p className="text-red-600 text-xs mt-1">{errors.stakeholder}</p>}
                        {showStakeholderOptions && (
                            <div className="fixed z-50 mt-1 w-[calc(100%-5rem)] max-w-[53rem]">
                                <ul className="bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto shadow-lg flex flex-col">
                                    <li className="p-2 sticky top-0 bg-white border-b">
                                        <div className="relative">
                                            <Search className="h-4 w-4 absolute top-1/2 left-2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={stakeholderSearchTerm}
                                                onChange={(e) => setStakeholderSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                    </li>
                                    {filteredStakeholders.length > 0 ? (
                                        filteredStakeholders.map((user) => (
                                            <li key={user.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" onClick={() => handleStakeholderSelect(user.username)}>
                                                {user.username}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-3 py-2 text-gray-500 text-sm">
                                            {isStakeholdersLoading ? 'Loading...' : 'No matching stakeholders found.'}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Multi-item tabs
        const tabKey = activeTab.toLowerCase().replace('-', '');
        const items = formData[tabKey] || [];

        const suggestionConfig = {
            category: {
                allItems: allCategories,
                suggestions: categorySuggestions,
                setSuggestions: setCategorySuggestions,
                showSuggestions: showCategorySuggestions,
                setShowSuggestions: setShowCategorySuggestions,
                suggestionsRef: categorySuggestionsRef,
                idField: 'category_id',
                isLoading: isCategoryLoading
            },
            subcategory: {
                allItems: allSubCategories,
                suggestions: subCategorySuggestions,
                setSuggestions: setSubCategorySuggestions,
                showSuggestions: showSubCategorySuggestions,
                setShowSuggestions: setShowSubCategorySuggestions,
                suggestionsRef: subCategorySuggestionsRef,
                idField: 'sub_category_id',
                isLoading: isSubCategoryLoading
            },
            term: {
                allItems: allTerms,
                suggestions: termSuggestions,
                setSuggestions: setTermSuggestions,
                showSuggestions: showTermSuggestions,
                setShowSuggestions: setShowTermSuggestions,
                suggestionsRef: termSuggestionsRef,
                idField: 'term_id',
                isLoading: isTermLoading
            },
            tag: {
                allItems: allTags,
                suggestions: tagSuggestions,
                setSuggestions: setTagSuggestions,
                showSuggestions: showTagSuggestions,
                setShowSuggestions: setShowTagSuggestions,
                suggestionsRef: tagSuggestionsRef,
                idField: 'tag_id',
                isLoading: isTagLoading
            },
            subtag: {
                allItems: allSubTags,
                suggestions: subTagSuggestions,
                setSuggestions: setSubTagSuggestions,
                showSuggestions: showSubTagSuggestions,
                setShowSuggestions: setShowSubTagSuggestions,
                suggestionsRef: subTagSuggestionsRef,
                idField: 'sub_tag_id',
                isLoading: isSubTagLoading
            },
        };

        const currentConfig = suggestionConfig[tabKey];

        const parentRequirements = {
            'Category': () => formData.domain.name,
            'Sub-category': () => formData.domain.name && formData.category.length > 0,
            'Term': () => true,
            'Tag': () => true,
            'Sub-tag': () => formData.tag.length > 0
        };

        if (!parentRequirements[activeTab]()) {
            let message = '';
            if (activeTab === 'Category') message = 'Please select a domain first to add categories.';
            else if (activeTab === 'Sub-category') message = 'Please select a domain and add categories first.';
            else if (activeTab === 'Sub-tag') message = 'Please add tags first to create sub-tags.';

            return (
                <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-md mt-4">
                    <p className="font-medium">{message}</p>
                    <p className="text-sm mt-1">You can skip this and navigate to another tab if not needed.</p>
                </div>
            );
        }

        const parentDataFor = {
            'Category': { domain: formData.domain.name },
            'Sub-category': {
                domain: formData.domain.name,
                category: formData.category.map(cat => cat.name).filter(Boolean)
            },
            'Term': {
                domain: formData.domain.name,
                category: formData.category.map(cat => cat.name).filter(Boolean),
                subcategory: formData.subcategory.map(subcat => subcat.name).filter(Boolean)
            },
            'Tag': {
                domain: formData.domain.name,
                category: formData.category.map(cat => cat.name).filter(Boolean),
                subcategory: formData.subcategory.map(subcat => subcat.name).filter(Boolean),
                term: formData.term.map(term => term.name).filter(Boolean)
            },
            'Sub-tag': {
                domain: formData.domain.name,
                category: formData.category.map(cat => cat.name).filter(Boolean),
                subcategory: formData.subcategory.map(subcat => subcat.name).filter(Boolean),
                term: formData.term.map(term => term.name).filter(Boolean),
                tag: formData.tag.map(t => t.name).filter(Boolean)
            }
        };


        return (
            <div className="space-y-6 py-8">
                {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

                {Object.keys(parentDataFor[activeTab]).length > 0 && (
                    <ParentHierarchy data={parentDataFor[activeTab]} />
                )}

                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        {activeTab} Items ({items.length})
                    </h3>
                    <button
                        type="button"
                        onClick={() => addNewItem(tabKey)}
                        disabled={isLastItemIncomplete(tabKey)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#8e78b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8e78b7] ${isLastItemIncomplete(tabKey)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-[#7a67a0]'
                            }`}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add {activeTab}
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-md">
                        <p className="font-medium">No {activeTab.toLowerCase()} items added yet.</p>
                        <p className="text-sm mt-1">Click "Add {activeTab}" to create your first item.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Item tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-4 overflow-x-auto">
                                {items.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveItemIndex(index)}
                                        className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm focus:outline-none flex items-center ${activeItemIndex === index
                                            ? 'border-[#8e78b7] text-[#8e78b7]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {item.name || `${activeTab} ${index + 1}`}
                                        {errors[index] && (
                                            <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeItem(tabKey, index);
                                                }}
                                                className="ml-2 text-gray-400 hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Current item form */}
                        {items[activeItemIndex] && (
                            <div className="space-y-6">
                              
                                {activeTab === 'Sub-category' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                                        <select
                                            value={items[activeItemIndex].category_name || ''}
                                            onChange={(e) => updateItem(tabKey, activeItemIndex, 'category_name', e.target.value)}
                                            className="w-full px-3 py-2 border bg-white rounded-md"
                                        >
                                            <option value="">Select Category</option>
                                            {formData.category.map((cat) => (
                                                cat.name && <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Tag selection for subtags */}
                                {activeTab === 'Sub-tag' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parent Tag</label>
                                        <select
                                            value={items[activeItemIndex].tag_name || ''}
                                            onChange={(e) => updateItem(tabKey, activeItemIndex, 'tag_name', e.target.value)}
                                            className="w-full px-3 py-2 border bg-white rounded-md"
                                        >
                                            <option value="">Select Tag</option>
                                            {formData.tag.map((tag) => (
                                                tag.name && <option key={tag.id} value={tag.name}>{tag.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="relative" ref={currentConfig?.suggestionsRef}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                placeholder={`Enter ${activeTab.toLowerCase()} name`}
                                                value={items[activeItemIndex].name || ''}
                                                onChange={(e) => handleMultiItemNameChange(e, activeItemIndex, tabKey, currentConfig.allItems, currentConfig.setSuggestions, currentConfig.setShowSuggestions)}
                                                onFocus={() => currentConfig?.setShowSuggestions(true)}
                                                autoComplete="off"
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors[activeItemIndex]?.name ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            {currentConfig?.isLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                            {errors[activeItemIndex]?.name && <p className="text-red-600 text-xs mt-1">{errors[activeItemIndex].name}</p>}

                                            {currentConfig?.showSuggestions && currentConfig?.suggestions.length > 0 && (
                                                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                                    {currentConfig.suggestions.map((item, idx) => (
                                                        <li key={item[currentConfig.idField] || idx} className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleMultiItemSuggestionClick(item, activeItemIndex, tabKey, currentConfig.idField, currentConfig.setShowSuggestions)}>
                                                            {item.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={items[activeItemIndex].desc || ''}
                                            onChange={(e) => updateItem(tabKey, activeItemIndex, 'desc', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors[activeItemIndex]?.desc ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors[activeItemIndex]?.desc && (
                                            <p className="text-red-600 text-xs mt-1">{errors[activeItemIndex].desc}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                        <select
                                            value={items[activeItemIndex].owner || ''}
                                            onChange={(e) => updateItem(tabKey, activeItemIndex, 'owner', e.target.value)}
                                            className={`w-full px-3 py-2 border bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors[activeItemIndex]?.owner ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">{isOwnersLoading ? 'Loading...' : 'Select'}</option>
                                            {owners.map(owner => (
                                                <option key={owner} value={owner}>{owner}</option>
                                            ))}
                                        </select>
                                        {errors[activeItemIndex]?.owner && (
                                            <p className="text-red-600 text-xs mt-1">{errors[activeItemIndex].owner}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={items[activeItemIndex].status || ''}
                                            onChange={(e) => updateItem(tabKey, activeItemIndex, 'status', e.target.value)}
                                            className={`w-full px-3 py-2 border bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] ${errors[activeItemIndex]?.status ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Deprecated">Deprecated</option>
                                        </select>
                                        {errors[activeItemIndex]?.status && (
                                            <p className="text-red-600 text-xs mt-1">{errors[activeItemIndex].status}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const handleModalContentClick = (e) => e.stopPropagation();
    if (!isOpen) return null;

    const currentIndex = tabs.indexOf(activeTab);
    const isLastTab = currentIndex === tabs.length - 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div onClick={handleModalContentClick} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FolderPlus className="h-6 w-6 mr-2 text-[#8e78b7]" />
                        Add catalogue
                    </h2>
                    <button title="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {tabs.map(tab => {
                                const tabKey = tab.toLowerCase().replace('-', '');
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-md focus:outline-none flex items-center ${activeTab === tab
                                            ? 'border-[#8e78b7] text-[#8e78b7]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        {tab}
                                        {errorTabs[tabKey] && (
                                            <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                    {renderFormContent()}
                </div>

                {saveError && (
                    <div className="px-6 pb-4">
                        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm" role="alert">
                            <p><span className="font-semibold">Error:</span> {saveError}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center p-4 bg-gray-50 border-t mt-auto rounded-b-lg">
                    <div>
                        {currentIndex > 0 && (
                            <button type="button" onClick={handlePrevious} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Previous
                            </button>
                        )}
                    </div>
                    <div className="space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save & Exit'}
                        </button>
                        {!isLastTab && (
                            <button type="button" onClick={handleNext} className="px-4 py-2 text-sm font-medium text-white bg-[#8e78b7] border border-transparent rounded-md shadow-sm hover:bg-[#7a67a0]">
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCatalogueModal;
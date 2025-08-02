import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Loader2, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const AddCatalogueModal = ({ isOpen, onClose }) => {
    const { token, decodedToken } = useAuth();
    const [activeTab, setActiveTab] = useState('Domain');
    const initialFormData = {
        domain: { id: null, name: '', description: '', owner: '', stakeholder: [], status: '' },
        category: { id: null, name: '', desc: '', owner: '', status: '' },
        subcategory: { id: null, name: '', desc: '', owner: '', status: '' },
        term: { id: null, name: '', desc: '', owner: '', status: '' },
        tag: { id: null, name: '', desc: '', owner: '', status: '' },
        subtag: { id: null, name: '', desc: '', owner: '', status: '' },
    };

    const [formData, setFormData] = useState(initialFormData);

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

    const tabs = ['Domain', 'Category', 'Sub-category', 'Term', 'Tag', 'Sub-tag'];

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setActiveTab('Domain');
            setError(null);
            setSaveError(null);
            setDomainSuggestions([]);
            setCategorySuggestions([]);
            setSubCategorySuggestions([]);
            setTermSuggestions([]);
            setTagSuggestions([]);
            setSubTagSuggestions([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'Domain') {
            const fetchDomains = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/domain`);
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
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names`);
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

    useEffect(() => {
        const fetchCategories = async () => {
            if (activeTab === 'Category' && formData.domain.id) {
                setIsCategoryLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/category`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({ domain_id: [formData.domain.id] })
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

    useEffect(() => {
        const fetchSubCategories = async () => {
            if (activeTab === 'Sub-category' && formData.domain.id && formData.category.id) {
                setIsSubCategoryLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/sub_category`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({
                            domain_id: [formData.domain.id],
                            category_id: [formData.category.id]
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
    }, [activeTab, formData.domain.id, formData.category.id]);

    useEffect(() => {
        const fetchTerms = async () => {
            if (activeTab === 'Term') {
                setIsTermLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/terms`);
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
            }
        };
        fetchTerms();
    }, [activeTab]);

    useEffect(() => {
        const fetchTags = async () => {
            if (activeTab === 'Tag') {
                setIsTagLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/tag`);
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
            }
        };
        fetchTags();
    }, [activeTab]);

    useEffect(() => {
        const fetchSubTags = async () => {
            if (activeTab === 'Sub-tag' && formData.tag.id) {
                setIsSubTagLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/add/sub_tag`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
                        body: JSON.stringify({ tag_id: [formData.tag.id] })
                    });
                    if (!response.ok) throw new Error('Failed to fetch sub-tags');
                    const data = await response.json();
                    setAllSubTags(data);
                } catch (err) {
                    console.error("Failed to fetch sub-tags:", err);
                    setError("Could not load existing sub-tags for this tag. You can still enter a new one.");
                    setAllSubTags([]);
                } finally {
                    setIsSubTagLoading(false);
                }
            } else {
                setAllSubTags([]);
            }
        };
        fetchSubTags();
    }, [activeTab, formData.tag.id]);

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

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        const transformLevel = (level, data, parentIds = {}) => {
            if (!data.name || !data.status) return null;

            const ownerAsArray = data.owner ? [data.owner] : [];
            const standardData = {
                name: data.name,
                description: data.desc || data.description || '',
                status: data.status,
                owner: ownerAsArray,
            };

            if (level === 'domain') {
                standardData.stakeholder = data.stakeholder || [];
            }

            const validParentIds = Object.entries(parentIds).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            return { ...validParentIds, standard: standardData };
        };

        const payload = {
            domain: transformLevel('domain', formData.domain),
            category: transformLevel('category', formData.category, { domain_id: formData.domain.id }),
            subcategory: transformLevel('subcategory', formData.subcategory, {
                domain_id: formData.domain.id,
                category_id: formData.category.id
            }),
            term: transformLevel('term', formData.term),
            tag: transformLevel('tag', formData.tag),
            subtag: transformLevel('subtag', formData.subtag, { tag_id: formData.tag.id })
        };

        const finalPayload = Object.entries(payload).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        }, {});

        if (Object.keys(finalPayload).length === 0) {
            setSaveError("Nothing to save. Please fill out at least one form tab.");
            setIsSaving(false);
            return;
        }

        console.log('Final Payload to be Sent:', JSON.stringify(finalPayload, null, 2));

        try {
            const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/add_new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'An unexpected error occurred while saving.' }));
                throw new Error(errorData.detail || `Server responded with status: ${response.status}`);
            }

            console.log('Catalogue saved successfully');
            onClose(); // Close the modal on success

        } catch (err) {
            console.error("Failed to save catalogue:", err);
            setSaveError(err.message); // Set the error message to be displayed
        } finally {
            setIsSaving(false); // Stop the loading indicator
        }
    };

    const handleNext = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
        setError(null);
        setSaveError(null); // Clear errors on tab navigation
    };

    const handlePrevious = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
        setError(null);
        setSaveError(null); // Clear errors on tab navigation
    };

    // --- All other handlers (handleModalContentClick, handle...NameChange, handle...SuggestionClick, etc.) remain unchanged ---
    const handleModalContentClick = (e) => e.stopPropagation();

    const handleDomainNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, domain: { id: null, name: value, description: '', owner: '', stakeholder: [], status: '' } }));

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

    const handleCategoryNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, category: { id: null, name: value, desc: '', owner: '', status: '' } }));

        if (value && allCategories.length > 0) {
            const filtered = allCategories.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
            setCategorySuggestions(filtered);
            setShowCategorySuggestions(true);
        } else {
            setShowCategorySuggestions(false);
        }
    };

    const handleCategorySuggestionClick = (category) => {
        setFormData(prev => ({
            ...prev,
            category: {
                ...prev.category,
                id: category.category_id,
                name: category.name,
            }
        }));
        setShowCategorySuggestions(false);
    };

    const handleSubCategoryNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, subcategory: { id: null, name: value, desc: '', owner: '', status: '' } }));

        if (value && allSubCategories.length > 0) {
            const filtered = allSubCategories.filter(sc => sc.name.toLowerCase().includes(value.toLowerCase()));
            setSubCategorySuggestions(filtered);
            setShowSubCategorySuggestions(true);
        } else {
            setShowSubCategorySuggestions(false);
        }
    };

    const handleSubCategorySuggestionClick = (subcategory) => {
        setFormData(prev => ({
            ...prev,
            subcategory: {
                ...prev.subcategory,
                id: subcategory.sub_category_id,
                name: subcategory.name,
            }
        }));
        setShowSubCategorySuggestions(false);
    };

    const handleTermNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, term: { id: null, name: value, desc: '', owner: '', status: '' } }));
        if (value && allTerms.length > 0) {
            const filtered = allTerms.filter(t => t.name.toLowerCase().includes(value.toLowerCase()));
            setTermSuggestions(filtered);
            setShowTermSuggestions(true);
        } else {
            setShowTermSuggestions(false);
        }
    };

    const handleTermSuggestionClick = (term) => {
        setFormData(prev => ({
            ...prev,
            term: {
                ...prev.term,
                id: term.term_id,
                name: term.name,
            }
        }));
        setShowTermSuggestions(false);
    };

    const handleTagNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, tag: { id: null, name: value, desc: '', owner: '', status: '' } }));
        if (value && allTags.length > 0) {
            const filtered = allTags.filter(t => t.name.toLowerCase().includes(value.toLowerCase()));
            setTagSuggestions(filtered);
            setShowTagSuggestions(true);
        } else {
            setShowTagSuggestions(false);
        }
    };

    const handleTagSuggestionClick = (tag) => {
        setFormData(prev => ({
            ...prev,
            tag: {
                ...prev.tag,
                id: tag.tag_id,
                name: tag.name,
            }
        }));
        setShowTagSuggestions(false);
    };

    const handleSubTagNameChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, subtag: { id: null, name: value, desc: '', owner: '', status: '' } }));
        if (value && allSubTags.length > 0) {
            const filtered = allSubTags.filter(st => st.name.toLowerCase().includes(value.toLowerCase()));
            setSubTagSuggestions(filtered);
            setShowSubTagSuggestions(true);
        } else {
            setShowSubTagSuggestions(false);
        }
    };

    const handleSubTagSuggestionClick = (subtag) => {
        setFormData(prev => ({
            ...prev,
            subtag: {
                ...prev.subtag,
                id: subtag.sub_tag_id,
                name: subtag.name,
            }
        }));
        setShowSubTagSuggestions(false);
    };


    const handleInputChange = (tab, field, value) => {
        const tabKey = tab.toLowerCase().replace('-', '');
        setFormData(prev => ({
            ...prev,
            [tabKey]: { ...prev[tabKey], [field]: value }
        }));
    };

    const handleStakeholderSelect = (username) => {
        if (!formData.domain.stakeholder.includes(username)) {
            const updated = [...formData.domain.stakeholder, username];
            handleInputChange('Domain', 'stakeholder', updated);
        }
        setStakeholderSearchTerm('');
        setShowStakeholderOptions(false);
    };

    const handleStakeholderRemove = (username) => {
        const updated = formData.domain.stakeholder.filter(s => s !== username);
        handleInputChange('Domain', 'stakeholder', updated);
    };

    const filteredStakeholders = stakeholders
        .filter(user => !formData.domain.stakeholder.includes(user.username))
        .filter(user =>
            user.username.toLowerCase().includes(stakeholderSearchTerm.toLowerCase())
        );

    // --- renderFormContent, ParentHierarchy, and other rendering logic remain unchanged ---
    const ParentHierarchy = ({ data }) => (
        <div className="flex flex-wrap items-center gap-6 mb-6">
            {Object.entries(data).filter(([_, value]) => value).map(([key, value]) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-gray-500 mb-1 capitalize">{key}</label>
                    <input type="text" disabled value={value} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                </div>
            ))}
        </div>
    );

    const renderFormContent = () => {

        const PlaceholderMessage = ({ children }) => (
            <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-md mt-4">
                <p className="font-medium">{children}</p>
                <p className="text-sm mt-1">You can skip this and navigate to another tab if not needed.</p>
            </div>
        );

        const parentDataFor = {
            'Category': { domain: formData.domain.name },
            'Sub-category': { domain: formData.domain.name, category: formData.category.name },
            'Term': { domain: formData.domain.name, category: formData.category.name, subcategory: formData.subcategory.name },
            'Tag': { domain: formData.domain.name, category: formData.category.name, subcategory: formData.subcategory.name, term: formData.term.name },
            'Sub-tag': { domain: formData.domain.name, category: formData.category.name, subcategory: formData.subcategory.name, term: formData.term.name, tag: formData.tag.name },
        };

        switch (activeTab) {
            case 'Domain':
                return (
                    <div className="space-y-6 py-8">
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={suggestionsRef}>
                                <label htmlFor="domain-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="domain-name"
                                    placeholder="Enter or select domain name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.domain.name}
                                    onChange={handleDomainNameChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    autoComplete="off"
                                />
                                {isLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                {showSuggestions && domainSuggestions.length > 0 && (
                                    <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {domainSuggestions.map((domain) => (
                                            <li
                                                key={domain.domain_id}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSuggestionClick(domain)}
                                            >
                                                {domain.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label htmlFor="domain-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" id="domain-description" placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.domain.description}
                                    onChange={(e) => handleInputChange('Domain', 'description', e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="domain-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                <select id="domain-owner" className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.domain.owner}
                                    onChange={(e) => handleInputChange('Domain', 'owner', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="domain-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select id="domain-status" className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.domain.status}
                                    onChange={(e) => handleInputChange('Domain', 'status', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                        </div>
                        <div className="relative" ref={stakeholderRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder</label>
                            <div
                                className="min-h-[42px] p-2 border border-gray-300 bg-white rounded-md focus-within:ring-1 focus-within:ring-[#8e78b7] focus-within:border-[#8e78b7] flex flex-wrap items-center gap-2 cursor-pointer"
                                onClick={() => setShowStakeholderOptions(prev => !prev)}
                            >
                                {isStakeholdersLoading && <Loader2 className="animate-spin h-4 w-4 text-gray-400 absolute right-2" />}
                                {formData.domain.stakeholder.length > 0 ? (
                                    formData.domain.stakeholder.map(username => (
                                        <span key={username} className="bg-[#e4dcf5] text-[#584185] text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-2">
                                            {username}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleStakeholderRemove(username); }}
                                                className="text-[#584185] hover:text-black focus:outline-none"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    !isStakeholdersLoading && <span className="text-gray-500">Select stakeholders</span>
                                )}
                            </div>

                            {showStakeholderOptions && (
                                <div className="fixed z-50 mt-1 w-[calc(100%-5rem)] max-w-[53rem]">
                                    <ul className="bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto shadow-lg flex flex-col">
                                        <li className="p-2 sticky top-0 bg-white border-b">
                                            <div className="relative">
                                                <Search className="h-4 w-4 absolute top-1/2 left-2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md"
                                                    value={stakeholderSearchTerm}
                                                    onChange={(e) => setStakeholderSearchTerm(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </li>

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
                                                {isStakeholdersLoading ? 'Loading...' : 'No matching stakeholders found.'}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'Category':
                if (!formData.domain.name) {
                    return <PlaceholderMessage>Please select a Domain first to add a Category.</PlaceholderMessage>;
                }
                return (
                    <div className="space-y-6 py-8">
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
                        <ParentHierarchy data={parentDataFor[activeTab]} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={categorySuggestionsRef}>
                                <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="category-name"
                                    placeholder="Enter or select category"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.category.name}
                                    onChange={handleCategoryNameChange}
                                    onFocus={() => { if (allCategories.length > 0) setShowCategorySuggestions(true); }}
                                    autoComplete="off"
                                    disabled={!formData.domain.name}
                                />
                                {isCategoryLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                {showCategorySuggestions && categorySuggestions.length > 0 && (
                                    <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {categorySuggestions.map((cat) => (
                                            <li
                                                key={cat.category_id}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleCategorySuggestionClick(cat)}
                                            >
                                                {cat.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label htmlFor="category-desc" className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                                <input
                                    type="text"
                                    id="category-desc"
                                    placeholder="Description"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.category.desc}
                                    onChange={(e) => handleInputChange('Category', 'desc', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="category-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                <select
                                    id="category-owner"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.category.owner}
                                    onChange={(e) => handleInputChange('Category', 'owner', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="category-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    id="category-status"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.category.status}
                                    onChange={(e) => handleInputChange('Category', 'status', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'Sub-category':
                if (!formData.category.name) {
                    return <PlaceholderMessage>Please select a Category first to add a Sub-category.</PlaceholderMessage>;
                }
                return (
                    <div className="space-y-6 py-8">
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
                        <ParentHierarchy data={parentDataFor[activeTab]} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={subCategorySuggestionsRef}>
                                <label htmlFor="subcategory-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="subcategory-name"
                                    placeholder="Enter or select sub-category"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subcategory.name}
                                    onChange={handleSubCategoryNameChange}
                                    onFocus={() => { if (allSubCategories.length > 0) setShowSubCategorySuggestions(true); }}
                                    autoComplete="off"
                                    disabled={!formData.category.name}
                                />
                                {isSubCategoryLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                {showSubCategorySuggestions && subCategorySuggestions.length > 0 && (
                                    <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {subCategorySuggestions.map((sc) => (
                                            <li
                                                key={sc.sub_category_id}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSubCategorySuggestionClick(sc)}
                                            >
                                                {sc.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label htmlFor="subcategory-desc" className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                                <input
                                    type="text"
                                    id="subcategory-desc"
                                    placeholder="Description"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subcategory.desc}
                                    onChange={(e) => handleInputChange('Sub-category', 'desc', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="subcategory-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                <select
                                    id="subcategory-owner"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subcategory.owner}
                                    onChange={(e) => handleInputChange('Sub-category', 'owner', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subcategory-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    id="subcategory-status"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subcategory.status}
                                    onChange={(e) => handleInputChange('Sub-category', 'status', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'Term':
                return (
                    <>
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mt-6">{error}</div>}
                        <div className="space-y-6 pb-8 pt-4">
                            <ParentHierarchy data={parentDataFor[activeTab]} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative" ref={termSuggestionsRef}>
                                    <label htmlFor="term-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        id="term-name"
                                        placeholder="Enter or select term"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.term.name}
                                        onChange={handleTermNameChange}
                                        onFocus={() => { if (allTerms.length > 0) setShowTermSuggestions(true); }}
                                        autoComplete="off"
                                    />
                                    {isTermLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                    {showTermSuggestions && termSuggestions.length > 0 && (
                                        <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {termSuggestions.map((term) => (
                                                <li
                                                    key={term.term_id}
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleTermSuggestionClick(term)}
                                                >
                                                    {term.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="term-desc" className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                                    <input
                                        type="text"
                                        id="term-desc"
                                        placeholder="Description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.term.desc}
                                        onChange={(e) => handleInputChange('Term', 'desc', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="term-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                    <select
                                        id="term-owner"
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.term.owner}
                                        onChange={(e) => handleInputChange('Term', 'owner', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="term-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        id="term-status"
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.term.status}
                                        onChange={(e) => handleInputChange('Term', 'status', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Deprecated">Deprecated</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 'Tag':
                return (
                    <>
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mt-6">{error}</div>}
                        <div className="space-y-6 pb-8 pt-4">
                            {error && <div className="text-red-600 bg-red-100 p-3 rounded-md ">{error}</div>}
                            <ParentHierarchy data={parentDataFor[activeTab]} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative" ref={tagSuggestionsRef}>
                                    <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        id="tag-name"
                                        placeholder="Enter or select tag"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.tag.name}
                                        onChange={handleTagNameChange}
                                        onFocus={() => { if (allTags.length > 0) setShowTagSuggestions(true); }}
                                        autoComplete="off"
                                    />
                                    {isTagLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                    {showTagSuggestions && tagSuggestions.length > 0 && (
                                        <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {tagSuggestions.map((tag) => (
                                                <li
                                                    key={tag.tag_id}
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleTagSuggestionClick(tag)}
                                                >
                                                    {tag.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="tag-desc" className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                                    <input
                                        type="text"
                                        id="tag-desc"
                                        placeholder="Description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.tag.desc}
                                        onChange={(e) => handleInputChange('Tag', 'desc', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="tag-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                    <select
                                        id="tag-owner"
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.tag.owner}
                                        onChange={(e) => handleInputChange('Tag', 'owner', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="tag-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        id="tag-status"
                                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                        value={formData.tag.status}
                                        onChange={(e) => handleInputChange('Tag', 'status', e.target.value)}
                                    >
                                        <option value="">Select</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Deprecated">Deprecated</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case 'Sub-tag':
                if (!formData.tag.name) {
                    return <PlaceholderMessage>Please select a Tag first to add a Sub-tag.</PlaceholderMessage>;
                }
                return (
                    <div className="space-y-6 pb-8 pt-4">
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</div>}
                        <ParentHierarchy data={parentDataFor[activeTab]} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={subTagSuggestionsRef}>
                                <label htmlFor="subtag-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="subtag-name"
                                    placeholder="Enter or select sub-tag"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subtag.name}
                                    onChange={handleSubTagNameChange}
                                    onFocus={() => { if (allSubTags.length > 0) setShowSubTagSuggestions(true); }}
                                    autoComplete="off"
                                    disabled={!formData.tag.name}
                                />
                                {isSubTagLoading && <Loader2 className="animate-spin h-5 w-5 text-gray-500 absolute right-2 top-9" />}
                                {showSubTagSuggestions && subTagSuggestions.length > 0 && (
                                    <ul className="fixed z-50 w-[26rem] bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {subTagSuggestions.map((st) => (
                                            <li
                                                key={st.sub_tag_id}
                                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSubTagSuggestionClick(st)}
                                            >
                                                {st.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label htmlFor="subtag-desc" className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                                <input
                                    type="text"
                                    id="subtag-desc"
                                    placeholder="Description"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subtag.desc}
                                    onChange={(e) => handleInputChange('Sub-tag', 'desc', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="subtag-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                <select
                                    id="subtag-owner"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subtag.owner}
                                    onChange={(e) => handleInputChange('Sub-tag', 'owner', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subtag-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    id="subtag-status"
                                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                    value={formData.subtag.status}
                                    onChange={(e) => handleInputChange('Sub-tag', 'status', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="mt-6 text-center text-gray-500 py-10">Select a tab to begin.</div>;
        }
    };

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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-20 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-md focus:outline-none ${activeTab === tab
                                        ? 'border-[#8e78b7] text-[#8e78b7]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
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
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
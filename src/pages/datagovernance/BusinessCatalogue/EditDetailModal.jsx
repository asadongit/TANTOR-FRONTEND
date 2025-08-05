
import { Search, Loader2, X, Pencil} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';


const RowEditStepperModal = ({ isOpen, onClose, rowData, onSaveSuccess }) => {
    const [activeTab, setActiveTab] = useState('');
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false); 

    const [stakeholders, setStakeholders] = useState([]);
    const [isStakeholdersLoading, setIsStakeholdersLoading] = useState(false);
    const [stakeholderError, setStakeholderError] = useState(null);
    const [showStakeholderOptions, setShowStakeholderOptions] = useState(false);
    const [stakeholderSearchTerm, setStakeholderSearchTerm] = useState('');
    const stakeholderRef = useRef(null);


    const availableTabs = useMemo(() => {
        if (!rowData) return [];
        const tabs = [];
        if (rowData.domain && rowData.domain !== '-') tabs.push('Domain');
        if (rowData.category?.id) tabs.push('Category');
        if (rowData.subcategory?.id) tabs.push('Sub-category');
        if (rowData.term?.id) tabs.push('Term');
        if (rowData.tag?.id) tabs.push('Tag');
        if (rowData.subtag?.id) tabs.push('Sub-tag');
        return tabs;
    }, [rowData]);

    useEffect(() => {
        if (!rowData || availableTabs.length === 0) return;

        const fetchAndPrefillData = async () => {
            const initialData = {
                domain: { name: rowData.domain, description: '', owner: '', status: '', stakeholder: [] },
                category: { name: rowData.category?.name || '', desc: '', owner: '', status: '' },
                subcategory: { name: rowData.subcategory?.name || '', desc: '', owner: '', status: '' },
                term: { name: rowData.term?.name || '', desc: '', owner: '', status: '' },
                tag: { name: rowData.tag?.name || '', desc: '', owner: '', status: '' },
                subtag: { name: rowData.subtag?.name || '', desc: '', owner: '', status: '' },
            };

            try {
                const ids = rowData.rowId.split('-');
                const [domainId, , categoryId, subCategoryId, termId, tagId, subTagId] = ids;
                
                const payload = {};
                if (domainId && domainId !== 'null') payload.domain_id = [parseInt(domainId)];
                if (categoryId && categoryId !== 'null') payload.category_id = [parseInt(categoryId)];
                if (subCategoryId && subCategoryId !== 'null') payload.sub_category_id = [parseInt(subCategoryId)];
                if (termId && termId !== 'null') payload.term_id = [parseInt(termId)];
                if (tagId && tagId !== 'null') payload.tag_id = [parseInt(tagId)];
                if (subTagId && subTagId !== 'null') payload.sub_tag_id = [parseInt(subTagId)];

                if (Object.keys(payload).length === 0) {
                    throw new Error("No valid IDs to prefill.");
                }

                const response = await fetch(`${window._env_?.VITE_FAST_API}/business_catalogue/data_prefill`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.statusText}`);
                }

                const prefillData = await response.json();

                const domainData = prefillData.domain?.[0];
                const categoryData = prefillData.category?.[0];
                const subCategoryData = prefillData.sub_category?.[0];
                const termData = prefillData.term?.[0];
                const tagData = prefillData.tag?.[0];
                const subTagData = prefillData.sub_tag?.[0];

                const updatedFormData = {
                    domain: {
                        name: rowData.domain,
                        description: domainData?.description || '',
                        owner: domainData?.owner?.[0] || '',
                        status: domainData?.status || '',
                        stakeholder: domainData?.stakeholder || [],
                    },
                    category: {
                        name: rowData.category?.name,
                        desc: categoryData?.description || '',
                        owner: categoryData?.owner?.[0] || '',
                        status: categoryData?.status || '',
                    },
                    subcategory: {
                        name: rowData.subcategory?.name,
                        desc: subCategoryData?.description || '',
                        owner: subCategoryData?.owner?.[0] || '',
                        status: subCategoryData?.status || '',
                    },
                    term: {
                        name: rowData.term?.name,
                        desc: termData?.description || '',
                        owner: termData?.owner?.[0] || '',
                        status: termData?.status || '',
                    },
                    tag: {
                        name: rowData.tag?.name,
                        desc: tagData?.description || '',
                        owner: tagData?.owner?.[0] || '',
                        status: tagData?.status || '',
                    },
                    subtag: {
                        name: rowData.subtag?.name,
                        desc: subTagData?.description || '',
                        owner: subTagData?.owner?.[0] || '',
                        status: subTagData?.status || '',
                    },
                };
                
                setFormData(updatedFormData);

            } catch (error) {
                console.error("Failed to prefill form data, using fallback:", error);
                setFormData(initialData);
            } finally {
                setActiveTab(availableTabs[0]);
            }
        };

        fetchAndPrefillData();

    }, [rowData, availableTabs]);

    useEffect(() => {
        if (isOpen && activeTab === 'Domain') {
            const fetchStakeholders = async () => {
                setIsStakeholdersLoading(true);
                setStakeholderError(null);
                try {
                    const response = await fetch(`${window._env_?.VITE_FAST_API}/auth/users/names/stakeholders`);
                    if (!response.ok) throw new Error('Could not fetch stakeholders');
                    const data = await response.json();
                    setStakeholders(data);
                } catch (error) {
                    console.error("Failed to fetch stakeholders:", error);
                    setStakeholderError("Could not load stakeholders list.");
                } finally {
                    setIsStakeholdersLoading(false);
                }
            };
            fetchStakeholders();
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (stakeholderRef.current && !stakeholderRef.current.contains(event.target)) {
                setShowStakeholderOptions(false);
                setStakeholderSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen || !rowData) return null;

    const handleSaveChanges = async () => {
        setIsSaving(true);
        
        try {
            const ids = rowData.rowId.split('-');
            const [domainId, , categoryId, subCategoryId, termId, tagId, subTagId] = ids;

            const payload = {};

            const createStandardPayload = (data, isDomain = false) => ({
                name: data.name,
                description: isDomain ? data.description : data.desc,
                status: data.status,
                owner: data.owner ? [data.owner] : [],
            });

            if (availableTabs.includes('Domain')) {
                payload.domain = {
                    domain_id: parseInt(domainId),
                    stakeholder: formData.domain.stakeholder || [],
                    standard: createStandardPayload(formData.domain, true),
                };
            }
            if (availableTabs.includes('Category')) {
                payload.category = {
                    category_id: parseInt(categoryId),
                    standard: createStandardPayload(formData.category),
                };
            }
            if (availableTabs.includes('Sub-category')) {
                payload.sub_category = {
                    sub_category_id: parseInt(subCategoryId),
                    standard: createStandardPayload(formData.subcategory),
                };
            }
            if (availableTabs.includes('Term')) {
                payload.term = {
                    term_id: parseInt(termId),
                    standard: createStandardPayload(formData.term),
                };
            }
            if (availableTabs.includes('Tag')) {
                payload.tag = {
                    tag_id: parseInt(tagId),
                    standard: createStandardPayload(formData.tag),
                };
            }
            if (availableTabs.includes('Sub-tag')) {
                payload.sub_tag = {
                    sub_tag_id: parseInt(subTagId),
                    standard: createStandardPayload(formData.subtag),
                };
            }
            const response = await fetch(`${window._env_?.VITE_FAST_API}/data_catalogue/edit_element`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.statusText}`);
            }
            if (onSaveSuccess) {
            onSaveSuccess();
        } else {
            toast.success("Changes saved successfully!");
            onClose();
        }

        } catch (error) {
            console.error("Failed to save changes:", error);
            toast.error(`Error saving changes`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (tab, field, value) => {
        const tabKey = tab.toLowerCase().replace('-', '');
        setFormData(prev => ({
            ...prev,
            [tabKey]: { ...prev[tabKey], [field]: value }
        }));
    };

    const handleStakeholderSelect = (username) => {
        const currentStakeholders = formData.domain.stakeholder || [];
        if (!currentStakeholders.includes(username)) {
            const updated = [...currentStakeholders, username];
            handleInputChange('Domain', 'stakeholder', updated);
        }
        setStakeholderSearchTerm('');
        setShowStakeholderOptions(false);
    };

    const handleStakeholderRemove = (username) => {
        const currentStakeholders = formData.domain.stakeholder || [];
        const updated = currentStakeholders.filter(s => s !== username);
        handleInputChange('Domain', 'stakeholder', updated);
    };

    const filteredStakeholders = stakeholders
        .filter(user => !(formData.domain?.stakeholder || []).includes(user.username))
        .filter(user =>
            user.username.toLowerCase().includes(stakeholderSearchTerm.toLowerCase())
        );

    const renderFormContent = () => {
        const tabKey = activeTab.toLowerCase().replace('-', '');
        const currentData = formData[tabKey];

        if (!currentData) {
            return <div className="py-16 text-center text-gray-500">Loading form...</div>;
        }

        if (activeTab === 'Domain') {
             return (
                 <div className="space-y-6 py-8">
                     {stakeholderError && <div className="text-red-600 bg-red-100 p-3 rounded-md">{stakeholderError}</div>}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                             <input type="text" value={currentData.name || ''} onChange={(e) => handleInputChange(activeTab, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                             <input type="text" value={currentData.description || ''} onChange={(e) => handleInputChange(activeTab, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                         </div>
                     </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                             <select value={currentData?.owner?.toLowerCase() || ''} onChange={(e) => handleInputChange(activeTab, 'owner', e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                 <option value="">Select</option><option value="admin">Admin</option>
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select value={currentData.status || ''} onChange={(e) => handleInputChange(activeTab, 'status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                <option value="">Select</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Deprecated">Deprecated</option>
                             </select>
                         </div>
                     </div>
                     <div className="relative" ref={stakeholderRef}>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Stakeholder</label>
                          <div className="min-h-[42px] p-2 border border-gray-300 bg-white rounded-md focus-within:ring-1 focus-within:ring-[#8e78b7] flex flex-wrap items-center gap-2"
                              onClick={() => !isStakeholdersLoading && setShowStakeholderOptions(prev => !prev)}>
                             {isStakeholdersLoading && !stakeholderError && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
                             {(currentData.stakeholder?.length > 0) ? (
                                 currentData.stakeholder.map(username => (
                                     <span key={username} className="bg-[#e4dcf5] text-[#584185] text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-2">
                                         {username}
                                         <button type="button" onClick={(e) => { e.stopPropagation(); handleStakeholderRemove(username); }} className="text-[#584185] hover:text-black">
                                             <X className="h-3 w-3" />
                                         </button>
                                     </span>
                                 ))
                             ) : (
                                !isStakeholdersLoading && <span className="text-gray-500">Select stakeholders</span>
                             )}
                         </div>
                         {showStakeholderOptions && (
                             <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto shadow-lg">
                                 <div className="p-2 sticky top-0 bg-white border-b">
                                     <div className="relative">
                                         <Search className="h-4 w-4 absolute top-1/2 left-2 -translate-y-1/2 text-gray-400" />
                                         <input type="text" placeholder="Search..."
                                             className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md"
                                             value={stakeholderSearchTerm}
                                             onChange={(e) => setStakeholderSearchTerm(e.target.value)}
                                             onClick={(e) => e.stopPropagation()}
                                             autoFocus
                                         />
                                     </div>
                                 </div>
                                 <ul>
                                     {filteredStakeholders.length > 0 ? (
                                         filteredStakeholders.map((user) => (
                                             <li key={user.id}
                                                 className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                                                 onClick={() => handleStakeholderSelect(user.username)}>
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
        
        return (
            <div className="space-y-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" value={currentData.name || ''} onChange={(e) => handleInputChange(activeTab, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input type="text" value={currentData.desc || ''} onChange={(e) => handleInputChange(activeTab, 'desc', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                        <select value={currentData.owner || ''} onChange={(e) => handleInputChange(activeTab, 'owner', e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                           <option value="">Select</option><option value="Admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={currentData.status || ''} onChange={(e) => handleInputChange(activeTab, 'status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                            <option value="">Select</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Deprecated">Deprecated</option>
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-[#8d77ba]">Edit Catalogue </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {availableTabs.map(tab => (
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
                <div className="flex justify-end p-4 bg-gray-50 border-t mt-auto rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isSaving}>
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSaveChanges} 
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


const EditDetailModal = ({ isOpen, onClose, data, onEditComplete }) => {
    const [isStepperOpen, setIsStepperOpen] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState(null);
    
    const tableRows = useMemo(() => {
        if (!data) return [];

        const { domain, category, subcategory, term, tag, subtag } = data;
        const arrays = [category, subcategory, term, tag, subtag];
        const maxLength = Math.max(0, ...arrays.map(arr => (arr ? arr.length : 0)));

        if (maxLength === 0) {
            return [{
                rowId: `${data.id}-empty`,
                domain: domain,
                category: { name: '-', id: null },
                subcategory: { name: '-', id: null },
                term: { name: '-', id: null },
                tag: { name: '-', id: null },
                subtag: { name: '-', id: null },
            }];
        }

        const rows = [];
        for (let i = 0; i < maxLength; i++) {
            const cat = category?.[i] || { name: '-', id: null };
            const subcat = subcategory?.[i] || { name: '-', id: null };
            const trm = term?.[i] || { name: '-', id: null };
            const tg = tag?.[i] || { name: '-', id: null };
            const subtg = subtag?.[i] || { name: '-', id: null };

            const rowId = `${data.id}-${i}-${cat.id}-${subcat.id}-${trm.id}-${tg.id}-${subtg.id}`;

            rows.push({
                rowId,
                domain: domain,
                category: cat,
                subcategory: subcat,
                term: trm,
                tag: tg,
                subtag: subtg,
            });
        }
        return rows;
    }, [data]);
    
    const handleEditClick = (row) => {
        setSelectedRowData(row);
        setIsStepperOpen(true);
    };

    const handleStepperClose = () => {
        setIsStepperOpen(false);
        setSelectedRowData(null);
    };
    
    if (!isOpen || !data) return null;
     const handleSaveSuccess = () => {
        handleStepperClose(); 
        onClose();           
        toast.success('Changes saved successfully!');
        if (onEditComplete) {
            onEditComplete();
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            >
                <div
                    className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl m-4 transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-[#8d77ba]">
                            Edit Catalogue 
                            {/* <span className="font-bold text-[#8d77ba]">{data.domain}</span> */}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-5 max-h-[70vh] overflow-y-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-3 font-semibold">Domain</th>
                                        <th className="p-3 font-semibold">Category</th>
                                        <th className="p-3 font-semibold">Sub-category</th>
                                        <th className="p-3 font-semibold">Term</th>
                                        <th className="p-3 font-semibold">Tag</th>
                                        <th className="p-3 font-semibold">Sub-tag</th>
                                        <th className="p-3 font-semibold text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map((row) => (
                                        <tr key={row.rowId} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-gray-700 font-medium">{row.domain}</td>
                                            <td className="p-3 text-gray-600">{row.category.name}</td>
                                            <td className="p-3 text-gray-600">{row.subcategory.name}</td>
                                            <td className="p-3 text-gray-600">{row.term.name}</td>
                                            <td className="p-3 text-gray-600">{row.tag.name}</td>
                                            <td className="p-3 text-gray-600">{row.subtag.name}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
                                                    title="Edit Item"
                                                    onClick={() => handleEditClick(row)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            
            <RowEditStepperModal 
                isOpen={isStepperOpen}
                onClose={handleStepperClose}
                rowData={selectedRowData}
                onSaveSuccess={handleSaveSuccess}
            />
        </>
    );
};

export default EditDetailModal;
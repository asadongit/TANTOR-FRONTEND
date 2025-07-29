import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

const AddCatalogueModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('Domain');

    if (!isOpen) return null;

    const tabs = ['Domain', 'Category', 'Sub-category', 'Term', 'Tag', 'Sub-tag'];

    const handleNext = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    };
    
    const handlePrevious = () => {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    };

    const handleModalContentClick = (e) => e.stopPropagation();

    // Reusable form component with updated focus colors
    const NewItemForm = ({ idPrefix }) => (
        <div className="space-y-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <select id={`${idPrefix}-name`} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                        <option>Select</option>
                        <option>New Item 1</option>
                    </select>
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-desc`} className="block text-sm font-medium text-gray-700 mb-1">Desc</label>
                    <input type="text" id={`${idPrefix}-desc`} placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]" />
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-owner`} className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <select id={`${idPrefix}-owner`} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                        <option>Select</option>
                        <option>Team Alpha</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3">
                <div>
                    <label htmlFor={`${idPrefix}-status`} className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id={`${idPrefix}-status`} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                        <option>Select</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderFormContent = () => {
        const parentData = {
            domain: 'Oracle_1',
            category: 'Customer Accounts',
            subcategory: 'Billing Information',
            term: 'Account_ID',
            tag: 'PII'
        };

        switch (activeTab) {
            case 'Domain':
                return (
                     <div className="space-y-6 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="domain-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" id="domain-name" placeholder="Name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]" />
                            </div>
                            <div>
                                <label htmlFor="domain-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" id="domain-description" placeholder="Description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]" />
                            </div>
                            <div>
                                <label htmlFor="domain-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                <select id="domain-owner" className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                                    <option>Select</option>
                                    <option>John Doe</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <label htmlFor="domain-stakeholder" className="block text-sm font-medium text-gray-700 mb-1">Stakeholder</label>
                                    <select id="domain-stakeholder" className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                                        <option>Select</option>
                                    </select>
                                </div>
                                <button type="button" className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                                    Add +
                                </button>
                            </div>
                            <div>
                                <label htmlFor="domain-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select id="domain-status" className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]">
                                    <option>Select</option>
                                    <option>Active</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'Category':
                return (
                    <div className="space-y-8 py-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Domain</label>
                            <input type="text" disabled value={parentData.domain} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                        </div>
                        <NewItemForm idPrefix="cat" />
                    </div>
                );
            case 'Sub-category':
                return (
                    <div className="space-y-8 py-8">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Domain</label>
                                <input type="text" disabled value={parentData.domain} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                                <input type="text" disabled value={parentData.category} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <NewItemForm idPrefix="subcat" />
                    </div>
                );
            case 'Term':
                return (
                    <div className="space-y-8 py-8">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Domain</label>
                                <input type="text" disabled value={parentData.domain} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                                <input type="text" disabled value={parentData.category} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Sub-category</label>
                                <input type="text" disabled value={parentData.subcategory} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <NewItemForm idPrefix="term" />
                    </div>
                );
            case 'Tag':
                return (
                    <div className="space-y-8 py-8">
                         <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Domain</label>
                                <input type="text" disabled value={parentData.domain} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                                <input type="text" disabled value={parentData.category} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Sub-category</label>
                                <input type="text" disabled value={parentData.subcategory} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Term</label>
                                <input type="text" disabled value={parentData.term} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <NewItemForm idPrefix="tag" />
                    </div>
                );
            case 'Sub-tag':
                return (
                    <div className="space-y-8 py-8">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Domain</label>
                                <input type="text" disabled value={parentData.domain} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                                <input type="text" disabled value={parentData.category} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Sub-category</label>
                                <input type="text" disabled value={parentData.subcategory} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Term</label>
                                <input type="text" disabled value={parentData.term} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Tag</label>
                                <input type="text" disabled value={parentData.tag} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <NewItemForm idPrefix="subtag" />
                    </div>
                );
            default:
                return <div className="mt-6 text-center text-gray-500 py-10">Content for {activeTab} goes here.</div>;
        }
    };

    const currentIndex = tabs.indexOf(activeTab);
    const isLastTab = currentIndex === tabs.length - 1;

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div onClick={handleModalContentClick} className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FolderPlus className="h-6 w-6 mr-2 text-[#8e78b7]" />
                        Add catalogue
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                                        activeTab === tab
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
                <div className="flex justify-between items-center p-4 bg-gray-50 border-t rounded-b-lg">
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
                        <button type="submit" className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Save
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
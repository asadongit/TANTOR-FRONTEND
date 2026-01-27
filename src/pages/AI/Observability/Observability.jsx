import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Breadcrumb from '../../../components/Breadcrumb';
import GenAi from './Components/GenAi';
import ML from './Components/ML';

function SearchableDropdown({
    label,
    options,
    value,
    onChange,
    disabled,
    displayKey = 'name',
    valueKey = 'id',
    placeholder = 'Select',
    loading
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);

    const filteredOptions = query === ''
        ? options
        : options.filter(opt =>
            (opt[displayKey] || '').toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-56" ref={ref}>
            <button
                type="button"
                className={`relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
            >
                <span className="block truncate">
                    {value ? value[displayKey] : placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="px-3 py-2">
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                            placeholder={`Search ${label}`}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-auto">
                        {loading ? (
                            <div className="px-4 py-2 text-gray-500">Loading...</div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="px-4 py-2 text-gray-500">No {label} found.</div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option[valueKey]}
                                    className={`cursor-pointer select-none py-2 pl-3 pr-4 hover:bg-purple-100 ${value && value[valueKey] === option[valueKey] ? 'bg-purple-50 font-semibold text-purple-900' : 'text-gray-900'}`}
                                    onClick={() => {
                                        onChange(option);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                >
                                    {option[displayKey]}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Observability() {
    const [activeTab, setActiveTab] = useState(0);
    const { token } = useAuth();
    const hostnameAI = window._env_?.VITE_AI_API;
    const [projects, setProjects] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    const tabs = [
      { label: 'ML', key: 'ml' },
      { label: 'GenAI', key: 'genai' }
    ];

    useEffect(() => {
        async function fetchProjects() {
            setLoadingProjects(true);
            try {
                const res = await fetch(`${hostnameAI}/canvas/project_list/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                setProjects(json);
            } catch (e) {
                setProjects([]);
            }
            setLoadingProjects(false);
        }
        fetchProjects();
    }, [hostnameAI, token]);

    useEffect(() => {
        if (!selectedProject) {
            setModels([]);
            setSelectedModel(null);
            return;
        }
        async function fetchModels() {
            setLoadingModels(true);
            try {
                const res = await fetch(
                    `${hostnameAI}/canvas/projects/${selectedProject.name}/models`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const json = await res.json();
                setModels(json.models || []);
            } catch (e) {
                setModels([]);
            }
            setLoadingModels(false);
        }
        fetchModels();
    }, [selectedProject, hostnameAI, token]);

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
            <Breadcrumb />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">Observability</h1>
                <div className="flex gap-3 items-center">
                    <SearchableDropdown
                        label="Project"
                        options={projects}
                        value={selectedProject}
                        onChange={proj => { setSelectedProject(proj); setSelectedModel(null); }}
                        disabled={loadingProjects}
                        displayKey="name"
                        valueKey="id"
                        placeholder="Select Project"
                        loading={loadingProjects}
                    />
                    <SearchableDropdown
                        label="Model"
                        options={models}
                        value={selectedModel}
                        onChange={mdl => setSelectedModel(mdl)}
                        disabled={!selectedProject || loadingModels}
                        displayKey="model_name"
                        valueKey="model_id"
                        placeholder="Select Model"
                        loading={loadingModels}
                    />
                    <button
                        type="button"
                        className="ml-2 px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium border border-gray-300"
                        onClick={() => { setSelectedProject(null); setSelectedModel(null); }}
                        disabled={loadingProjects || loadingModels}
                    >
                        Reset
                    </button>
                </div>
            </div>
            <div className="border-b border-gray-200">
                <nav className="flex">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(idx)}
                            className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === idx
                                    ? 'border-b-2 border-purple-600 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            {activeTab === 0 && (
                <ML project={selectedProject} model={selectedModel} />
            )}
            {activeTab === 1 && <GenAi />}
        </div>
    )
}

export default Observability
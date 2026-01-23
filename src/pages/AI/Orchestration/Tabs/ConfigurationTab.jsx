import { Calendar, Clock, Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import DatePickerModal from '../modals/DatePickerModal';

const SearchableSelect = ({ label, value, options, field, onChange, isLoading = false, isDisabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    // Check if there are any real options (excluding the default "Select" option)
    const hasRealOptions = options.length > 1 || (options.length === 1 && options[0].value !== '');

    return (
        <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
            <div
                onClick={() => !isLoading && !isDisabled && hasRealOptions && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${isLoading || isDisabled || !hasRealOptions ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700'
                    }`}
            >
                <span className={`${!value ? 'text-gray-500' : ''} truncate pr-2`}>
                    {isLoading ? 'Loading...' : !hasRealOptions ? 'No values available' : (selectedOption?.label || 'Select')}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && !isLoading && !isDisabled && hasRealOptions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchTerm('');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(field, opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ConfigurationTab = () => {
    const { schedulerState, setSchedulerState, mode } = useAIPlayground();

    const [projects, setProjects] = useState([]);
    const [models, setModels] = useState([]);
    const [modelsData, setModelsData] = useState(null);
    const [dataSources, setDataSources] = useState([]);
    const [destinationTables, setDestinationTables] = useState([]);
    const [scheduleName, setScheduleName] = useState('');
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [scheduleNameError, setScheduleNameError] = useState('');

    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingDataSources, setLoadingDataSources] = useState(false);
    const [loadingDestinations, setLoadingDestinations] = useState(false);

    const [scheduleType, setScheduleType] = useState('Single Run');
    const [showDateModal, setShowDateModal] = useState(false);
    const [summary, setSummary] = useState('');
    const hostnameAI = window._env_?.VITE_AI_API;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const formatDateTimeForDisplay = (isoDateTime) => {
        if (!isoDateTime) return '';
        const [datePart, timePart] = isoDateTime.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart}`;
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'project':
                const selectedProject = projects.find(p => p.name === value);
                setSchedulerState(prev => ({
                    ...prev,
                    project: value,
                    project_id: selectedProject ? selectedProject.id : ''
                }));
                break;
            case 'model':
                const selectedModel = models.find(m => m.model_name === value);
                setSchedulerState(prev => ({
                    ...prev,
                    model: value,
                    model_id: selectedModel ? selectedModel.model_id : ''
                }));
                break;
            case 'dataSource':
                setSchedulerState(prev => ({
                    ...prev,
                    source: {
                        ...prev.source,
                        source_table: value
                    }
                }));
                break;
            case 'destinationTable':
                setSchedulerState(prev => ({
                    ...prev,
                    target: {
                        ...prev.target,
                        destination_table: value
                    }
                }));
                break;
            case 'frequency':
                setSchedulerState(prev => ({
                    ...prev,
                    scheduler: {
                        ...prev.scheduler,
                        frequency: value
                    }
                }));
                break;
            case 'timeZone':
                setSchedulerState(prev => ({
                    ...prev,
                    scheduler: {
                        ...prev.scheduler,
                        timeZone: value
                    }
                }));
                break;
            case 'runDays':
                setSchedulerState(prev => ({
                    ...prev,
                    scheduler: {
                        ...prev.scheduler,
                        runningDays: value
                    }
                }));
                break;
            default:
                break;
        }
        setSummary('')
    };

    const handleScheduleTypeChange = (type) => {
        setSummary('')
        setScheduleType(type);
        let flowType = 'single_run';
        let intervalType = '';
        if (type === 'Single Run') {
            flowType = 'single_run';
            intervalType = 'cron';
        } else if (type === 'Recurring') {
            flowType = 'Recurring';
            intervalType = 'recurring';
        } else if (type === 'Periodic (Interval)') {
            flowType = 'Periodic';
            intervalType = 'periodic';
        }

        setSchedulerState(prev => ({
            ...prev,
            flow_type: flowType,
            scheduler: {
                ...prev.scheduler,
                mode: 'auto',
                frequency: '',
                intervalType: intervalType
            }
        }));
    };

    // Handle date/time selection from modal
    const handleDateModalAdd = (dateTimeData) => {
        if (!dateTimeData) {
            toast.error('Invalid date/time data', {
                duration: 3000,
                position: 'top-right',
            });
            return;
        }

        const { date, month, year, hour, minute } = dateTimeData;

        if (!date || hour === '' || minute === '') {
            toast.error('Please select both date and time', {
                duration: 3000,
                position: 'top-right',
            });
            return;
        }

        // Format as ISO datetime: YYYY-MM-DDTHH:MM
        const day = String(date).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const isoDateTime = `${year}-${monthStr}-${day}T${hour}:${minute}`;

        // Update context with the formatted datetime
        setSchedulerState(prev => ({
            ...prev,
            scheduler: {
                ...prev.scheduler,
                intervalValue: isoDateTime
            }
        }));

        setShowDateModal(false);

        toast.success('Date and time set successfully', {
            duration: 2000,
            position: 'top-right',
        });
    };

    useEffect(() => {
        if (schedulerState.projectName && schedulerState.modelName) {

            setSchedulerState(prev => ({
                ...prev,
                project: schedulerState.projectName,
                project_id: schedulerState.projectId,
                model: schedulerState.modelName,
                model_id: schedulerState.modelId
            }));
        }
    }, [mode]);

    const isGenerateSummaryDisabled = () => {
        const commonFieldsFilled =
            scheduleName &&
            !scheduleNameError &&
            schedulerState.project &&
            schedulerState.model &&
            schedulerState.source.source_table &&
            schedulerState.target.destination_table &&
            schedulerState.scheduler.timeZone &&
            schedulerState.scheduler.intervalValue;

        if (!commonFieldsFilled) return true;

        if (scheduleType === 'Single Run') {
            return false;
        } else if (scheduleType === 'Recurring') {
            return !schedulerState.scheduler.runningDays ||
                schedulerState.scheduler.runningDays.length === 0;
        } else if (scheduleType === 'Periodic (Interval)') {
            return !schedulerState.scheduler.frequency;
        }

        return false;
    };

    const generateSummary = () => {
        const intervalValue = schedulerState.scheduler.intervalValue;
        const timeZone = schedulerState.scheduler.timeZone;

        if (!intervalValue || !timeZone) {
            toast.error('Please fill in all required fields', {
                duration: 3000,
                position: 'top-right',
            });
            return;
        }

        const [datePart, timePart] = intervalValue.split('T');
        const [year, month, day] = datePart.split('-');
        const displayDate = `${day}/${month}/${year}`;
        const displayTime = timePart;

        let summaryText = '';

        if (scheduleType === 'Single Run') {
            summaryText = `This model will run once on ${displayDate} at ${displayTime} (${timeZone})`;
        } else if (scheduleType === 'Recurring') {
            const daysText = schedulerState.scheduler.runningDays?.length > 0
                ? schedulerState.scheduler.runningDays.join(', ')
                : 'All days';
            const frequency = schedulerState.scheduler.frequency || 'daily';
            summaryText = `This model will run ${frequency} on ${daysText}\nStarting from ${displayDate} at ${displayTime} (${timeZone})`;
        } else if (scheduleType === 'Periodic (Interval)') {
            const frequency = schedulerState.scheduler.frequency || 'Not set';
            summaryText = `This model will run ${frequency}\nStarting from ${displayDate} at ${displayTime} (${timeZone})`;
        }

        setSummary(summaryText);
    };

    useEffect(() => {
        fetchExistingSchedules();
        fetchProjects();
        fetchDataSources();
        fetchDestinationTables();
    }, []);

    useEffect(() => {
        if (schedulerState.project && schedulerState.project !== '') {
            fetchModels(schedulerState.project);
        } else {
            setModels([]);
            setModelsData(null);
            setSchedulerState(prev => ({
                ...prev,
                model: '',
                model_id: ''
            }));
        }
    }, [schedulerState.project]);

    const fetchExistingSchedules = async () => {
        setLoadingSchedules(true);
        try {
            const response = await fetch(`${hostnameAI}/orchestration/schedules/summary`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch existing schedules: ${response.statusText}`);
            }

            const data = await response.json();
            setExistingSchedules(data || []);
        } catch (error) {
            console.error('Error fetching existing schedules:', error);
            toast.error(error.message || 'Failed to fetch existing schedules.', {
                duration: 4000,
                position: 'top-right',
            });
            setExistingSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
            const response = await fetch(`${hostnameAI}/model/list_projects`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }

            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error(error.message || 'Failed to fetch projects. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchModels = async (projectName) => {
        setLoadingModels(true);
        try {
            const response = await fetch(
                `${hostnameAI}/model/projects/${encodeURIComponent(projectName)}/models`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = await response.json();
            setModels(data.models || []);
            setModelsData(data);
        } catch (error) {
            console.error('Error fetching models:', error);
            toast.error(error.message || 'Failed to fetch models. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            setModels([]);
            setModelsData(null);
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchDataSources = async () => {
        setLoadingDataSources(true);
        try {
            const response = await fetch(
                `${hostnameAI}/schemas/predictions-source-schema/tables`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch data sources: ${response.statusText}`);
            }

            const data = await response.json();
            setDataSources(data.tables || []);

            setSchedulerState(prev => ({
                ...prev,
                source: {
                    ...prev.source,
                    source_conn_type: 'postgres',
                    source_schema: data.schema || 'aiml_predictions_source'
                }
            }));
        } catch (error) {
            console.error('Error fetching data sources:', error);
            toast.error(error.message || 'Failed to fetch data sources. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            setDataSources([]);
        } finally {
            setLoadingDataSources(false);
        }
    };

    const fetchDestinationTables = async () => {
        setLoadingDestinations(true);
        try {
            const response = await fetch(
                `${hostnameAI}/schemas/predictions-destination-schema/tables`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch destination tables: ${response.statusText}`);
            }

            const data = await response.json();
            setDestinationTables(data.tables || []);

            setSchedulerState(prev => ({
                ...prev,
                target: {
                    ...prev.target,
                    destination_conn_type: 'postgres',
                    destination_schema: data.schema || 'aiml_predictions_destination'
                }
            }));
        } catch (error) {
            console.error('Error fetching destination tables:', error);
            toast.error(error.message || 'Failed to fetch destination tables. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
            setDestinationTables([]);
        } finally {
            setLoadingDestinations(false);
        }
    };

    const renderSelect = (label, value, options, field, isLoading = false, isDisabled = false) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label} <span className="text-red-500">*</span></label>
            <select
                value={value}
                onChange={(e) => handleInputChange(field, e.target.value)}
                disabled={isLoading || isDisabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] ${isLoading || isDisabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-500 cursor-pointer'
                    }`}
            >
                {isLoading ? (
                    <option value="">Loading...</option>
                ) : (
                    options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                )}
            </select>
        </div>
    );

    const projectOptions = [
        { value: '', label: 'Select' },
        ...projects.map(project => ({
            value: project.name,
            label: project.name
        }))
    ];

    const modelOptions = schedulerState.project && schedulerState.project !== '' ? [
        { value: '', label: 'Select' },
        ...models.map(model => ({
            value: model.model_name,
            label: model.model_name
        }))
    ] : [
        { value: '', label: 'Select project first' }
    ];

    const dataSourceOptions = [
        { value: '', label: 'Select' },
        ...dataSources.map(source => ({
            value: source,
            label: source
        }))
    ];

    const destinationTableOptions = [
        { value: '', label: 'Select' },
        ...destinationTables.map(table => ({
            value: table,
            label: table
        }))
    ];

    const isPreFilledFromDeploy =
        mode === 'deploy' &&
        schedulerState.projectName &&
        schedulerState.modelName;

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Schedule Information</h2>
                <div className="max-w-2xl">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Schedule Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={scheduleName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setScheduleName(value);

                            const isDuplicate = existingSchedules.some(
                                schedule => schedule.name.toLowerCase() === value.toLowerCase()
                            );

                            if (isDuplicate && value.trim() !== '') {
                                setSchedulerState(prev => ({
                                    ...prev,
                                    workflow_name: ''
                                }));
                                setScheduleNameError('A schedule with this name already exists. Please choose a different name.');
                            } else {
                                setScheduleNameError('');
                                setSchedulerState(prev => ({
                                    ...prev,
                                    workflow_name: value
                                }));
                            }

                        }}
                        placeholder="Enter a unique name for this schedule"
                        className={`w-full px-3 py-2 border rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 ${scheduleNameError
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-[#8e78b7] focus:border-[#8e78b7]'
                            }`}
                    />
                    {scheduleNameError && (
                        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {scheduleNameError}
                        </p>
                    )}
                </div>
            </div>
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-4">Model Configuration </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isPreFilledFromDeploy ? (
                            // Read-only text input when in schedule mode
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Project <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={schedulerState.project}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
                                />
                            </div>
                        ) : (
                            <SearchableSelect
                                label="Project"
                                value={schedulerState.project}
                                options={projectOptions}
                                field="project"
                                onChange={handleInputChange}
                                isLoading={loadingProjects}
                            />
                        )}

                        {isPreFilledFromDeploy ? (
                            // Read-only text input when in schedule mode
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Model <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={schedulerState.model}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none"
                                />
                            </div>
                        ) : (
                            <SearchableSelect
                                label="Model"
                                value={schedulerState.model}
                                options={modelOptions}
                                field="model"
                                onChange={handleInputChange}
                                isLoading={loadingModels}
                                isDisabled={!schedulerState.project || schedulerState.project === ''}
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Data source"
                            value={schedulerState.source.source_table}
                            options={dataSourceOptions}
                            field="dataSource"
                            onChange={handleInputChange}
                            isLoading={loadingDataSources}
                        />
                        <SearchableSelect
                            label="Destination Table"
                            value={schedulerState.target.destination_table}
                            options={destinationTableOptions}
                            field="destinationTable"
                            onChange={handleInputChange}
                            isLoading={loadingDestinations}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-base font-bold text-gray-900 mb-0.5">Schedule Type <span className="text-red-500">*</span></h2>
                <p className="text-xs text-gray-500 mb-3">Select how and when this model should run.</p>
                <div className="flex flex-wrap gap-3">
                    {['Single Run', 'Recurring', 'Periodic (Interval)'].map((type) => (
                        <label
                            key={type}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${scheduleType === type ? 'text-[#8e78b7] bg-purple-50' : 'text-gray-700'
                                }`}
                        >
                            <input
                                type="radio"
                                name="scheduleType"
                                value={type}
                                checked={scheduleType === type}
                                onChange={(e) => handleScheduleTypeChange(e.target.value)}
                                className="w-4 h-4 text-[#8e78b7] border-gray-300 focus:ring-[#8e78b7]"
                            />
                            <span className={`text-sm ${scheduleType === type ? 'text-[#8e78b7]' : 'text-gray-700'}`}>
                                {type}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {scheduleType === 'Recurring' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                            {renderSelect('Time Zone', schedulerState.scheduler.timeZone, [
                                { value: '', label: 'Select' },
                                { value: 'ist', label: 'IST' }
                            ], 'timeZone')}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Run Days <span className="text-red-500">*</span></label>
                            <p className="text-xs text-gray-500 mb-3">Choose the days the model should execute.</p>
                            <div className="flex gap-2">
                                {dayAbbreviations.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const days = schedulerState.scheduler.runningDays || [];
                                            const dayName = dayNames[idx];
                                            handleInputChange('runDays', days.includes(dayName) ? days.filter(d => d !== dayName) : [...days, dayName]);
                                        }}
                                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${(schedulerState.scheduler.runningDays || []).includes(dayNames[idx])
                                            ? 'bg-[#8e78b7] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {scheduleType === 'Periodic (Interval)' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                        {renderSelect('Frequency', schedulerState.scheduler.frequency, [
                            { value: '', label: 'Select' },
                            { value: 'hourly', label: 'Hourly' },
                            { value: 'daily', label: 'Daily' },
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'quarterly', label: 'Quarterly' },
                            { value: 'half_yearly', label: 'Half Yearly' },
                            { value: 'yearly', label: 'Yearly' },
                        ], 'frequency')}
                        {renderSelect('Time Zone', schedulerState.scheduler.timeZone, [
                            { value: '', label: 'Select' },
                            { value: 'ist', label: 'IST' }
                        ], 'timeZone')}
                    </div>
                )}
                {scheduleType === 'Single Run' && (
                    <div className="max-w-xs">
                        {renderSelect('Time Zone', schedulerState.scheduler.timeZone, [
                            { value: '', label: 'Select' },
                            { value: 'ist', label: 'IST' }
                        ], 'timeZone')}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule Date & Time <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formatDateTimeForDisplay(schedulerState.scheduler.intervalValue)}
                                readOnly
                                onClick={() => setShowDateModal(true)}
                                placeholder="DD/MM/YYYY HH:MM"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] pr-10 cursor-pointer"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="pt-2 space-y-4">
                <button
                    onClick={generateSummary}
                    disabled={isGenerateSummaryDisabled()}
                    className={`px-5 py-2 rounded text-sm font-medium transition-colors ${!isGenerateSummaryDisabled()
                        ? 'bg-[#8e78b7] text-white hover:bg-[#b5a3cc] cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Generate Summary
                </button>

                {summary && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#8e78b7] flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Summary</h3>
                                <p className="text-xs text-gray-600 mb-2">{scheduleType}</p>
                                <div className="text-sm text-gray-700 space-y-1">
                                    {summary.split('\n').map((line, idx) => line.trim() && <div key={idx}>{line}</div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div> */}

            <DatePickerModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onAdd={handleDateModalAdd}
            />
        </div>
    );
};

export default ConfigurationTab;
import { Calendar, Search, X, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { useAuth } from '../../../../context/AuthContext';
import DatePickerModal from '../modals/DatePickerModal';
import { tw } from '../../../../components/themeContext';

const SearchableSelect = ({ label, value, options, field, onChange, isLoading = false, isDisabled = false, error }) => {
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
    const hasRealOptions = options.length > 1 || (options.length === 1 && options[0].value !== '');

    return (
        <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <div
                onClick={() => !isLoading && !isDisabled && hasRealOptions && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${
                    error ? 'border-red-500' : 'border-gray-300'
                } ${isLoading || isDisabled || !hasRealOptions ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700'}`}
            >
                <span className={`${!value ? 'text-gray-500' : ''} truncate pr-2`}>
                    {isLoading ? 'Loading...' : !hasRealOptions ? 'No values available' : (selectedOption?.label || 'Select')}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

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
                                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
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
                                    onClick={() => { onChange(field, opt.value); setIsOpen(false); setSearchTerm(''); }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-gray-700'}`}
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

const ConfigurationTab = ({ onValidationErrors }) => {
    const { schedulerState, setSchedulerState, mode } = useAIPlayground();
    const { token } = useAuth();

    const [projects, setProjects] = useState([]);
    const [models, setModels] = useState([]);
    const [modelsData, setModelsData] = useState(null);
    const [dataSources, setDataSources] = useState([]);
    const [destinationTables, setDestinationTables] = useState([]);
    const [scheduleName, setScheduleName] = useState(schedulerState?.workflow_name || '');
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [scheduleNameError, setScheduleNameError] = useState('');

    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingDataSources, setLoadingDataSources] = useState(false);
    const [loadingDestinations, setLoadingDestinations] = useState(false);

    const [validationStatus, setValidationStatus] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    const [scheduleType, setScheduleType] = useState(schedulerState?.flow_type || 'Single Run');
    const [showDateModal, setShowDateModal] = useState(false);

    // Field-level errors shown when user tries to proceed
    const [fieldErrors, setFieldErrors] = useState({});

    const hostnameAI = window._env_?.VITE_AI_API;

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const formatDateTimeForDisplay = (isoDateTime) => {
        if (!isoDateTime) return '';
        const [datePart, timePart] = isoDateTime.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart}`;
    };

    // Expose validate function to parent via ref-like pattern
    useEffect(() => {
        if (onValidationErrors) {
            onValidationErrors(() => validateAndGetErrors);
        }
    }, [schedulerState, validationStatus]);

    const validateAndGetErrors = () => {
        const errors = {};
        if (!schedulerState.workflow_name) errors.workflow_name = 'Schedule name is required';
        if (!schedulerState.project) errors.project = 'Project is required';
        if (!schedulerState.model) errors.model = 'Model is required';
        if (!schedulerState.source.source_table) errors.source_table = 'Data source is required';
        if (!schedulerState.target.destination_table) errors.destination_table = 'Destination table is required';
        if (!schedulerState.scheduler.timeZone) errors.timeZone = 'Time zone is required';
        if (!schedulerState.scheduler.intervalValue) errors.intervalValue = 'Schedule date & time is required';
        // if (!schedulerState.isValidated) errors.validated = 'Please validate the tables before continuing';
        setFieldErrors(errors);
        return errors;
    };

    const handleInputChange = (field, value) => {
        // Clear field error on change
        setFieldErrors(prev => ({ ...prev, [field]: undefined }));

        if (['project', 'model', 'dataSource', 'destinationTable'].includes(field)) {
            setValidationStatus(null);
        }

        switch (field) {
            case 'project': {
                const selectedProject = projects.find(p => p.name === value);
                setSchedulerState(prev => ({
                    ...prev,
                    project: value,
                    model: '',
                    project_id: selectedProject ? selectedProject.id : ''
                }));
                break;
            }
            case 'model': {
                const selectedModel = models.find(m => m.model_name === value);
                setSchedulerState(prev => ({
                    ...prev,
                    model: value,
                    model_id: selectedModel ? selectedModel.model_id : ''
                }));
                break;
            }
            case 'dataSource':
                setSchedulerState(prev => ({ ...prev, source: { ...prev.source, source_table: value } }));
                break;
            case 'destinationTable':
                setSchedulerState(prev => ({ ...prev, target: { ...prev.target, destination_table: value } }));
                break;
            case 'frequency':
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, frequency: value } }));
                break;
            case 'timeZone':
                setFieldErrors(prev => ({ ...prev, timeZone: undefined }));
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, timeZone: value } }));
                break;
            case 'runDays':
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, runningDays: value } }));
                break;
            default:
                break;
        }
    };

    const handleScheduleTypeChange = (type) => {
        setScheduleType(type);
        let flowType = 'single_run';
        let intervalType = '';
        if (type === 'Single Run') { flowType = 'single_run'; intervalType = 'cron'; }
        else if (type === 'Recurring') { flowType = 'Recurring'; intervalType = 'recurring'; }
        else if (type === 'Periodic') { flowType = 'Periodic'; intervalType = 'periodic'; }

        setSchedulerState(prev => ({
            ...prev,
            flow_type: flowType,
            scheduler: { ...prev.scheduler, mode: 'auto', frequency: '', intervalType }
        }));
    };

    const handleDateModalAdd = (dateTimeData) => {
        if (!dateTimeData) { toast.error('Invalid date/time data', { duration: 3000, position: 'top-right' }); return; }
        const { date, month, year, hour, minute } = dateTimeData;
        if (!date || hour === '' || minute === '') { toast.error('Please select both date and time', { duration: 3000, position: 'top-right' }); return; }

        const day = String(date).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const isoDateTime = `${year}-${monthStr}-${day}T${hour}:${minute}`;

        setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, intervalValue: isoDateTime } }));
        setFieldErrors(prev => ({ ...prev, intervalValue: undefined }));
        setShowDateModal(false);
        toast.success('Date and time set successfully', { duration: 2000, position: 'top-right' });
    };

    useEffect(() => {
        if (mode === 'deploy' && schedulerState.project && schedulerState.model) {
            setSchedulerState(prev => ({
                ...prev,
                project: schedulerState.project,
                project_id: schedulerState.project_id,
                model: schedulerState.model,
                model_id: schedulerState.model_id
            }));
        }
    }, [mode]);

    const validateScheduleName = (name) => {
        if (!name.trim()) return null;
        if (!/^[A-Za-z]/.test(name.trim())) return 'Schedule name must start with an alphabet character';
        if (/^\d+$/.test(name.trim())) return 'Schedule name cannot contain only digits';
        if (!/^[A-Za-z0-9_@#&]+$/.test(name)) return 'Only letters, numbers, underscore, @, #, and & are allowed.';
        if (existingSchedules.some(s => s.name.toLowerCase() === name.toLowerCase()))
            return 'A schedule with this name already exists. Please choose a different name.';
        return null;
    };

    const isValidateDisabled = () =>
        !schedulerState.model || !schedulerState.source.source_table || !schedulerState.target.destination_table;

    const validateTables = async () => {
        setIsValidating(true);
        setValidationStatus(null);
        try {
            const secureQueryResponse = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ user_query: "" }),
            });
            if (!secureQueryResponse.ok) throw new Error("Failed to fetch policy IDs");
            const secureQueryData = await secureQueryResponse.json();
            const policyIds = secureQueryData.matched_policy_ids;

            const response = await fetch(`${hostnameAI}/orchestration/validate-tables`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    run_name: schedulerState.model,
                    source_table: schedulerState.source.source_table,
                    destination_table: schedulerState.target.destination_table,
                    policy_id: policyIds
                })
            });
            if (!response.ok) throw new Error('Validation failed');
            const data = await response.json();
            setValidationStatus(data.validation_status);
            if (data.validation_status === 'valid') {
                setFieldErrors(prev => ({ ...prev, validated: undefined }));
                toast.success(data.message || 'Validated successfully!', { duration: 4000, position: 'top-right' });
            } else {
                toast.error('Tables are incompatible for prediction workflow - base columns or datatypes do not match across all three tables', { duration: 4000, position: 'top-right' });
            }
        } catch (error) {
            toast.error('Failed to validate. Please try again.', { duration: 4000, position: 'top-right' });
            setValidationStatus('error');
        } finally {
            setIsValidating(false);
        }
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
            setModels([]); setModelsData(null);
            setSchedulerState(prev => ({ ...prev, model: '', model_id: '' }));
        }
    }, [schedulerState.project]);

    const fetchExistingSchedules = async () => {
        setLoadingSchedules(true);
        try {
            const response = await fetch(`${hostnameAI}/orchestration/schedules/summary`, { method: 'GET', headers: { 'accept': 'application/json' } });
            if (!response.ok) throw new Error(`Failed to fetch existing schedules: ${response.statusText}`);
            const data = await response.json();
            setExistingSchedules(data || []);
        } catch (error) {
            console.error('Error fetching existing schedules:', error);
            setExistingSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const fetchProjects = async () => {
        setLoadingProjects(true);
        try {
            const response = await fetch(`${hostnameAI}/model/list_projects`, { method: 'GET', headers: { 'accept': 'application/json' } });
            if (!response.ok) throw new Error(`Failed to fetch projects: ${response.statusText}`);
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchModels = async (projectName) => {
        setLoadingModels(true);
        try {
            const response = await fetch(`${hostnameAI}/model/projects/${encodeURIComponent(projectName)}/models`, { method: 'GET', headers: { 'accept': 'application/json' } });
            if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
            const data = await response.json();
            setModels(data.models || []);
            setModelsData(data);
        } catch (error) {
            console.error('Error fetching models:', error);
            setModels([]); setModelsData(null);
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchDataSources = async () => {
        setLoadingDataSources(true);
        try {
            const secureQueryResponse = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ user_query: "" }),
            });
            if (!secureQueryResponse.ok) throw new Error("Failed to fetch policy IDs");
            const secureQueryData = await secureQueryResponse.json();
            const policyIds = secureQueryData.matched_policy_ids;

            const response = await fetch(`${hostnameAI}/schemas/predictions-source-schema/tables`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ policy_id: policyIds })
            });
            if (!response.ok) throw new Error(`Failed to fetch data sources: ${response.statusText}`);
            const data = await response.json();
            setDataSources(data.tables || []);
            setSchedulerState(prev => ({ ...prev, source: { ...prev.source, source_conn_type: 'postgres', source_schema: data.schema || 'aiml_predictions_source' } }));
        } catch (error) {
            console.error('Error fetching data sources:', error);
            setDataSources([]);
        } finally {
            setLoadingDataSources(false);
        }
    };

    const fetchDestinationTables = async () => {
        setLoadingDestinations(true);
        try {
            const response = await fetch(`${hostnameAI}/schemas/predictions-destination-schema/tables`, { method: 'GET', headers: { 'accept': 'application/json' } });
            if (!response.ok) throw new Error(`Failed to fetch destination tables: ${response.statusText}`);
            const data = await response.json();
            setDestinationTables(data.tables || []);
            setSchedulerState(prev => ({ ...prev, target: { ...prev.target, destination_conn_type: 'postgres', destination_schema: data.schema || 'aiml_predictions_destination' } }));
        } catch (error) {
            console.error('Error fetching destination tables:', error);
            setDestinationTables([]);
        } finally {
            setLoadingDestinations(false);
        }
    };

    const renderSelect = (label, value, options, field, isLoading = false, isDisabled = false) => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => handleInputChange(field, e.target.value)}
                disabled={isLoading || isDisabled}
                className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] ${
                    fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
                } ${isLoading || isDisabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-500 cursor-pointer'}`}
            >
                {isLoading ? (
                    <option value="">Loading...</option>
                ) : (
                    options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                )}
            </select>
            {fieldErrors[field] && <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p>}
        </div>
    );

    useEffect(() => {
        if (setSchedulerState) {
            setSchedulerState(prev => ({ ...prev, isValidated: validationStatus === 'valid' }));
        }
    }, [validationStatus]);

    const projectOptions = [
        { value: '', label: 'Select' },
        ...projects.map(p => ({ value: p.name, label: p.name }))
    ];

    const modelOptions = schedulerState.project && schedulerState.project !== '' ? [
        { value: '', label: 'Select' },
        ...models.map(m => ({ value: m.model_name, label: m.model_name }))
    ] : [{ value: '', label: 'Select project first' }];

    const dataSourceOptions = [
        { value: '', label: 'Select' },
        ...dataSources.map(s => ({ value: s, label: s }))
    ];

    const destinationTableOptions = [
        { value: '', label: 'Select' },
        ...destinationTables.map(t => ({ value: t, label: t }))
    ];

    const isPreFilledFromDeploy = mode === 'deploy' && schedulerState.project && schedulerState.model;

    return (
        <div className="max-w-6xl space-y-10">

            {/* ── Schedule Information ── */}
            <div>
                <h2 className={tw.sectionHeading}>Schedule Information</h2>
                <div className="max-w-2xl mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule Name</label>
                    <input
                        type="text"
                        value={scheduleName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setScheduleName(value);
                            const error = validateScheduleName(value);
                            if (error) {
                                setScheduleNameError(error);
                                setSchedulerState(prev => ({ ...prev, workflow_name: '' }));
                            } else {
                                setScheduleNameError('');
                                setFieldErrors(prev => ({ ...prev, workflow_name: undefined }));
                                setSchedulerState(prev => ({ ...prev, workflow_name: value }));
                            }
                        }}
                        disabled={schedulerState?.mode === 'edit'}
                        placeholder="Enter a unique name for this schedule"
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-1 ${
                            schedulerState.mode === 'edit'
                                ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-gray-300'
                                : (scheduleNameError || fieldErrors.workflow_name)
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-gray-700 bg-white'
                                    : 'border-gray-300 focus:ring-[#8e78b7] focus:border-[#8e78b7] text-gray-700 bg-white'
                        }`}
                    />
                    {(scheduleNameError || fieldErrors.workflow_name) && schedulerState?.mode !== 'edit' && (
                        <p className="text-xs text-red-500 mt-1">{scheduleNameError || fieldErrors.workflow_name}</p>
                    )}
                </div>
            </div>

            {/* ── Model Configuration ── */}
            <div>
                <h2 className={tw.sectionHeading}>Model Configuration</h2>
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isPreFilledFromDeploy ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project</label>
                                <input type="text" value={schedulerState.project} readOnly className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none" />
                            </div>
                        ) : (
                            <SearchableSelect
                                label="Project"
                                value={schedulerState.project}
                                options={projectOptions}
                                field="project"
                                onChange={handleInputChange}
                                isLoading={loadingProjects}
                                error={fieldErrors.project}
                            />
                        )}

                        {isPreFilledFromDeploy ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model</label>
                                <input type="text" value={schedulerState.model} readOnly className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none" />
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
                                error={fieldErrors.model}
                            />
                        )}

                        <SearchableSelect
                            label="Data source"
                            value={schedulerState.source.source_table}
                            options={dataSourceOptions}
                            field="dataSource"
                            onChange={handleInputChange}
                            isLoading={loadingDataSources}
                            error={fieldErrors.source_table}
                        />
                        <SearchableSelect
                            label="Destination Table"
                            value={schedulerState.target.destination_table}
                            options={destinationTableOptions}
                            field="destinationTable"
                            onChange={handleInputChange}
                            isLoading={loadingDestinations}
                            error={fieldErrors.destination_table}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <button
                            onClick={validateTables}
                            disabled={isValidateDisabled() || isValidating || validationStatus === 'valid'}
                            className={`w-fit px-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                validationStatus === 'valid'
                                    ? 'bg-green-100 text-green-700 cursor-default border border-green-400'
                                    : isValidateDisabled() || isValidating
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#8e78b7] text-white hover:bg-[#7d67a6]'
                            }`}
                        >
                            {isValidating ? (
                                <>Validating...<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></>
                            ) : validationStatus === 'valid' ? (
                                <>Validated <CheckCircle className="w-5 h-5" /></>
                            ) : 'Validate'}
                        </button>
                        {fieldErrors.validated && <p className="text-xs text-red-500">{fieldErrors.validated}</p>}
                    </div>
                </div>
            </div>

            {/* ── Schedule Type ── */}
            <div>
                <h2 className={`${tw.sectionHeading} mb-0.5`}>Schedule Type</h2>
                <p className="text-xs text-gray-500 mb-3">Select how and when this model should run.</p>
                <div className="flex flex-wrap gap-3">
                    {['Single Run', 'Recurring', 'Periodic'].map((type) => (
                        <label
                            key={type}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${scheduleType === type ? 'text-[#8e78b7] bg-purple-50' : 'text-gray-700'}`}
                        >
                            <input
                                type="radio"
                                name="scheduleType"
                                value={type}
                                checked={scheduleType === type}
                                onChange={(e) => handleScheduleTypeChange(e.target.value)}
                                className="w-4 h-4 border-gray-300 focus:ring-[#8e78b7]"
                                style={{ accentColor: '#8e78b7' }}
                            />
                            <span className={`text-sm ${scheduleType === type ? 'text-[#8e78b7]' : 'text-gray-700'}`}>{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* ── Schedule-type-specific fields ── */}
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
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Run Days</label>
                            <p className="text-xs text-gray-500 mb-3">Choose the days the model should execute.</p>
                            <div className="flex gap-3">
                                {dayAbbreviations.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const days = schedulerState.scheduler.runningDays || [];
                                            const dayName = dayNames[idx];
                                            handleInputChange('runDays', days.includes(dayName) ? days.filter(d => d !== dayName) : [...days, dayName]);
                                        }}
                                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors border ${
                                            (schedulerState.scheduler.runningDays || []).includes(dayNames[idx])
                                                ? 'bg-[#8e78b7] text-white border-[#8e78b7]'
                                                : 'bg-white text-gray-500 border-gray-300 hover:border-[#8e78b7] hover:text-[#8e78b7]'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {scheduleType === 'Periodic' && (
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
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule Date & Time</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formatDateTimeForDisplay(schedulerState.scheduler.intervalValue)}
                                readOnly
                                onClick={() => setShowDateModal(true)}
                                placeholder="DD/MM/YYYY HH:MM"
                                className={`w-full px-3 py-2 border rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] pr-10 cursor-pointer ${
                                    fieldErrors.intervalValue ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {fieldErrors.intervalValue && <p className="text-xs text-red-500 mt-1">{fieldErrors.intervalValue}</p>}
                    </div>
                </div>
            </div>

            <DatePickerModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onAdd={handleDateModalAdd}
            />
        </div>
    );
};

export default ConfigurationTab;
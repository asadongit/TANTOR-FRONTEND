import { Calendar, Search, X, CheckCircle, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAIPlayground } from '../../../../context/AIPlaygroundContext';
import { useAuth } from '../../../../context/AuthContext';
import DatePickerModal from '../modals/DatePickerModal';
import { tw } from '../../../../components/themeContext';

const SearchableSelect = ({ label, value, options, field, onChange, isLoading = false, isDisabled = false, error, isMulti = false }) => {
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

    const selectedValues = isMulti ? (Array.isArray(value) ? value : value ? [value] : []) : [];
    const selectedOption = !isMulti ? options.find(opt => opt.value === value) : null;
    const selectedOptions = isMulti ? options.filter(opt => selectedValues.includes(opt.value)) : [];
    const hasRealOptions = options.length > 1 || (options.length === 1 && options[0].value !== '');
    const displayValue = isMulti
        ? (selectedValues.length === 0
            ? 'Select'
            : `${(selectedOptions.length ? selectedOptions : selectedValues.map(valueItem => ({ label: String(valueItem) }))).slice(0, 2).map(opt => opt.label).join(', ')}${selectedValues.length > 2 ? ` +${selectedValues.length - 2} more` : ''}`)
        : (selectedOption?.label || 'Select');

    return (
        <div ref={dropdownRef} className="relative">
            {label ? <label className="block text-sm font-medium text-[#332849] mb-1.5">{label}</label> : null}
            <div
                onClick={() => !isLoading && !isDisabled && hasRealOptions && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] cursor-pointer flex items-center justify-between ${error ? 'border-red-500' : 'border-[#CCCCCC]'
                    } ${isLoading || isDisabled || !hasRealOptions ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-[#332849]'}`}
            >
                <span className={`${(isMulti ? selectedValues.length === 0 : !value) ? 'text-gray-500' : ''} truncate pr-2`}>
                    {isLoading ? 'Loading...' : !hasRealOptions ? 'No values available' : displayValue}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

            {isOpen && !isLoading && !isDisabled && hasRealOptions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#CCCCCC] rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-8 py-1.5 border border-[#CCCCCC] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7]"
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
                    <div className="max-h-48 overflow-y-auto overflow-x-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = isMulti ? selectedValues.includes(opt.value) : value === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => {
                                            if (isMulti) {
                                                const currentValues = Array.isArray(value) ? value : value ? [value] : [];
                                                const nextValues = currentValues.includes(opt.value)
                                                    ? currentValues.filter(item => item !== opt.value)
                                                    : [...currentValues, opt.value];
                                                onChange(field, nextValues);
                                            } else {
                                                onChange(field, opt.value);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }
                                        }}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 flex items-center justify-between gap-3 min-w-max ${isSelected ? 'bg-purple-100 text-[#8e78b7] font-medium' : 'text-[#332849]'}`}
                                    >
                                        <span className="whitespace-nowrap">{opt.label}</span>
                                        {isMulti && (
                                            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#8e78b7] border-[#8e78b7]' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
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
    const [workflowModelMap, setWorkflowModelMap] = useState({});
    const [ensembleNames, setEnsembleNames] = useState([]);
    const [dataSources, setDataSources] = useState([]);
    const [destinationTables, setDestinationTables] = useState([]);
    const [scheduleName, setScheduleName] = useState(schedulerState?.workflow_name || '');
    const [existingSchedules, setExistingSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [scheduleNameError, setScheduleNameError] = useState('');

    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingEnsembleNames, setLoadingEnsembleNames] = useState(false);
    const [loadingDataSources, setLoadingDataSources] = useState(false);
    const [loadingDestinations, setLoadingDestinations] = useState(false);

    const [validationStatus, setValidationStatus] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    const [isEnsembleEnabled, setIsEnsembleEnabled] = useState(Boolean(schedulerState?.is_ensemble));
    const [selectedEnsemble, setSelectedEnsemble] = useState(schedulerState?.ensemble_name || '');

    const flowTypeToLabel = {
        'single_run': 'Single Run',
        'Recurring': 'Recurring',
        'Periodic': 'Periodic',
    };

    const [scheduleType, setScheduleType] = useState(
        flowTypeToLabel[schedulerState?.flow_type] || 'Single Run'
    );
    const [showDateModal, setShowDateModal] = useState(false);

    // Field-level errors shown when user tries to proceed
    const [fieldErrors, setFieldErrors] = useState({});

    // Summary state
    const [summary, setSummary] = useState(null);

    const hostnameAI = window._env_?.VITE_AI_API;
    const fastApiBase = window._env_?.VITE_FAST_API || 'http://localhost:8000';

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const formatDateTimeForDisplay = (isoDateTime) => {
        if (!isoDateTime) return '';
        const [datePart, timePart] = isoDateTime.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart}`;
    };

    const isModelSelected = (modelValue) => Array.isArray(modelValue) ? modelValue.length > 0 : Boolean(modelValue);
    const getModelDisplayValue = () => Array.isArray(schedulerState.model) ? schedulerState.model.join(', ') : schedulerState.model;
    const getModelListValue = () => Array.isArray(schedulerState.model) ? schedulerState.model : (schedulerState.model ? [schedulerState.model] : []);

    // Expose validate function to parent via ref-like pattern
    useEffect(() => {
        if (onValidationErrors) {
            onValidationErrors(() => validateAndGetErrors);
        }
    }, [schedulerState, validationStatus, scheduleType]);

    const validateAndGetErrors = () => {
        const errors = {};
        if (!schedulerState.workflow_name) errors.workflow_name = 'Schedule name is required';
        if (!schedulerState.project) errors.project = 'Project is required';
        if (isEnsembleEnabled && !selectedEnsemble) errors.ensemble_name = 'Ensemble name is required';
        if (!isModelSelected(schedulerState.model)) errors.model = isEnsembleEnabled ? 'Select at least one model' : 'Model is required';
        if (!schedulerState.source.source_table) errors.source_table = 'Data source is required';
        if (!schedulerState.target.destination_table) errors.destination_table = 'Destination table is required';
        if (!schedulerState.scheduler.timeZone) errors.timeZone = 'Time zone is required';
        if (!schedulerState.scheduler.intervalValue) errors.intervalValue = 'Schedule date & time is required';
        if (scheduleType === 'Recurring' && (!schedulerState.scheduler.runningDays || schedulerState.scheduler.runningDays.length === 0))
            errors.runDays = 'Please select at least one run day';
        if (scheduleType === 'Periodic' && !schedulerState.scheduler.frequency)
            errors.frequency = 'Frequency is required';
        if (!schedulerState.isValidated) errors.validated = 'Please validate the tables before continuing';
        setFieldErrors(errors);
        return errors;
    };

    const handleInputChange = (field, value) => {
        const errorKeyMap = {
            dataSource: 'source_table',
            destinationTable: 'destination_table',
            ensemble: 'ensemble_name',
        };
        const errorKey = errorKeyMap[field] || field;
        setFieldErrors(prev => ({ ...prev, [errorKey]: undefined }));

        // Reset summary when key fields change
        if (['project', 'model', 'ensemble', 'dataSource', 'destinationTable'].includes(field)) {
            setValidationStatus(null);
            setSummary(null);
        }

        switch (field) {
            case 'project': {
                const selectedProject = projects.find(p => p.name === value);
                setSchedulerState(prev => ({
                    ...prev,
                    project: value,
                    ensemble_name: '',
                    model: isEnsembleEnabled ? [] : '',
                    model_id: isEnsembleEnabled ? [] : '',
                    project_id: selectedProject ? selectedProject.id : ''
                }));
                setSelectedEnsemble('');
                setEnsembleNames([]);
                setModels([]);
                setSummary(null);
                break;
            }
            case 'ensemble': {
                const selectedEnsembleName = value;
                setSelectedEnsemble(selectedEnsembleName);
                setSchedulerState(prev => ({
                    ...prev,
                    ensemble_name: selectedEnsembleName,
                    model: isEnsembleEnabled ? [] : '',
                    model_id: isEnsembleEnabled ? [] : ''
                }));
                setSummary(null);
                break;
            }
            case 'model': {
                const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);
                const selectedModelIds = models
                    .filter(m => selectedValues.includes(m.value || m.model_name))
                    .map(m => m.model_id || '');
                setSchedulerState(prev => ({
                    ...prev,
                    model: Array.isArray(value) ? value : value,
                    model_id: isEnsembleEnabled ? selectedModelIds : (selectedModelIds[0] || '')
                }));
                setSummary(null);
                break;
            }
            case 'dataSource':
                setSchedulerState(prev => ({ ...prev, source: { ...prev.source, source_table: value } }));
                setSummary(null);
                break;
            case 'destinationTable':
                setSchedulerState(prev => ({ ...prev, target: { ...prev.target, destination_table: value } }));
                setSummary(null);
                break;
            case 'frequency':
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, frequency: value } }));
                setSummary(null);
                break;
            case 'timeZone':
                setFieldErrors(prev => ({ ...prev, timeZone: undefined }));
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, timeZone: value } }));
                setSummary(null);
                break;
            case 'runDays':
                setFieldErrors(prev => ({ ...prev, runDays: undefined }));
                setSchedulerState(prev => ({ ...prev, scheduler: { ...prev.scheduler, runningDays: value } }));
                setSummary(null);
                break;
            default:
                break;
        }
    };

    const handleScheduleTypeChange = (type) => {
        setScheduleType(type);
        setSummary(null);
        setFieldErrors(prev => ({
            ...prev,
            runDays: undefined,
            frequency: undefined,
            timeZone: undefined,
            intervalValue: undefined,
        }));

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
        setSummary(null);
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
        
        if (name.length > 100) return 'Schedule name must be 100 characters or less';
        
        if (!/^[A-Za-z]/.test(name.trim())) return 'Schedule name must start with an alphabet';
        
        if (/^\d+$/.test(name.trim())) return 'Schedule name cannot contain only digits';
        
        const validCharPattern = /^[A-Za-z0-9_\-@#& ]+$/;
        if (!validCharPattern.test(name)) return 'Only letters, numbers, underscore, hyphen, space, @, #, and & are allowed';
        
        if (existingSchedules.some(s => s.name.toLowerCase() === name.toLowerCase()))
            return 'A schedule with this name already exists. Please choose a different name.';
        return null;
    };

    const isValidateDisabled = () =>
        !isModelSelected(schedulerState.model) || !schedulerState.source.source_table || !schedulerState.target.destination_table;

    const extractOptions = (payload, keys = []) => {
        const toOption = (item) => {
            if (typeof item === 'string') {
                return item ? { value: item, label: item } : null;
            }
            if (!item || typeof item !== 'object') {
                return null;
            }
            const value = item.value ?? item.name ?? item.model_name ?? item.ensemble_name ?? item.id ?? '';
            const label = item.label ?? item.name ?? item.model_name ?? item.ensemble_name ?? value;
            return value ? { value, label, ...item } : null;
        };

        if (Array.isArray(payload)) {
            return payload.map(toOption).filter(Boolean);
        }

        for (const key of keys) {
            if (Array.isArray(payload?.[key])) {
                return payload[key].map(toOption).filter(Boolean);
            }
        }

        if (Array.isArray(payload?.data)) {
            return payload.data.map(toOption).filter(Boolean);
        }

        return [];
    };

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
                    model_name: getModelListValue(),
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
        if (!schedulerState.project) {
            setModels([]);
            setEnsembleNames([]);
            setSchedulerState(prev => ({ ...prev, ensemble_name: '', model: isEnsembleEnabled ? [] : '', model_id: isEnsembleEnabled ? [] : '' }));
            return;
        }

        if (isEnsembleEnabled) {
            fetchEnsembleNames(schedulerState.project);
        } else {
            setEnsembleNames([]);
            fetchModels(schedulerState.project);
        }
    }, [schedulerState.project, isEnsembleEnabled]);

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
            setModels(extractOptions(data, ['models', 'model_names']));
            setWorkflowModelMap({});
        } catch (error) {
            console.error('Error fetching models:', error);
            setModels([]);
            setWorkflowModelMap({});
        } finally {
            setLoadingModels(false);
        }
    };

    const fetchEnsembleNames = async (projectName) => {
        setLoadingEnsembleNames(true);
        try {
            const response = await fetch(
                `${hostnameAI}/schemas/ensemble-names?project_name=${encodeURIComponent(projectName)}`,
                { method: 'GET', headers: { 'accept': 'application/json' } }
            );
            if (!response.ok) throw new Error(`Failed to fetch ensemble names: ${response.statusText}`);
            const data = await response.json();
            const options = extractOptions(data, ['ensemble_names']);
            setEnsembleNames(options);
            if (!options.some(option => option.value === selectedEnsemble)) {
                setSelectedEnsemble('');
                setSchedulerState(prev => ({ ...prev, ensemble_name: '', model: isEnsembleEnabled ? [] : '', model_id: isEnsembleEnabled ? [] : '' }));
            }
        } catch (error) {
            console.error('Error fetching ensemble names:', error);
            setEnsembleNames([]);
        } finally {
            setLoadingEnsembleNames(false);
        }
    };

    const fetchModelsByEnsemble = async (projectName, ensembleName) => {
        setLoadingModels(true);
        try {
            const response = await fetch(
                `${hostnameAI}/schemas/model-names-by-ensemble?project_name=${encodeURIComponent(projectName)}&ensemble_name=${encodeURIComponent(ensembleName)}`,
                { method: 'GET', headers: { 'accept': 'application/json' } }
            );
            if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
            const data = await response.json();

            const rawWorkflowModels = data?.workflow_models && typeof data.workflow_models === 'object'
                ? data.workflow_models
                : {};

            const normalizedWorkflowModels = Object.entries(rawWorkflowModels).reduce((acc, [workflowName, modelList]) => {
                const normalizedModels = Array.isArray(modelList)
                    ? modelList
                        .map(modelItem => {
                            if (typeof modelItem === 'string') return modelItem;
                            if (modelItem && typeof modelItem === 'object') {
                                return modelItem.model_name || modelItem.name || modelItem.value || '';
                            }
                            return '';
                        })
                        .filter(Boolean)
                    : [];

                acc[workflowName] = normalizedModels;
                return acc;
            }, {});

            setWorkflowModelMap(normalizedWorkflowModels);

            const flattenedModels = Object.entries(normalizedWorkflowModels).flatMap(([workflowName, modelList]) =>
                (Array.isArray(rawWorkflowModels[workflowName]) ? rawWorkflowModels[workflowName] : [])
                    .map(modelItem => {
                        if (typeof modelItem === 'string') {
                            return modelItem ? {
                                value: modelItem,
                                label: modelItem,
                                workflow_name: workflowName,
                                model_id: ''
                            } : null;
                        }

                        if (modelItem && typeof modelItem === 'object') {
                            const modelName = modelItem.model_name || modelItem.name || modelItem.value || '';
                            return modelName ? {
                                value: modelName,
                                label: modelName,
                                workflow_name: workflowName,
                                model_id: modelItem.model_id || modelItem.id || ''
                            } : null;
                        }

                        return null;
                    })
                    .filter(Boolean)
            );

            setModels(flattenedModels);

            // Prune any previously selected models that are not present in the selected ensemble anymore.
            setSchedulerState(prev => {
                const selectedModels = Array.isArray(prev.model)
                    ? prev.model
                    : prev.model
                        ? [prev.model]
                        : [];
                const selectedModelIds = Array.isArray(prev.model_id)
                    ? prev.model_id
                    : prev.model_id
                        ? [prev.model_id]
                        : [];
                const allowedModels = new Set(flattenedModels.map(model => model.value));
                const prunedEntries = selectedModels
                    .map((modelName, index) => ({
                        modelName,
                        modelId: selectedModelIds[index] || ''
                    }))
                    .filter(entry => allowedModels.has(entry.modelName));

                return {
                    ...prev,
                    model: prunedEntries.map(entry => entry.modelName),
                    model_id: prunedEntries.map(entry => entry.modelId)
                };
            });
        } catch (error) {
            console.error('Error fetching ensemble models:', error);
            setModels([]);
            setWorkflowModelMap({});
        } finally {
            setLoadingModels(false);
        }
    };

    const handleWorkflowModelChange = (workflowModels, selectedValue) => {
        const selectedModels = new Set(getModelListValue());

        workflowModels.forEach(modelName => selectedModels.delete(modelName));

        if (selectedValue) {
            selectedModels.add(selectedValue);
        }

        handleInputChange('model', Array.from(selectedModels));
    };

    const getSelectedModelsForWorkflow = (workflowModels) => {
        const selectedModels = getModelListValue();
        return selectedModels.find(modelName => workflowModels.includes(modelName)) || '';
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
            const secureQueryResponse = await fetch(`${window._env_?.VITE_FAST_API}/secure-query`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ user_query: "" }),
            });
            if (!secureQueryResponse.ok) throw new Error("Failed to fetch policy IDs");
            const secureQueryData = await secureQueryResponse.json();
            const policyIds = secureQueryData.matched_policy_ids;

            const response = await fetch(`${hostnameAI}/schemas/predictions-destination-schema/tables`, {
                method: 'POST',
                headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ policy_id: policyIds })
            });
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
            <label className="block text-sm font-medium text-[#332849] mb-1.5">{label}</label>
            <select
                value={value}
                onChange={(e) => handleInputChange(field, e.target.value)}
                disabled={isLoading || isDisabled}
                className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] ${fieldErrors[field] ? 'border-red-500' : 'border-[#CCCCCC]'
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

    // ── Generate Summary helpers ──────────────────────────────────────────────

    const isGenerateSummaryEnabled = () => {
        const s = schedulerState;
        const hasBase =
            s.workflow_name &&
            s.project &&
            isModelSelected(s.model) &&
            s.source.source_table &&
            s.target.destination_table &&
            s.scheduler.timeZone &&
            s.scheduler.intervalValue;
        if (!hasBase) return false;
        if (scheduleType === 'Recurring') return (s.scheduler.runningDays || []).length > 0;
        if (scheduleType === 'Periodic') return !!s.scheduler.frequency;
        return true;
    };

    const formatSummaryDateTime = (isoDateTime) => {
        if (!isoDateTime) return { dateLabel: '', timeLabel: '' };
        const [datePart, timePart] = isoDateTime.split('T');
        const [year, month, day] = datePart.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateLabel = `${months[parseInt(month) - 1]} ${parseInt(day)}`;
        const [h, m] = timePart.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const timeLabel = `${displayHour}:${m} ${ampm}`;
        return { dateLabel, timeLabel };
    };

    const generateSummary = () => {
        const s = schedulerState;
        const { dateLabel, timeLabel } = formatSummaryDateTime(s.scheduler.intervalValue);
        const tz = s.scheduler.timeZone?.toUpperCase() || 'IST';

        if (scheduleType === 'Single Run') {
            setSummary({
                type: 'Single Run',
                lines: [
                    `Scheduled to run once on ${dateLabel} at ${timeLabel} (${tz}).`,
                    `One-time execution scheduled for ${dateLabel}, ${timeLabel} ${tz}.`,
                ]
            });
        } else if (scheduleType === 'Recurring') {
            const days = (s.scheduler.runningDays || []).join(', ');
            setSummary({
                type: 'Recurring',
                lines: [
                    `Scheduled to run every week on ${days} at ${timeLabel} (${tz}).`,
                    `Recurring execution starting ${dateLabel}, ${timeLabel} ${tz}.`,
                ]
            });
        } else if (scheduleType === 'Periodic') {
            const freq = s.scheduler.frequency || '';
            setSummary({
                type: 'Periodic',
                lines: [
                    `Scheduled to run ${freq} starting ${dateLabel} at ${timeLabel} (${tz}).`,
                    `Periodic execution every ${freq} from ${dateLabel}, ${timeLabel} ${tz}.`,
                ]
            });
        }
    };

    // ── Options ───────────────────────────────────────────────────────────────

    const projectOptions = [
        { value: '', label: 'Select' },
        ...projects.map(p => ({ value: p.name, label: p.name }))
    ];

    const ensembleOptions = isEnsembleEnabled ? [
        { value: '', label: loadingEnsembleNames ? 'Loading...' : 'Select' },
        ...ensembleNames
    ] : [];

    const modelOptions = schedulerState.project && schedulerState.project !== '' ? [
        { value: '', label: 'Select' },
        ...models
    ] : [{ value: '', label: 'Select project first' }];

    const dataSourceOptions = [
        { value: '', label: 'Select' },
        ...dataSources.map(s => ({ value: s, label: s }))
    ];

    const destinationTableOptions = [
        { value: '', label: 'Select' },
        ...destinationTables.map(t => ({ value: t, label: t }))
    ];

    const timezoneOptions = [
        { value: '', label: 'Select' },
        { value: 'ist', label: 'IST' }
    ];

    const stripNestedThresholdEntries = (thresholdState) => Object.entries(thresholdState || {}).reduce((acc, [key, value]) => {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            acc[key] = value;
        }
        return acc;
    }, {});

    const createBlankSchedulerState = (isEnsemble = false) => ({
        owner_id: '',
        project: '',
        is_ensemble: isEnsemble,
        ensemble_name: '',
        model: isEnsemble ? [] : '',
        model_id: isEnsemble ? [] : '',
        project_id: '',
        flow_type: 'single_run',
        scheduler: {
            mode: 'auto',
            frequency: '',
            runningDays: [],
            endDateTime: '',
            intervalType: 'single_run',
            intervalValue: '',
            startDateTime: '',
        },
        source: {
            source_conn_type: '',
            source_schema: '',
            source_table: ''
        },
        target: {
            destination_conn_type: '',
            destination_schema: '',
            destination_table: ''
        },
        data_drift_threshold: {
            distribution_drift_threshold: 0,
            statistical_significance_level: 0,
            information_stability_threshold: 0,
            target_stability_threshold: 0
        },
        model_drift_threshold: {
            prediction_drift_threshold: 0,
            performance_drift_threshold: -1
        },
        data_drift_check: 0,
        model_drift_check: 0,
        recipients: [],
        created_by: '',
        workflow_name: ''
    });

    const frequencyOptions = [
        { value: '', label: 'Select' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'half_yearly', label: 'Half Yearly' },
        { value: 'yearly', label: 'Yearly' },
    ];

    const isPreFilledFromDeploy = mode === 'deploy' && schedulerState.project && isModelSelected(schedulerState.model);

    useEffect(() => {
        if (isEnsembleEnabled && schedulerState.project && selectedEnsemble) {
            fetchModelsByEnsemble(schedulerState.project, selectedEnsemble);
            return;
        }

        if (!isEnsembleEnabled && schedulerState.project) {
            fetchModels(schedulerState.project);
        }
    }, [isEnsembleEnabled, schedulerState.project, selectedEnsemble]);

    const handleEnsembleToggle = (enabled) => {
        setIsEnsembleEnabled(enabled);
        setFieldErrors({});
        setValidationStatus(null);
        setSummary(null);
        setScheduleName('');
        setSelectedEnsemble('');
        setEnsembleNames([]);
        setModels([]);
        setWorkflowModelMap({});
        setScheduleType('Single Run');
        setShowDateModal(false);

        setSchedulerState(createBlankSchedulerState(enabled));
    };

    return (
        <>
            <div className="space-y-7 bg-[#FAFAFA] p-4 rounded-md">

                {/* ── Schedule Information ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-md flex-1">
                        <label className="block text-base font-medium text-[#332849] mb-1.5">Schedule Name</label>
                        <div className="flex items-center justify-between mb-1">
                            <span></span>
                            <span className="text-xs text-slate-400">{scheduleName.length}/100</span>
                        </div>
                        <input
                            type="text"
                            value={scheduleName}
                            onChange={(e) => {
                                const value = e.target.value;
                                setScheduleName(value);
                                setSummary(null);
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
                            maxLength={100}
                            disabled={schedulerState?.mode === 'edit'}
                            placeholder="Enter a unique name for this schedule"
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 ${schedulerState.mode === 'edit'
                                ? 'bg-gray-100 cursor-not-allowed text-gray-600 border-[#CCCCCC]'
                                : (scheduleNameError || fieldErrors.workflow_name)
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-[#332849] bg-white'
                                    : 'border-[#CCCCCC] focus:ring-[#8e78b7] focus:border-[#8e78b7] text-[#332849] bg-white'
                                }`}
                        />
                        {(scheduleNameError || fieldErrors.workflow_name) && schedulerState?.mode !== 'edit' && (
                            <p className="text-xs text-red-500 mt-1">{scheduleNameError || fieldErrors.workflow_name}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 sm:mt-8 sm:flex-shrink-0">
                        <span className="text-sm font-medium text-[#332849]">Ensemble</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isEnsembleEnabled}
                                onChange={(e) => handleEnsembleToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#8e78b7] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8e78b7]"></div>
                        </label>
                    </div>
                </div>

                {/* ── Model Configuration ── */}
                <div>
                    <h2 className={tw.sectionHeading}>Model Configuration</h2>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {isPreFilledFromDeploy ? (
                                <div>
                                    <label className="block text-sm font-medium text-[#332849] mb-1.5">Project</label>
                                    <input type="text" value={schedulerState.project} readOnly className="w-full px-3 py-2 border border-[#CCCCCC] rounded text-sm bg-gray-50 text-[#332849] cursor-not-allowed focus:outline-none" />
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

                            {isEnsembleEnabled && (
                                <SearchableSelect
                                    label="Ensemble Name"
                                    value={schedulerState.ensemble_name}
                                    options={ensembleOptions}
                                    field="ensemble"
                                    onChange={handleInputChange}
                                    isLoading={loadingEnsembleNames}
                                    isDisabled={!schedulerState.project || schedulerState.project === ''}
                                    error={fieldErrors.ensemble_name}
                                />
                            )}

                            {isPreFilledFromDeploy ? (
                                <div>
                                    <label className="block text-sm font-medium text-[#332849] mb-1.5">Model</label>
                                    <input type="text" value={getModelDisplayValue()} readOnly className="w-full px-3 py-2 border border-[#CCCCCC] rounded text-sm bg-gray-50 text-[#332849] cursor-not-allowed focus:outline-none" />
                                </div>
                            ) : (
                                isEnsembleEnabled ? (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                        {!schedulerState.project || schedulerState.project === '' || !schedulerState.ensemble_name ? (
                                            <p className="text-sm text-gray-500 mt-1">Select project and ensemble name to view workflows.</p>
                                        ) : loadingModels ? (
                                            <p className="text-sm text-gray-500 mt-1">Loading workflows and models...</p>
                                        ) : Object.keys(workflowModelMap).length === 0 ? (
                                            <p className="text-sm text-gray-500 mt-1">No workflow models found for the selected ensemble.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <label className="block text-sm font-medium text-[#332849]">Workflow</label>
                                                    <label className="block text-sm font-medium text-[#332849]">Models</label>
                                                </div>

                                                {Object.entries(workflowModelMap).map(([workflowName, workflowModels]) => (
                                                    <div key={workflowName} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={workflowName}
                                                                readOnly
                                                                className="w-full px-3 py-2 border border-[#CCCCCC] rounded text-sm bg-white text-[#332849] focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <SearchableSelect
                                                                label=""
                                                                value={getSelectedModelsForWorkflow(workflowModels)}
                                                                options={[{ value: '', label: 'Select' }, ...workflowModels.map(modelName => ({ value: modelName, label: modelName }))]}
                                                                field={`workflow-model-${workflowName}`}
                                                                onChange={(_, value) => handleWorkflowModelChange(workflowModels, value)}
                                                                isDisabled={workflowModels.length === 0}
                                                                isMulti={false}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {fieldErrors.model && <p className="text-xs text-red-500 mt-1">{fieldErrors.model}</p>}
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        label="Model"
                                        value={schedulerState.model}
                                        options={modelOptions}
                                        field="model"
                                        onChange={handleInputChange}
                                        isLoading={loadingModels}
                                        isDisabled={!schedulerState.project || schedulerState.project === '' || (isEnsembleEnabled && !schedulerState.ensemble_name)}
                                        isMulti={isEnsembleEnabled}
                                        error={fieldErrors.model}
                                    />
                                )
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
                                className={`w-fit px-8 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${validationStatus === 'valid'
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
                    <p className="text-xs text-gray-500 mt-2 mb-3">Select how and when this model should run.</p>
                    <div className="flex flex-wrap gap-3">
                        {['Single Run', 'Recurring', 'Periodic'].map((type) => (
                            <label
                                key={type}
                                className={`flex items-center gap-4 pr-16 pl-3 py-2 rounded-md cursor-pointer transition-colors ${scheduleType === type ? 'text-[#8e78b7] bg-[#F2EBFF]' : 'text-[#332849] bg-white'}`}
                            >
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    value={type}
                                    checked={scheduleType === type}
                                    onChange={(e) => handleScheduleTypeChange(e.target.value)}
                                    className="w-4 h-4 border-[#CCCCCC] focus:ring-[#8e78b7]"
                                    style={{ accentColor: '#8e78b7' }}
                                />
                                <span className={`text-sm ${scheduleType === type ? 'text-[#8e78b7]' : 'text-[#332849]'}`}>{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* ── Schedule-type-specific fields ── */}
                <div className="space-y-4">
                    {scheduleType === 'Recurring' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                                <SearchableSelect
                                    label="Time Zone"
                                    value={schedulerState.scheduler.timeZone}
                                    options={timezoneOptions}
                                    field="timeZone"
                                    onChange={handleInputChange}
                                    error={fieldErrors.timeZone}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#332849] mb-1.5">Run Days</label>
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
                                            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${(schedulerState.scheduler.runningDays || []).includes(dayNames[idx])
                                                ? 'bg-[#8e78b7] text-white border-[#8e78b7]'
                                                : 'bg-white text-gray-500 border-[#CCCCCC] hover:border-[#8e78b7] hover:text-[#8e78b7]'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                {fieldErrors.runDays && <p className="text-xs text-red-500 mt-2">{fieldErrors.runDays}</p>}
                            </div>
                        </>
                    )}

                    {scheduleType === 'Periodic' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                            <SearchableSelect
                                label="Frequency"
                                value={schedulerState.scheduler.frequency}
                                options={frequencyOptions}
                                field="frequency"
                                onChange={handleInputChange}
                                error={fieldErrors.frequency}
                            />
                            <SearchableSelect
                                label="Time Zone"
                                value={schedulerState.scheduler.timeZone}
                                options={timezoneOptions}
                                field="timeZone"
                                onChange={handleInputChange}
                                error={fieldErrors.timeZone}
                            />
                        </div>
                    )}

                    {scheduleType === 'Single Run' && (
                        <div className="max-w-xs">
                            <SearchableSelect
                                label="Time Zone"
                                value={schedulerState.scheduler.timeZone}
                                options={timezoneOptions}
                                field="timeZone"
                                onChange={handleInputChange}
                                error={fieldErrors.timeZone}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-[#332849] mb-1.5">Schedule Date & Time</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formatDateTimeForDisplay(schedulerState.scheduler.intervalValue)}
                                    readOnly
                                    onClick={() => setShowDateModal(true)}
                                    placeholder="DD/MM/YYYY HH:MM"
                                    className={`w-full px-3 py-2 border rounded-md text-sm text-[#332849] bg-white focus:outline-none focus:ring-1 focus:ring-[#8e78b7] focus:border-[#8e78b7] pr-10 cursor-pointer ${fieldErrors.intervalValue ? 'border-red-500' : 'border-[#CCCCCC]'
                                        }`}
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            {fieldErrors.intervalValue && <p className="text-xs text-red-500 mt-1">{fieldErrors.intervalValue}</p>}
                        </div>
                    </div>
                </div>

                {/* ── Generate Summary ── */}
                <div className="space-y-4">
                    <button
                        onClick={generateSummary}
                        disabled={!isGenerateSummaryEnabled()}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isGenerateSummaryEnabled()
                            ? 'bg-[#8e78b7] text-white hover:bg-[#7d67a6] cursor-pointer'
                            : 'bg-[#8e78b7] text-white cursor-not-allowed opacity-40'
                            }`}
                    >
                        Generate Summary
                    </button>

                </div>

            </div>
            {summary && (
                <div
                    className="rounded-md mt-5"
                    style={{
                        padding: '3px',
                        background: 'linear-gradient(360deg, #8E77BB -11.35%, #EDE4FF 138.65%)',
                    }}
                >
                    <div className="rounded-md px-3 py-4" style={{ backgroundColor: '#FAF8FF' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-[#8e78b7] flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#332849]">Summary</p>
                                <p className="text-xs text-[#8e78b7]">{summary.type}</p>
                            </div>
                        </div>
                        <ul className="space-y-2 p-3 bg-white rounded-md">
                            {summary.lines.map((line, i) => (
                                <li key={i} className="text-sm text-[#332849] flex items-start gap-2">
                                    <span className="mt-2 w-1 h-1 rounded-full bg-[#332849] flex-shrink-0" />
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            <DatePickerModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onAdd={handleDateModalAdd}
            />
        </>
    );
};

export default ConfigurationTab;
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useAuth } from '../../../../../../context/AuthContext';
import { useCreateMatchJob, useDomains, useMatchRules } from '../../../../../../hooks/mdm/matchJobs';

const inputBase =
    'w-full border border-[#CCCCCC] rounded-lg px-3.5 py-2.5 text-sm font-normal text-[#282F49] outline-none bg-white leading-none box-border focus:border-[#8e78b7] font-[Satoshi,sans-serif]';

const labelBase =
    'text-sm font-medium text-[#332849] font-[Satoshi,sans-serif] leading-none mb-1.5 block';

const SCOPE_OPTIONS = [
    { value: 'Full', label: 'Full' },
    { value: 'Incremental', label: 'Incremental' },
];

const EMPTY_FORM = {
    match_job_name: '',
    domain_id: '',
    description: '',
    rule_set_id: '',
    scope: '',
    auto_merge_threshold: '',
    review_threshold: '',
};

const CreateMatchJobModal = ({ isOpen, onClose, onSuccess }) => {
    const { decodedToken } = useAuth();
    const [formData, setFormData] = useState(EMPTY_FORM);

    const { domains, loading: domainsLoading } = useDomains(isOpen);
    const { rules, loading: rulesLoading } = useMatchRules(formData.domain_id, isOpen);

    const { isSubmitting, create } = useCreateMatchJob(() => {
        onSuccess?.();
        handleClose();
    });

    useEffect(() => {
        if (!isOpen) setFormData(EMPTY_FORM);
    }, [isOpen]);

    const handleDomainChange = (value) => {
        setFormData((prev) => ({ ...prev, domain_id: value, rule_set_id: '' }));
    };

    const set = (key) => (value) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const setRaw = (key) => (e) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async () => {
        const result = await create({
            match_job_name: formData.match_job_name.trim(),
            domain_id: formData.domain_id,
            description: formData.description || undefined,
            rule_set_id: formData.rule_set_id,
            scope: formData.scope,
            auto_merge_threshold: formData.auto_merge_threshold !== ''
                ? parseFloat(formData.auto_merge_threshold)
                : undefined,
            review_threshold: formData.review_threshold !== ''
                ? parseFloat(formData.review_threshold)
                : undefined,
            triggered_by: decodedToken?.preferred_username,
        });

        if (!result.ok) toast.error(result.message);
        else toast.success(result.data?.message || 'Match job created successfully');
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        onClose();
    };

    const domainOptions = useMemo(
        () => domains.map((d) => ({ value: d.domain_id ?? d.id, label: d.domain_name ?? d.name ?? '' })),
        [domains]
    );

    const ruleOptions = useMemo(
        () => rules.map((r) => ({ value: String(r.rule_set_id), label: r.rule_set_name })),
        [rules]
    );

    const isValid =
        formData.match_job_name.trim() &&
        formData.domain_id &&
        formData.rule_set_id &&
        formData.scope;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000099]"
            onClick={handleClose}
        >
            <div
                className="w-[690px] bg-white rounded-2xl border border-[#CCCCCC] mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 pt-4 pb-2 rounded-t-2xl bg-white shadow-[0px_4px_9px_0px_rgba(0,0,0,0.10)]">
                    <span className="text-lg font-medium text-[#282F49] font-[Satoshi,sans-serif]">
                        Create New Job
                    </span>
                    <button
                        onClick={handleClose}
                        className="bg-transparent border-none cursor-pointer p-1 text-[#818181] flex items-center hover:text-[#282F49] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-8 grid grid-cols-2 gap-5 bg-white">

                    <div className="flex flex-col gap-1.5 col-span-2">
                        <label className={labelBase}>
                            Job Name <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter job name"
                            value={formData.match_job_name}
                            onChange={setRaw('match_job_name')}
                            className={inputBase}
                        />
                    </div>

                     <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Description <span className="text-[#E05252]">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter job description"
                            value={formData.description}
                            onChange={setRaw('description')}
                            className={inputBase}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Domain <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.domain_id}
                            onChange={handleDomainChange}
                            options={domainsLoading
                                ? []
                                : domainOptions}
                            placeholder={domainsLoading ? 'Loading...' : 'Select domain'}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Match Rule Set <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.rule_set_id}
                            onChange={set('rule_set_id')}
                            options={rulesLoading ? [] : ruleOptions}
                            placeholder={
                                !formData.domain_id
                                    ? 'Select domain first'
                                    : rulesLoading
                                        ? 'Loading...'
                                        : 'Select rule'
                            }
                            disabled={!formData.domain_id || rulesLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>
                            Scope <span className="text-[#E05252]">*</span>
                        </label>
                        <SearchableDropdown
                            value={formData.scope}
                            onChange={set('scope')}
                            options={SCOPE_OPTIONS}
                            placeholder="Select scope"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Auto-Merge Threshold</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Enter Auto-Merge Threshold"
                            value={formData.auto_merge_threshold}
                            onChange={setRaw('auto_merge_threshold')}
                            className={inputBase}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className={labelBase}>Review Threshold</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Enter Review Threshold"
                            value={formData.review_threshold}
                            onChange={setRaw('review_threshold')}
                            className={inputBase}
                        />
                    </div>

                </div>

                <div className="h-[68px] flex items-center justify-end gap-3 px-6 rounded-b-2xl bg-white shadow-[0px_-4px_9px_0px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#282F49] border border-[#CCCCCC] rounded-lg bg-white cursor-pointer font-[Satoshi,sans-serif] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                        className={`px-5 py-2.5 text-sm font-medium text-white border-none rounded-lg font-[Satoshi,sans-serif] transition-colors ${
                            isValid && !isSubmitting
                                ? 'bg-[#8e78b7] cursor-pointer hover:bg-[#7a67a0]'
                                : 'bg-[#CBC0E0] cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Job'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateMatchJobModal;
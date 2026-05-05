import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useMatchJobsSummary = () => {
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_jobs/summary');
            setSummary(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    return { summary, isLoading, isError, refetch: fetchSummary };
};

export const useRunningJobs = () => {
    const [runningJobs, setRunningJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRunning = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/mdm/match_jobs/in_progress');
            setRunningJobs(data.total > 0 ? data.data : []);
        } catch {
            setRunningJobs([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchRunning(); }, [fetchRunning]);

    return { runningJobs, isLoading, refetch: fetchRunning };
};

export const useDomains = (isOpen) => {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchDomains = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/mdm/list_all_domains');
                setDomains(data);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [isOpen]);

    return { domains, loading };
};

export const useMatchJobsList = (domainId) => {
    const [jobs, setJobs] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchJobs = useCallback(async (id) => {
        if (!id) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_jobs/list', {
                params: { domain_id: id },
            });
            setJobs(data.data ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { if (domainId) fetchJobs(domainId); }, [domainId, fetchJobs]);

    return { jobs, total, isLoading, isError, refetch: () => fetchJobs(domainId) };
};

export const useMatchRules = (domainId, isOpen) => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !domainId) {
            setRules([]);
            return;
        }
        const fetchRules = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/mdm/match_config/rulesets_by_domain', {
                    params: { domain_id: domainId },
                });
                setRules(data.rules ?? []);
            } catch {
                setRules([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRules();
    }, [domainId, isOpen]);

    return { rules, loading };
};

export const useCreateMatchJob = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/match_jobs/create_new_job', payload);
            onSuccess?.();
            return { ok: true, data };
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create match job';
            return { ok: false, message };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

export const useMatchJobDetails = () => {
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
 
    const fetchDetails = useCallback(async (matchJobId) => {
        if (!matchJobId) return;
        setIsLoading(true);
        setIsError(false);
        setDetails(null);
        try {
            const { data } = await api.get(`/mdm/match_jobs/details/${matchJobId}`);
            setDetails(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);
 
    const reset = useCallback(() => {
        setDetails(null);
        setIsError(false);
    }, []);
 
    return { details, isLoading, isError, fetchDetails, reset };
};
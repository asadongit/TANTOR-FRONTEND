import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useTaskQueueHomepage = () => {
    const [counts, setCounts] = useState({
        total_pending: 0,
        high_priority: 0,
        overdue: 0,
        completed_today: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchHomepage = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/task_queue/homepage');
            setCounts(data.counts ?? {});
            setTasks(data.tasks ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomepage();
    }, [fetchHomepage]);

    return { counts, tasks, isLoading, isError, fetchHomepage };
};

export const useReassignTasks = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reassign = async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.patch('/mdm/task_queue/reassign_tasks', payload);
            return { ok: true, data };
        } catch (err) {
            return { ok: false, message: err?.response?.data?.detail || 'Failed to reassign tasks' };
        } finally {
            setIsSubmitting(false);
        }
    };

    return { isSubmitting, reassign };
};

export const useTaskQueueDetail = (taskId) => {
    const [data, setData]         = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError]   = useState(false);
 
    const fetchDetail = useCallback(async () => {
        if (!taskId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data: res } = await api.get(`/mdm/task_queue/${taskId}`);
            setData(res);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);
 
    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);
 
    return { data, isLoading, isError, fetchDetail };
};

export const useMatchResultIds = (enabled = true) => {
    const [records, setRecords] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const fetch = async () => {
            setLoading(true);
            setError(false);
            try {
                const { data } = await api.get('/mdm/match_results/get_match_result_ids');
                if (!cancelled) setRecords(data.records ?? {});
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetch();
        return () => { cancelled = true; };
    }, [enabled]);

    return { records, loading, error };
};

export const useStewards = (enabled = true) => {
    const [stewards, setStewards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const fetch = async () => {
            setLoading(true);
            setError(false);
            try {
                const { data } = await api.get('/mdm/stewards');
                if (!cancelled) setStewards(data.users ?? []);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetch();
        return () => { cancelled = true; };
    }, [enabled]);

    return { stewards, loading, error };
};

export const useCreateTask = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/task_queue/create', payload);
            onSuccess?.();
            return { ok: true, data };
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                'Something went wrong';
            return { ok: false, message };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useReviewQueue = () => {
    const [metricCounts, setMetricCounts] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_merge/review_queue');
            setMetricCounts(data.counts);
            setTableData(
                (data.data ?? []).map((item) => ({
                    pairId:     item.pair_id,
                    resultId:   item.result_id,
                    record1:    item.record1,
                    record2:    item.record2,
                    score:      item.score,
                    priority:   item.priority,
                    assignedTo: item.assigned_to,
                }))
            );
            return { ok: true };
        } catch (err) {
            console.warn('API error:', err.message);
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { metricCounts, tableData, isLoading, isError, fetchData };
};


export const useCompare = (pairId) => {
    const [data, setData]           = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError]     = useState(false);

    const fetchCompare = useCallback(async () => {
        if (!pairId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data: json } = await api.post('/mdm/match_merge/compare', { pair_id: pairId });
            setData(json);
        } catch (err) {
            console.warn('Compare fetch error:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [pairId]);

    useEffect(() => { fetchCompare(); }, [fetchCompare]);

    return { data, isLoading, isError, fetchCompare };
};

export const useMergeResponse = () => {
    const [submitting, setSubmitting] = useState(false);

    const resolve = useCallback(async ({ pairId, resolution, resolvedBy, comments = '' }) => {
        setSubmitting(true);
        try {
            await api.post('/mdm/match_merge/merge_response', {
                pair_id:             pairId,
                resolution,
                resolved_by:         resolvedBy,
                resolution_comments: comments,
            });
            return { ok: true };
        } catch (err) {
            console.warn('Resolution error:', err);
            return { ok: false };
        } finally {
            setSubmitting(false);
        }
    }, []);

    return { submitting, resolve };
};

// ─── Assign Tasks ─────────────────────────────────────────────────────────────

export const useStewards = (isOpen) => {
    const [stewardOptions, setStewardOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchStewards = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/mdm/stewards');
                if (data.users) {
                    setStewardOptions(
                        data.users.map((u) => ({ value: u.username, label: u.username }))
                    );
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchStewards();
    }, [isOpen]);

    return { stewardOptions, loading };
};

export const useAssignTasks = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const assign = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/match_merge/assign_tasks', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Assignment failed';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, assign };
};
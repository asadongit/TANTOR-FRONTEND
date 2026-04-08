import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

// ── Domains ──────────────────────────────────────────────────────────────────
export const useDomains = (isOpen = true) => {
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
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [isOpen]);

    return { domains, loading };
};

// ── Attributes by domain ──────────────────────────────────────────────────────
export const useAttributes = (domainId, isOpen = true) => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !domainId) {
            setAttributes([]);
            return;
        }
        const fetchAttributes = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/mdm/attribute/by_domain/${domainId}`);
                setAttributes(data.attributes ?? []);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchAttributes();
    }, [isOpen, domainId]);

    return { attributes, loading };
};

// ── Survivorship rules by domain ──────────────────────────────────────────────
export const useSurvivorshipRules = (domainId) => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRules = useCallback(async () => {
        if (!domainId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get(`/mdm/survivorship/by_domain/${domainId}`);
            setRules(data.rules ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [domainId]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    return { rules, isLoading, isError, fetchRules };
};

// ── Strategy counts (metric cards) ────────────────────────────────────────────
export const useSurvivorshipStrategyCounts = () => {
    const [strategyCounts, setStrategyCounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchStrategyCounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/mdm/survivorship/strategy_counts');
            setStrategyCounts(data.strategy_counts ?? []);
        } catch {
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStrategyCounts();
    }, [fetchStrategyCounts]);

    return { strategyCounts, isLoading, fetchStrategyCounts };
};

// ── Create survivorship rule ───────────────────────────────────────────────────
export const useCreateSurvivorshipRule = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/survivorship/add_rule', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create rule';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

// ── Update survivorship rule ───────────────────────────────────────────────────
export const useUpdateSurvivorshipRule = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = useCallback(async (ruleId, payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.put(`/mdm/survivorship/update_rule/${ruleId}`, payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update rule';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, update };
};

export const useDeleteSurvivorshipRule = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteRule = useCallback(async (ruleId) => {
        setIsDeleting(true);
        try {
            await api.delete(`/mdm/survivorship/delete_rule/${ruleId}`);
            onSuccess?.();
            return { ok: true };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to delete rule';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteRule };
};
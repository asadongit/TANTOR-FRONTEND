import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

// ── Fetch hierarchy definition (counts + table) ───────────────────────────────
export const useHierarchyDefinition = () => {
    const [data, setData] = useState({ counts: {}, hierarchies: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchHierarchyDefinition = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data: res } = await api.get('/mdm/hierarchy_definition/homepage');
            setData(res);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHierarchyDefinition();
    }, [fetchHierarchyDefinition]);

    return { data, isLoading, isError, fetchHierarchyDefinition };
};

// ── Fetch domains (for dropdowns in modals) ───────────────────────────────────
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

// ── Create hierarchy ───────────────────────────────────────────────────────────
export const useCreateHierarchy = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/hierarchy_definition/create_hierarchy', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create hierarchy';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

// ── Edit hierarchy ─────────────────────────────────────────────────────────────
export const useEditHierarchy = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.patch('/mdm/hierarchy_definition/edit_hierarchy', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update hierarchy';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, update };
};

export const useHierarchies = () => {
    const [hierarchies, setHierarchies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
 
    const fetchHierarchies = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/node_management/hierarchies');
            setHierarchies(data ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);
 
    useEffect(() => { fetchHierarchies(); }, [fetchHierarchies]);
 
    return { hierarchies, isLoading, isError, refetch: fetchHierarchies };
};
 
export const useVisualHierarchyTree = () => {
    const [tree, setTree] = useState([]);
    const [nodes, setNodes] = useState(0);
    const [levels, setLevels] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchTree = useCallback(async (hierarchyTypeId) => {
        if (!hierarchyTypeId) return;
        setIsLoading(true);
        setIsError(false);
        setTree([]);
        setNodes(0);
        setLevels(0);
        try {
            const { data } = await api.post('/mdm/visual_hierarchy/display', {
                hierarchy_type_id: hierarchyTypeId,
            });
            setTree(data.tree ?? []);
            setNodes(data.nodes ?? 0);
            setLevels(data.levels ?? 0);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { tree, nodes, levels, isLoading, isError, fetchTree };
};
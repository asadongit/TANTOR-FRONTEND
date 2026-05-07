import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

// ── Fetch node management (counts + table) ────────────────────────────────────
export const useNodeManagement = () => {
    const [data, setData] = useState({ counts: {}, nodes: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchNodeManagement = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data: res } = await api.get('/mdm/node_management/homepage');
            setData(res);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNodeManagement();
    }, [fetchNodeManagement]);

    return { data, isLoading, isError, fetchNodeManagement };
};

// ── Fetch hierarchies list (for dropdowns in modals) ──────────────────────────
export const useHierarchiesList = (isOpen = true) => {
    const [hierarchies, setHierarchies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchHierarchies = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/mdm/node_management/hierarchies');  
                setHierarchies(data);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchHierarchies();
    }, [isOpen]);

    return { hierarchies, loading };
};

// ── Fetch parent nodes for a given hierarchy (for dropdowns in modals) ────────
export const useParentNodes = (hierarchyId, isOpen = true) => {
    const [parentNodes, setParentNodes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !hierarchyId) return;
        const fetchParentNodes = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/mdm/node_management/parent_nodes?hierarchy_type_id=${hierarchyId}`);
                setParentNodes(data);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetchParentNodes();
    }, [isOpen, hierarchyId]);

    return { parentNodes, loading };
};

// ── Create node ───────────────────────────────────────────────────────────────
export const useCreateNode = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/node_management/add_node', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create node';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

// ── Edit node ─────────────────────────────────────────────────────────────────
export const useEditNode = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.put('/mdm/node_management/edit_node', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update node';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, update };
};

// ── Move node ─────────────────────────────────────────────────────────────────
export const useMoveNode = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const move = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.put('/mdm/node_management/move_node', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to move node';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, move };
};
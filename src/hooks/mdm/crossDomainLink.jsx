import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

const DEBOUNCE_MS = 500;

/* ── Counts ── */
export const useCrossDomainCounts = () => {
    const [counts, setCounts] = useState({ total_links: 0, active_links: 0, relationship_types: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/mdm/cross_domain_links/counts');
            setCounts(data);
        } catch {
            /* silent */
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);

    return { counts, isLoading, fetchCounts };
};

/* ── Relationship Types ── */
export const useRelationshipTypes = () => {
    const [relTypes, setRelTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRelTypes = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/cross_domain_links/relationship_types');
            setRelTypes(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchRelTypes(); }, [fetchRelTypes]);

    return { relTypes, isLoading, isError, fetchRelTypes };
};

/* ── Active Links ── */
export const useActiveLinks = () => {
    const [activeLinks, setActiveLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchActiveLinks = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/cross_domain_links/active_links');
            setActiveLinks(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchActiveLinks(); }, [fetchActiveLinks]);

    return { activeLinks, isLoading, isError, fetchActiveLinks };
};

/* ── Delete Links ── */
export const useDeleteLinks = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteLinks = useCallback(async (relationshipIds, updatedBy = 'admin') => {
        setIsDeleting(true);
        try {
            await api.post('/mdm/cross_domain_links/delete_links', {
                relationship_ids: relationshipIds,
                updated_by: updatedBy,
            });
            onSuccess?.();
            return { ok: true };
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Delete failed';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteLinks };
};

export const useDeleteRelationshipType = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteRelType = useCallback(async (id, updatedBy = 'admin') => {
        setIsDeleting(true);
        try {
            await api.post('/mdm/cross_domain_links/delete_relationship_type', {
                id,
                updated_by: updatedBy,
            });
            onSuccess?.();
            return { ok: true };
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Delete failed';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteRelType };
};

export const useCreateRelationshipType = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/cross_domain_links/add_relationship_type', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create relationship type';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

export const useCreateCrossDomainLink = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/cross_domain_links/add_link', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create link';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};

export const useRelTypeAttributes = (typeCode) => {
    const [attributes, setAttributes] = useState({ from: null, to: null });
    const [isLoading, setIsLoading] = useState(false);

    const fetchAttributes = useCallback(async (code) => {
        const resolved = code ?? typeCode;
        if (!resolved) return;
        setIsLoading(true);
        try {
            const { data } = await api.post('/mdm/cross_domain_links/search/get_attributes', {
                type_code: resolved,
            });
            setAttributes({ from: data.from, to: data.to });
        } catch {
            setAttributes({ from: null, to: null });
        } finally {
            setIsLoading(false);
        }
    }, [typeCode]);

    useEffect(() => {
        if (typeCode) fetchAttributes(typeCode);
        else setAttributes({ from: null, to: null });
    }, [typeCode, fetchAttributes]);

    return { attributes, isLoading, fetchAttributes };
};

export const useEntitySearch = (domainId, domainName, attributeName) => {
    const [options, setOptions] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const debounceRef = useRef(null);

    const fetchPage = useCallback(async (pageNum, searchValue = '') => {
        if (!domainId || !attributeName) return;
        const isFirst = pageNum === 1;
        isFirst ? setLoading(true) : setLoadingMore(true);

        try {
            const { data } = await api.post('/mdm/cross_domain_links/search/search_result', {
                domain_id: domainId,
                attribute_name: attributeName,
                page: pageNum,
                ...(searchValue ? { search_value: searchValue } : {}),
            });

            const newRows = data.data ?? [];
            const newOptions = newRows.map(row => ({
                value: row.golden_id,
                label: String(row[attributeName] ?? row.golden_id),
                raw: row,
            }));

            setRawData(prev => isFirst ? newRows : [...prev, ...newRows]);
            setOptions(prev => isFirst ? newOptions : [...prev, ...newOptions]);
            setTotalPages(data.pagination?.total_pages ?? 1);
            setPage(pageNum);
        } catch {
            /* silent */
        } finally {
            isFirst ? setLoading(false) : setLoadingMore(false);
        }
    }, [domainId, attributeName]);

    useEffect(() => {
        if (!domainId || !attributeName) {
            setOptions([]);
            setRawData([]);
            setPage(1);
            setTotalPages(1);
            return;
        }
        setSearch('');
        fetchPage(1, '');
    }, [domainId, attributeName, fetchPage]);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPage(1, val), DEBOUNCE_MS);
    };

    const handleLoadMore = () => {
        if (page < totalPages && !loadingMore) fetchPage(page + 1, search);
    };

    const getRowByGoldenId = (goldenId) =>
        rawData.find(r => r.golden_id === goldenId) ?? null;

    return {
        options,
        loading,
        loadingMore,
        hasMore: page < totalPages,
        handleSearch,
        handleLoadMore,
        getRowByGoldenId,
    };
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
                /* silent */
            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [isOpen]);

    return { domains, loading };
};
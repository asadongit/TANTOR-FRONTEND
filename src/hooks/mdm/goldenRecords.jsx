import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const useGoldenRecordsHomepage = () => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [defaultDomainId, setDefaultDomainId] = useState(null);
    const [goldenTable, setGoldenTable] = useState('');

    const fetchRecords = useCallback(async (domainId = null) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.post('/mdm/overview/golden_records/homepage', domainId ? { domain_id: domainId } : {});
            const domain = data.domains?.[0];
            if (domain) {
                setRecords(domain.records || []);
                setGoldenTable(domain.golden_table_name || '');
                if (!domainId) setDefaultDomainId(domain.domain_id);
            }
            return { ok: true, data };
        } catch (err) {
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(null); }, [fetchRecords]);

    return { records, isLoading, isError, defaultDomainId, goldenTable, fetchRecords };
};

export const useListAllDomains = () => {
    const [domains, setDomains] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/mdm/list_all_domains')
            .then(({ data }) =>
                setDomains(data.map((d) => ({ value: d.domain_id, label: d.domain_name })))
            )
            .catch((err) => console.error('Failed to fetch domains:', err))
            .finally(() => setIsLoading(false));
    }, []);

    return { domains, isLoading };
};

export const useGoldenRecordAttributes = (domainId, isOpen) => {
    const [attributes, setAttributes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!isOpen || !domainId) return;
        setIsLoading(true);
        setIsError(false);
        api.get(`/mdm/show_attributes/${domainId}`)
            .then(({ data }) => setAttributes(data || []))
            .catch(() => setIsError(true))
            .finally(() => setIsLoading(false));
    }, [isOpen, domainId]);

    return { attributes, isLoading, isError };
};

export const useCreateGoldenRecord = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createGoldenRecord = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/golden_records/create_golden_record', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create golden record.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, createGoldenRecord };
};

export const usePrefillGoldenRecord = () => {
    const [prefillData, setPrefillData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchPrefill = useCallback(async (golden_id) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.post('/mdm/golden_records/prefill_golden_record', { golden_id });
            setPrefillData(data.data);
            return { ok: true, data: data.data };
        } catch (err) {
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { prefillData, isLoading, isError, fetchPrefill };
};

export const useUpdateGoldenRecord = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateGoldenRecord = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.patch('/mdm/golden_records/update_golden_record', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update golden record.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, updateGoldenRecord };
};

export const use360View = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetch360View = useCallback(async ({ domain_id, golden_id, golden_table }) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data: res } = await api.post('/mdm/golden_records/360_view', {
                domain_id,
                golden_id,
                golden_table,
            });
            setData(res);
            return { ok: true, data: res };
        } catch (err) {
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { data, isLoading, isError, fetch360View };
};
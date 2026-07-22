import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});


export const useDomainManagementHomepage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [metricCounts, setMetricCounts] = useState(null);
    const [domains, setDomains] = useState([]);

    const fetchData = useCallback(async (isRefresh = false) => {
        setIsLoading(true);
        setIsError(false);
        setMetricCounts(null);
        try {
            const { data } = await api.get('/mdm/overview/domain-management-homepage');
            setMetricCounts(data.counts);
            setDomains(
                (data.domains || []).map((domain) => ({
                    id: domain.domain_id,
                    domainName: domain.domain_name,
                    domainCode: domain.domain_code,
                    tableName: domain.table_name,
                    type: domain.type,
                    attributes: domain.attributes ?? 0,
                    records: domain.records ?? 0,
                    dqScore: domain.dq_score ?? 0,
                    status: domain.status === true ? 'Active' : 'Draft',
                    description: domain.description ?? null,
                    createdAt: domain.created_at ?? null,
                    updatedAt: domain.updated_at ?? null,
                }))
            );
            return { ok: true, isRefresh };
        } catch (err) {
            setIsError(true);
            return { ok: false, isRefresh };
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { isLoading, isError, metricCounts, domains, fetchData };
};

export const useDeleteDomain = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteDomain = useCallback(async (domainId, updatedBy) => {
        setIsDeleting(true);
        try {
            const { data } = await api.post('/mdm/overview/domain_management/delete_domain', {
                domain_id: domainId,
                updated_by: updatedBy,
            });
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to delete domain.';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteDomain };
};

export const useAddDomain = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addDomain = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/overview/domain_management/add_domain', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const detail = err?.response?.data?.detail;
            const msg =
                typeof detail === 'object' && detail?.message
                    ? detail.message
                    : typeof detail === 'string'
                    ? detail
                    : err?.response?.data?.message || 'Failed to create domain.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, addDomain };
};

export const useEditDomain = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editDomain = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(
                '/mdm/overview/domain_management/edit_domain',
                payload
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update domain.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, editDomain };
};

export const useDomainDetails = () => {
    const [attrData, setAttrData] = useState([]);
    const [domainId, setDomainId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchDetails = useCallback(async (id) => {
        if (!id) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get(`/mdm/details_by_id?domain_id=${id}`);
            setDomainId(data.domain_id);
            setAttrData(
                (data.attributes || []).map((attr) => ({
                    attribute_id:          attr.attribute_id,
                    attribute_name:        attr.attribute_name,
                    display_name:          attr.display_name,
                    staging_column:        attr.staging_column,
                    staging_display_name:  attr.staging_display_name,
                    data_type:             attr.data_type,
                    length_precision:      attr.length_precision,
                    is_mandatory:          attr.is_mandatory,
                    survivorship_strategy: attr.survivorship_strategy,
                    dq_rules:              attr.dq_rules || [],
                    // table display keys
                    attributeName: attr.attribute_name,
                    dataType:      attr.data_type,
                    required:      attr.is_mandatory ? 'Yes' : 'No',
                    criticality: attr.criticality || '--',
                    dqRule:        (attr.dq_rules || []).map((r) => r.rule_name).join(', ') || '--',
                    dqRules:       attr.dq_rules || [],
                    matchWeight:   attr.match_weight ?? '--',
                    survivorship:  attr.survivorship_strategy || '--',
                }))
            );
            return { ok: true };
        } catch (err) {
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { attrData, domainId, isLoading, isError, fetchDetails, setAttrData };
};

export const useAddAttribute = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addAttribute = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(
                '/mdm/overview/domain_management/add_attribute',
                payload
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to add attributes.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, addAttribute };
};

export const useEditAttribute = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editAttribute = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(
                '/mdm/overview/domain_management/edit_attribute',
                payload
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update attribute.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, editAttribute };
};

export const useDeleteAttribute = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteAttribute = useCallback(async (domainId, attributeIds, updatedBy) => {
        setIsDeleting(true);
        try {
            const { data } = await api.post(
                '/mdm/overview/domain_management/delete_attribute',
                {
                    domain_id: domainId,
                    attribute_id: attributeIds,
                    updated_by: updatedBy,
                }
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to delete attributes.';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteAttribute };
};

export const useAllRules = () => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        api.get('/mdm/list_all_rules')
            .then(({ data }) => setRules(data.data || []))
            .catch((err) => console.error('Failed to fetch rules:', err))
            .finally(() => setIsLoading(false));
    }, []);

    return { rules, isLoading };
};

export const useDomainRules = (domainId, isOpen) => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRules = useCallback(async () => {
        if (!domainId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.post(
                `/mdm/domain_management/rules_by_domain/${domainId}`
            );
            setRules(data.rules || []);
            return { ok: true };
        } catch (err) {
            setIsError(true);
            return { ok: false };
        } finally {
            setIsLoading(false);
        }
    }, [domainId]);

    useEffect(() => {
        if (isOpen && domainId) fetchRules();
    }, [isOpen, domainId, fetchRules]);

    return { rules, isLoading, isError, fetchRules };
};

export const useAddRule = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRule = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post(
                '/mdm/overview/domain_management/add_rule',
                payload
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to add rule.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, addRule };
};

export const useEditRule = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editRule = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.put(
                '/mdm/overview/domain_management/edit_rule',
                payload
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update rule.';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, editRule };
};

export const useValidationTypes = (isOpen) => {
    const [validationTypes, setValidationTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setIsLoading(true);
        api
            .get('/mdm/domain_management/get_validation_types')
            .then(({ data }) => setValidationTypes(data.validation_types || []))
            .catch((err) => console.warn('Failed to fetch validation types:', err))
            .finally(() => setIsLoading(false));
    }, [isOpen]);

    return { validationTypes, isLoading };
};

export const useAttributesByDomain = (domainId, isOpen) => {
    const [attributes, setAttributes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !domainId) return;
        setIsLoading(true);
        api
            .get(`/mdm/details_by_id?domain_id=${domainId}`)
            .then(({ data }) => setAttributes(data.attributes || []))
            .catch((err) => console.warn('Failed to fetch attributes:', err))
            .finally(() => setIsLoading(false));
    }, [isOpen, domainId]);

    return { attributes, isLoading };
};
export const useDeleteRule = (onSuccess) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteRule = useCallback(async (ruleId) => {
        setIsDeleting(true);
        try {
            const { data } = await api.delete(
                `/mdm/overview/domain_management/delete_rule/${ruleId}`
            );
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to delete rule.';
            return { ok: false, message: msg };
        } finally {
            setIsDeleting(false);
        }
    }, [onSuccess]);

    return { isDeleting, deleteRule };
};

export const useDQDimensions = () => {
    const [dimensions, setDimensions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        api.get('/mdm/list_dq_dimensions')
            .then(({ data }) => setDimensions(data.data || []))
            .catch((err) => console.error('Failed to fetch DQ dimensions:', err))
            .finally(() => setIsLoading(false));
    }, []);

    return { dimensions, isLoading };
};

export const useRulesByDimensions = () => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRules = useCallback(async (selectedDimensions) => {
        if (!selectedDimensions || selectedDimensions.length === 0) {
            setRules([]);
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await api.post('/mdm/rules_by_dimension', selectedDimensions);
            setRules(data.data || []);
        } catch (err) {
            console.error('Failed to fetch rules by dimension:', err);
            setRules([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { rules, isLoading, fetchRules };
};


export const useExpressionExample = (validationType) => {
    const [example, setExample] = useState('');

    useEffect(() => {
        if (!validationType) { setExample(''); return; }
        api.get(`/get_expression/${validationType}`)
            .then(res => setExample(res.data ?? ''))
            .catch(() => setExample(''));
    }, [validationType]);

    return { example };
};
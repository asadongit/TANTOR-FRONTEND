import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

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

            } finally {
                setLoading(false);
            }
        };
        fetchDomains();
    }, [isOpen]);

    return { domains, loading };
};

export const useAttributes = (domainId, isOpen) => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !domainId) return;
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

export const useAddMatchRule = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addMatchRule = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/match_config/add_match_rule', payload);
            return { ok: true, data };
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to create rule.';
            return { ok: false, message };
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, addMatchRule };
};

export const useEditMatchRule = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editMatchRule = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.patch('/mdm/match_config/edit_match_rule', payload);
            return { ok: true, data };
        } catch (err) {
            const message =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                'Failed to update rule.';
            return { ok: false, message };
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return { isSubmitting, editMatchRule };
};

export const useMatchConfigHomepage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [metricCounts, setMetricCounts] = useState({});
    const [ruleSets, setRuleSets] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_config/homepage');
            const counts = {};
            (data.match_type_summary ?? []).forEach(({ match_type, rule_count }) => {
                counts[match_type.toUpperCase()] = rule_count;
            });
            setMetricCounts(counts);
            setRuleSets(
                (data.rule_sets ?? []).map((rs) => ({
                    id: rs.rule_set_id,
                    ruleName: rs.rule_set_name,
                    description: rs.rule_description,
                    domain: rs.domain_name,
                    domain_id: rs.domain_id,
                    type: rs.match_type,
                    rules: rs.rule_count,
                    autoMerge: rs.auto_match_threshold,
                    review: rs.review_threshold,
                    status: rs.status,
                }))
            );
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { isLoading, isError, metricCounts, ruleSets, fetchData };
};

export const useMatchRules = (domainId) => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRules = useCallback(async (id) => {
        const resolvedId = id ?? domainId;
        if (!resolvedId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_config/match_rules', {
                params: { domain_id: resolvedId },
            });
            setRules(data.rules ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [domainId]);

    useEffect(() => {
        if (domainId) fetchRules(domainId);
    }, [domainId, fetchRules]);

    return { rules, isLoading, isError, fetchRules };
};


export const useRuleSetRules = (ruleSetId, isOpen) => {
    const [rules, setRules] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRules = useCallback(async () => {
        if (!ruleSetId) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/match_config/rule_set_rules', {
                params: { rule_set_id: ruleSetId },
            });
            setRules(data.rules ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [ruleSetId]);

    useEffect(() => {
        if (isOpen) fetchRules();
        else { setRules([]); setTotal(0); }
    }, [isOpen, fetchRules]);

    return { rules, total, isLoading, isError, fetchRules };
};


export const useToggleRuleStatus = (onSuccess) => {
    const [isToggling, setIsToggling] = useState(false);

    const toggle = useCallback(async (ruleId) => {
        setIsToggling(true);
        try {
            await api.patch(`/mdm/match_config/toggle_rule_status/${ruleId}`);
            onSuccess?.();
            return true;
        } catch {
            return false;
        } finally {
            setIsToggling(false);
        }
    }, [onSuccess]);

    return { isToggling, toggle };
};

export const useCreateRuleSet = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const create = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/mdm/match_config/add_match_ruleset', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail
                || err?.response?.data?.message
                || 'Failed to create ruleset';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, create };
};


export const useEditRuleSet = (onSuccess) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = useCallback(async (payload) => {
        setIsSubmitting(true);
        try {
            const { data } = await api.patch('/mdm/match_config/edit_match_ruleset', payload);
            onSuccess?.(data);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail
                || err?.response?.data?.message
                || 'Failed to update ruleset';
            return { ok: false, message: msg };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSuccess]);

    return { isSubmitting, update };
};

export const useTestMatchAttributes = () => {
    const [attributes, setAttributes] = useState([]);
    const [domainCode, setDomainCode] = useState(null);
    const [attrsLoading, setAttrsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    const fetchByDomainCode = useCallback(async (code) => {
        if (!code) return;
        setAttrsLoading(true);
        setApiError(null);
        setAttributes([]);
        setDomainCode(code);
        try {
            const { data } = await api.get('/match/test/attributes', {
                params: { domain_code: code },
            });
            setAttributes(data.attributes ?? []);
            return data.attributes ?? [];
        } catch (err) {
            const detail = err?.response?.data?.detail;
            const msg = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map((d) => d?.msg ?? d).join(', ')
                    : 'Failed to load attributes for this domain.';
            setApiError(msg);
            return [];
        } finally {
            setAttrsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setAttributes([]);
        setDomainCode(null);
        setApiError(null);
        setAttrsLoading(false);
    }, []);

    return { attributes, domainCode, attrsLoading, apiError, setApiError, fetchByDomainCode, reset };
};

export const useTestMatchConfig = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState(null);
    const [apiError, setApiError] = useState(null);

    const runTest = useCallback(async (payload) => {
        setIsRunning(true);
        setApiError(null);
        try {
            const { data } = await api.post('/match/test', payload);
            setResults(data);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to run test. Please try again.';
            setApiError(msg);
            return { ok: false, message: msg };
        } finally {
            setIsRunning(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResults(null);
        setApiError(null);
    }, []);

    return { isRunning, results, apiError, setApiError, runTest, reset };
};


export const useRulesByDomain = () => {
    const [rules, setRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    const fetchByDomain = useCallback(async (domainId) => {
        setRulesLoading(true);
        setApiError(null);
        setRules([]);
        try {
            const { data } = await api.get('/mdm/match_config/rules_by_domain', {
                params: { domain_id: domainId },
            });
            setRules(data.rules ?? []);
            return data.rules ?? [];
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to load rules for this domain.';
            setApiError(msg);
            return [];
        } finally {
            setRulesLoading(false);
        }
    }, []);

    const fetchByRuleId = useCallback(async (ruleId) => {
        setRulesLoading(true);
        setApiError(null);
        setRules([]);
        try {
            const { data } = await api.get('/mdm/match_config/rule_attributes', {
                params: { rule_id: ruleId },
            });
            setRules([data]);
            return [data];
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to load rule attributes.';
            setApiError(msg);
            return [];
        } finally {
            setRulesLoading(false);
        }
    }, []);

    return { rules, rulesLoading, apiError, setApiError, fetchByDomain, fetchByRuleId };
};

export const useAttributesByLevel = (domainId, enabled) => {
    const [data, setData] = useState({ staging: [], golden: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled || !domainId) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const { data: res } = await api.get(`/mdm/attributes_by_level/${domainId}`);
                setData(res);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [domainId, enabled]);

    return { staging: data.staging ?? [], golden: data.golden ?? [], loading };
};

export const useAlgorithmOptions = () => {
    const [algorithmOptions, setAlgorithmOptions] = useState([]);

    useEffect(() => {
        api.get('/mdm/algorithms')
            .then(({ data }) => {
                setAlgorithmOptions(
                    data.map(algo => ({
                        value: algo,
                        label: algo,
                    }))
                );
            })
            .catch(err =>
                console.error('Failed to fetch algorithms:', err)
            );
    }, []);

    return { algorithmOptions };
};

export const useReorderMatchRules = () => {
    const reorderRules = useCallback(async (payload) => {
        try {
            const { data } = await api.put('/mdm/match_config/reorder_match_rules', payload);
            return { ok: true, data };
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to reorder rules.';
            return { ok: false, message: msg };
        }
    }, []);

    return { reorderRules };
};
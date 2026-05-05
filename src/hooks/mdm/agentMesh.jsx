import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

const computeMetrics = (agents = []) => ({
    active_agents: agents.filter((a) => a.status === 'ACTIVE').length,
    tasks_today:   '0',
    avg_latency:   '0ms',
    success_rate:  '0',
});

export const useAgentCatalog = () => {
    const [isLoading, setIsLoading]       = useState(true);
    const [isError, setIsError]           = useState(false);
    const [agents, setAgents]             = useState([]);
    const [metricCounts, setMetricCounts] = useState(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        setIsLoading(true);
        setIsError(false);
        setMetricCounts(null);
        try {
            const { data } = await api.get('/mdm/agent_mesh/agent_catalog');
            const list = data?.data ?? [];
            setAgents(list);
            setMetricCounts(computeMetrics(list));
            return { ok: true, isRefresh };
        } catch (err) {
            setIsError(true);
            return { ok: false, isRefresh };
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { isLoading, isError, agents, metricCounts, fetchData };
};
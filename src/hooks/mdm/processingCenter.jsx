import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameMDM = window._env_?.VITE_MDM_API;
const hostnameV1 = window._env_?.VITE_FAST_API;

const api = axios.create({
    baseURL: hostnameMDM,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

const apiV1 = axios.create({
    baseURL: window._env_?.VITE_FAST_API,
    withCredentials: true,
    headers: { accept: 'application/json' },
});


export const useRecentRuns = () => {
    const [runs, setRuns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchRecentRuns = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/processing_center/recent_runs');
            setRuns(data ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentRuns();
    }, [fetchRecentRuns]);

    return { runs, isLoading, isError, fetchRecentRuns };
};

export const useScheduledRuns = () => {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchScheduledRuns = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/processing_center/scheduled_runs');
            setSchedules(data ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScheduledRuns();
    }, [fetchScheduledRuns]);

    return { schedules, isLoading, isError, fetchScheduledRuns };
};

export const useActiveRules = () => {
    const [activeRules, setActiveRules] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchActiveRules = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/processing_center/active_rules');
            setActiveRules(data ?? {});
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveRules();
    }, [fetchActiveRules]);

    return { activeRules, isLoading, isError, fetchActiveRules };
};

export const useDomains = () => {
    const [domains, setDomains] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchDomains = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/mdm/domains_listing');
            setDomains(data ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    return { domains, isLoading, isError, fetchDomains };
};

export const useConnections = (username) => {
    const [connections, setConnections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchConnections = useCallback(async () => {
        if (!username) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await apiV1.get('/list_by_name', {
                params: { user: username },
            });
            setConnections(data ?? []);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    return { connections, isLoading, isError, fetchConnections };
};
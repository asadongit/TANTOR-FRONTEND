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
    baseURL: hostnameV1,
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

export const useDomains = ({ enabled = true } = {}) => {
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
        if (!enabled) return;
        fetchDomains();
    }, [fetchDomains, enabled]);  

    return { domains, isLoading, isError, fetchDomains };
};

export const useConnections = (username, { enabled = true } = {}) => {
    const [connections, setConnections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchConnections = useCallback(async () => {
        if (!username) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await apiV1.get('/processing_center/connections/list', {
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
        if (!enabled) return;
        fetchConnections();
    }, [fetchConnections, enabled]);

    return { connections, isLoading, isError, fetchConnections };
};

export const useTriggerMdmDag = () => {
    const [isTriggering, setIsTriggering] = useState(false);
    const [isError, setIsError] = useState(false);

    const triggerDag = useCallback(async ({ connectionName, domainName, steps, recordSelection,  createdBy }) => {
        setIsTriggering(true);
        setIsError(false);
        try {
            const { data } = await api.post('/workflows/trigger-mdm-dag', {
                connection_name: connectionName,
                domain_name: domainName,
                steps,
                record_selection: recordSelection,
                created_by: createdBy,
            });
            return data;
        } catch (err) {
            setIsError(true);
            throw err;
        } finally {
            setIsTriggering(false);
        }
    }, []);

    return { triggerDag, isTriggering, isError };
};

export const useTriggerWorkflow = () => {
    const [isTriggering, setIsTriggering] = useState(false);
    const [isError, setIsError] = useState(false);

    const triggerWorkflow = useCallback(async ({ dagId }) => {
        setIsTriggering(true);
        setIsError(false);
        try {
            const { data } = await api.post('/workflows/trigger-workflow', {
                dag_id: dagId,
            });
            return data;
        } catch (err) {
            setIsError(true);
            throw err;
        } finally {
            setIsTriggering(false);
        }
    }, []);

    return { triggerWorkflow, isTriggering, isError };
};

export const useCheckDagStatus = () => {
    const checkDagExists = useCallback(async (dagId) => {
        try {
            const { data } = await api.get(`/workflows/dag-status/${dagId}`);
            return !!data?.exists;
        } catch {
            return false;
        }
    }, []);

    return { checkDagExists };
};


export const useCreateSchedule = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createSchedule = async (payload) => {
    setIsCreating(true);
    try {
      const res = await api.post('/processing_center/schedule_run', payload);
      return res.data;
    } finally {
      setIsCreating(false);
    }
  };

  return { createSchedule, isCreating };
};

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const hostnameAuth = `${window._env_?.VITE_FAST_API}/auth/`;

const api = axios.create({
    baseURL: hostnameAuth,
    withCredentials: true,
    headers: { accept: 'application/json' },
});

export const usePersonaStatuses = () => {
    const [personaStatuses, setPersonaStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const fetchPersonaStatuses = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const { data } = await api.get('/persona_statuses');
            setPersonaStatuses(data);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPersonaStatuses();
    }, [fetchPersonaStatuses]);

    return { personaStatuses, isLoading, isError, fetchPersonaStatuses };
};
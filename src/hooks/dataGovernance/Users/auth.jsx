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
    const [errorMessage, setErrorMessage] = useState('');

    const fetchPersonaStatuses = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage('');
        try {
            const { data } = await api.get('/persona_statuses');
            setPersonaStatuses(data);
       } catch (err) {
            setIsError(true);
            
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    err?.response?.data?.detail ||
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to fetch persona statuses.'
                );
            } else if (err instanceof Error) {
                setErrorMessage(err.message);
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
            
            console.error('Failed to fetch persona statuses:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPersonaStatuses();
    }, [fetchPersonaStatuses]);

    return { personaStatuses, isLoading, isError, errorMessage, fetchPersonaStatuses };
};
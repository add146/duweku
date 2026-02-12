import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Workspace {
    id: string;
    name: string;
    type: string;
    role: string;
}

interface WorkspaceContextType {
    workspaces: Workspace[];
    selectedWorkspace: Workspace | null;
    setSelectedWorkspaceId: (id: string) => void;
    refreshWorkspaces: () => Promise<void>;
    loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(
        localStorage.getItem('selectedWorkspaceId')
    );
    const [loading, setLoading] = useState(true);

    const fetchWorkspaces = async () => {
        try {
            const res = await apiFetch<{ data: Workspace[] }>('/workspaces');
            setWorkspaces(res.data);

            // If no selected workspace or invalid, select first
            if (res.data.length > 0) {
                if (!selectedWorkspaceId || !res.data.find(w => w.id === selectedWorkspaceId)) {
                    setSelectedWorkspaceId(res.data[0].id);
                }
            } else {
                setSelectedWorkspaceIdState(null);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error);
        } finally {
            setLoading(false);
        }
    };

    const setSelectedWorkspaceId = (id: string) => {
        setSelectedWorkspaceIdState(id);
        localStorage.setItem('selectedWorkspaceId', id);
    };

    useEffect(() => {
        // Only fetch if we have a token (user logged in)
        if (localStorage.getItem('token')) {
            fetchWorkspaces();
        } else {
            setLoading(false);
        }
    }, []);

    const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId) || null;

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            selectedWorkspace,
            setSelectedWorkspaceId,
            refreshWorkspaces: fetchWorkspaces,
            loading
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}

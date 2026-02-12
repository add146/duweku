const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

interface FetchOptions extends RequestInit {
    token?: string;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, headers, ...rest } = options;

    const authHeader: Record<string, string> = {};
    const savedToken = localStorage.getItem('token');
    if (token || savedToken) {
        authHeader['Authorization'] = `Bearer ${token || savedToken}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...authHeader,
            ...headers,
        },
        ...rest,
    });

    if (!res.ok) {
        if (res.status === 401) {
            // Clear token and redirect if needed (or let caller handle)
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Force redirect? Better to throw and handle in context.
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${res.statusText}`);
    }

    return res.json() as Promise<T>;
}

export const auth = {
    login: (data: any) => apiFetch<{ token: string, user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => apiFetch<{ token: string, user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiFetch<{ user: any }>('/auth/me'),
};

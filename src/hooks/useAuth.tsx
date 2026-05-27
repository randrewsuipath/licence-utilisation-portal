import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { UiPath } from '@uipath/uipath-typescript/core';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript/core';

interface AuthContextType {
    sdk: UiPath | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    error: string | null;
    login: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getConfig(): UiPathSDKConfig {
    const pathname = window.location.pathname.replace(/\/$/, '');
    const redirectUri = import.meta.env.VITE_UIPATH_REDIRECT_URI || `${window.location.origin}${pathname}`;

    return {
        baseUrl: import.meta.env.VITE_UIPATH_BASE_URL || 'https://api.uipath.com',
        orgName: import.meta.env.VITE_UIPATH_ORG_NAME || '',
        tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME || 'DefaultTenant',
        clientId: import.meta.env.VITE_UIPATH_CLIENT_ID || '',
        redirectUri,
        scope: import.meta.env.VITE_UIPATH_SCOPE || '',
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [sdk, setSdk] = useState<UiPath | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const config = getConfig();
                const instance = new UiPath(config);

                if (instance.isInOAuthCallback()) {
                    await instance.completeOAuth();
                    if (!cancelled) {
                        setSdk(instance);
                        setIsAuthenticated(true);
                        setIsInitializing(false);
                    }
                    return;
                }

                if (!cancelled) {
                    setSdk(instance);
                    setIsAuthenticated(instance.isAuthenticated());
                    setIsInitializing(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : String(err));
                    setIsInitializing(false);
                }
            }
        };

        init();
        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async () => {
        if (!sdk) return;
        try {
            setError(null);
            await sdk.initialize();
            setIsAuthenticated(sdk.isAuthenticated());
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [sdk]);

    const logout = useCallback(() => {
        if (!sdk) return;
        sdk.logout();
        setIsAuthenticated(false);
        setError(null);
    }, [sdk]);

    return (
        <AuthContext.Provider value={{ sdk, isAuthenticated, isInitializing, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}

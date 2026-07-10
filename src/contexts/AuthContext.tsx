import { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

// ─── Clean user shape from our Express API ────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Super Admin' | 'Admin' | 'Support Agent' | 'Finance Manager' | 'Affiliate Manager' | 'Trader' | string;
  kycStatus: string;
  createdAt: string;
}

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (email: string, password: string, fullName: string) => Promise<AppUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signUp: async () => { throw new Error('AuthProvider not mounted'); },
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function persistSession(token: string, refreshToken: string | undefined, user: AppUser) {
  localStorage.setItem('quantum_token', token);
  if (refreshToken) localStorage.setItem('quantum_refresh_token', refreshToken);
  localStorage.setItem('quantum_user_role', user.role);
  localStorage.setItem('quantum_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('quantum_token');
  localStorage.removeItem('quantum_refresh_token');
  localStorage.removeItem('quantum_user_role');
  localStorage.removeItem('quantum_user');
  // Legacy keys from old mock system
  localStorage.removeItem('quantum_mock_user');
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('quantum_token');

      if (!token) {
        // Try legacy mock user key for backwards compat
        const legacyUser = localStorage.getItem('quantum_mock_user');
        if (legacyUser) {
          try {
            const parsed = JSON.parse(legacyUser);
            // Map legacy shape → AppUser
            const appUser: AppUser = {
              id: parsed.id,
              email: parsed.email,
              fullName: parsed.user_metadata?.full_name || parsed.fullName || '',
              role: parsed.role || 'Trader',
              kycStatus: parsed.kycStatus || 'Unsubmitted',
              createdAt: parsed.created_at || parsed.createdAt || new Date().toISOString(),
            };
            setUser(appUser);
          } catch { /* ignore */ }
        }
        setLoading(false);
        return;
      }

      try {
        // Verify token is still valid by calling /auth/me
        const data = await api.get<AppUser>('/auth/me');
        setUser(data);
        localStorage.setItem('quantum_user', JSON.stringify(data));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Token expired — api.ts will auto-attempt refresh before throwing,
          // so if we're here it means refresh also failed. Clear everything.
          clearSession();
          setUser(null);
        } else {
          // Network error or server down — restore from cache so user isn't logged out
          const cachedUser = localStorage.getItem('quantum_user') || localStorage.getItem('quantum_mock_user');
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser);
              const appUser: AppUser = {
                id: parsed.id,
                email: parsed.email,
                fullName: parsed.user_metadata?.full_name || parsed.fullName || '',
                role: parsed.role || 'Trader',
                kycStatus: parsed.kycStatus || 'Unsubmitted',
                createdAt: parsed.created_at || parsed.createdAt || new Date().toISOString(),
              };
              setUser(appUser);
            } catch { setUser(null); }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Sign In ────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<AppUser> => {
    const data = await api.post<{
      token: string;
      refreshToken?: string;
      user: AppUser;
    }>('/auth/login', { email, password });

    persistSession(data.token, data.refreshToken, data.user);
    setUser(data.user);
    return data.user;
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string): Promise<AppUser> => {
    const data = await api.post<{
      token: string;
      refreshToken?: string;
      user: AppUser;
    }>('/auth/register', { email, password, fullName });

    persistSession(data.token, data.refreshToken, data.user);
    setUser(data.user);
    return data.user;
  };

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const signOut = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

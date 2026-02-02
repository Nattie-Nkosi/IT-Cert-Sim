import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type Theme = 'light' | 'dark' | 'system';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  theme: Theme;
  hasHydrated: boolean;
  setAuth: (user: User, token: string, refreshToken: string, expiresIn: number) => void;
  setTokens: (token: string, refreshToken: string, expiresIn: number) => void;
  logout: () => void;
  setTheme: (theme: Theme) => void;
  setHasHydrated: (state: boolean) => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      theme: 'system',
      hasHydrated: false,
      setAuth: (user, token, refreshToken, expiresIn) => {
        set({
          user,
          token,
          refreshToken,
          tokenExpiresAt: Date.now() + expiresIn * 1000,
        });
      },
      setTokens: (token, refreshToken, expiresIn) => {
        set({
          token,
          refreshToken,
          tokenExpiresAt: Date.now() + expiresIn * 1000,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiresAt: null,
        });
      },
      setTheme: (theme) => {
        set({ theme });
      },
      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      },
      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        return Date.now() >= tokenExpiresAt - 60000; // 1 minute buffer
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

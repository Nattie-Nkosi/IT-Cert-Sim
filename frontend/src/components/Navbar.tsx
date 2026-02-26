'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, theme, setTheme, refreshToken } = useAuthStore();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Continue with logout even if API call fails
      }
    }
    logout();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IT</span>
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                Cert Simulator
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex space-x-0.5">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    isActive('/dashboard')
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:text-primary hover:border-primary/40'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/certifications"
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    pathname?.startsWith('/certifications')
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:text-primary hover:border-primary/40'
                  }`}
                >
                  Certifications
                </Link>
                <Link
                  href="/exams"
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    isActive('/exams')
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:text-primary hover:border-primary/40'
                  }`}
                >
                  Exams
                </Link>
                <Link
                  href="/history"
                  className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    isActive('/history')
                      ? 'border-primary text-primary'
                      : 'border-transparent hover:text-primary hover:border-primary/40'
                  }`}
                >
                  History
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                      pathname?.startsWith('/admin')
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-orange-600 hover:border-orange-400 dark:text-orange-400'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-primary/10 transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : theme === 'dark' ? (
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 border transition-colors ${
                    isActive('/profile')
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className="w-6 h-6 bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-sky-600 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

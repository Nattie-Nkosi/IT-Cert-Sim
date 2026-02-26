'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, theme, setTheme, refreshToken } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    toast.success('Signed out successfully');
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname?.startsWith(path);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', active: isActive('/dashboard') },
    { href: '/certifications', label: 'Certifications', active: isActivePrefix('/certifications') },
    { href: '/exams', label: 'Exams', active: isActive('/exams') },
    { href: '/history', label: 'History', active: isActive('/history') },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Desktop Nav */}
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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                      link.active
                        ? 'border-primary text-primary'
                        : 'border-transparent hover:text-primary hover:border-primary/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                      isActivePrefix('/admin')
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

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-primary/10 transition-colors"
              aria-label={`Theme: ${theme}. Click to change.`}
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

            {/* Desktop user actions */}
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
                  className="hidden md:block px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
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
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-primary/10 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-x-0 top-16 bg-background border-b z-50 md:hidden overflow-y-auto max-h-[calc(100vh-4rem)]">
            {user ? (
              <div className="flex flex-col">
                {/* User info */}
                <Link href="/profile" className="flex items-center gap-3 px-4 py-4 border-b hover:bg-primary/5 transition-colors">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </Link>

                {/* Nav links */}
                <div className="py-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        link.active
                          ? 'bg-primary/5 text-primary border-l-4 border-primary'
                          : 'border-l-4 border-transparent hover:bg-primary/5 hover:text-primary'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        isActivePrefix('/admin')
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-l-4 border-orange-500'
                          : 'border-l-4 border-transparent text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t px-4 py-3">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col p-4 gap-2">
                <Link
                  href="/login"
                  className="w-full px-4 py-3 text-sm font-medium border border-border hover:border-primary text-center transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-sky-600 text-center transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}

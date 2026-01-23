'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <span className="text-2xl">🎓</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                IT Cert Simulator
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex space-x-1">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/certifications"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname?.startsWith('/certifications')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  Certifications
                </Link>
                <Link
                  href="/exams"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/exams')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  Exams
                </Link>
                <Link
                  href="/history"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/history')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  History
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/upload"
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      pathname?.startsWith('/admin')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-primary/5 rounded-md">
                  <span className="text-xs text-muted-foreground">Welcome,</span>
                  <span className="text-sm font-medium text-primary">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-all hover:scale-105 shadow-sm"
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

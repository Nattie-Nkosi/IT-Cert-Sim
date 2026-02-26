'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken, expiresIn } = response.data;
      setAuth(user, token, refreshToken, expiresIn);
      toast.success(`Welcome back, ${user.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;

      if (err.response?.status === 423) {
        setIsLocked(true);
        setError(`Account locked. Try again in ${data.remainingMinutes} minutes.`);
      } else if (data?.remainingAttempts !== undefined) {
        setWarning(`${data.remainingAttempts} attempts remaining before account lockout`);
        setError(data.error || 'Invalid credentials');
      } else if (data?.lockedForMinutes) {
        setIsLocked(true);
        setError(`Account locked for ${data.lockedForMinutes} minutes due to too many failed attempts`);
      } else {
        setError(data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="border-l-4 border-primary pl-4 mb-8">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your IT certification practice
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border p-8 bg-card">
          {error && (
            <div className={`p-3 text-sm border-l-4 ${
              isLocked
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-500'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-500'
            }`}>
              {isLocked && <span className="font-bold">🔒 </span>}
              {error}
            </div>
          )}

          {warning && !isLocked && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm border-l-4 border-yellow-500">
              ⚠️ {warning}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
              disabled={isLocked}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
              disabled={isLocked}
            />
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : isLocked ? 'Account Locked' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

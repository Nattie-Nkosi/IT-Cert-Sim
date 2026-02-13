'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow border">
        <div>
          <h2 className="text-3xl font-bold text-center">Login</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Access your IT certification practice
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className={`p-3 rounded-md text-sm ${
              isLocked
                ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {isLocked && <span className="font-bold">🔒 </span>}
              {error}
            </div>
          )}

          {warning && !isLocked && (
            <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm border border-yellow-500/30">
              ⚠️ {warning}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={isLocked}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={isLocked}
            />
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : isLocked ? 'Account Locked' : 'Login'}
          </button>

          <p className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

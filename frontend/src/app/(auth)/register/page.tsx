'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const passwordRequirements = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special character (@$!%*?&)', test: (p: string) => /[@$!%*?&]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  const isPasswordValid = passwordChecks.every((c) => c.passed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token, refreshToken, expiresIn } = response.data;
      setAuth(user, token, refreshToken, expiresIn);
      router.push('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requirements) {
        setError(`${data.error}: ${data.requirements.join(', ')}`);
      } else {
        setError(data?.error || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="border-l-4 border-primary pl-4 mb-8">
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your certification journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 border p-8 bg-card">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border-l-4 border-red-500">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
            />
          </div>

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
            />

            {password && (
              <div className="mt-3 p-3 bg-muted border-l-4 border-primary/30">
                <p className="text-xs font-medium mb-2">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`text-xs flex items-center gap-1 ${
                        check.passed ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{check.passed ? '✓' : '○'}</span>
                      {check.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

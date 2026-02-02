'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  REGISTER: 'bg-blue-100 text-blue-700',
  EXAM_START: 'bg-purple-100 text-purple-700',
  EXAM_SUBMIT: 'bg-indigo-100 text-indigo-700',
  EXAM_TAB_SWITCH: 'bg-yellow-100 text-yellow-700',
  EXAM_FLAGGED: 'bg-red-100 text-red-700',
  ADMIN_CREATE: 'bg-teal-100 text-teal-700',
  ADMIN_UPDATE: 'bg-cyan-100 text-cyan-700',
  ADMIN_DELETE: 'bg-orange-100 text-orange-700',
  SECURITY_EVENT: 'bg-red-100 text-red-700',
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchLogs();
  }, [token, user, router, hasHydrated, filter]);

  const fetchLogs = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = loadMore ? page + 1 : 1;
      const url = filter === 'all'
        ? `/admin/audit-logs?page=${currentPage}&limit=50`
        : `/admin/audit-logs?page=${currentPage}&limit=50&action=${filter}`;

      const response = await api.get(url);

      if (loadMore) {
        setLogs((prev) => [...prev, ...response.data.logs]);
        setPage(currentPage);
      } else {
        setLogs(response.data.logs);
      }

      setHasMore(response.data.hasMore);
    } catch (err: any) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return '-';
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const filterOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'LOGIN', label: 'Logins' },
    { value: 'LOGIN_FAILED', label: 'Failed Logins' },
    { value: 'REGISTER', label: 'Registrations' },
    { value: 'EXAM_START', label: 'Exam Started' },
    { value: 'EXAM_SUBMIT', label: 'Exam Submitted' },
    { value: 'EXAM_TAB_SWITCH', label: 'Tab Switches' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
          Audit Logs
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitor user activity and security events
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex gap-2 flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === option.value
                  ? 'bg-gradient-to-r from-primary to-sky-600 text-white shadow-md'
                  : 'bg-primary/5 hover:bg-primary/10 text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-sky-500/5 rounded-xl shadow-sm border border-primary/10">
          <p className="text-muted-foreground">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-card rounded-xl shadow-sm border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">
                      {formatDetails(log.details)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchLogs(true)}
                className="px-6 py-3 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 font-semibold transition-all"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

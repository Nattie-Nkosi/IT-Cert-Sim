'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  LOGIN: 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  LOGOUT: 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
  LOGIN_FAILED: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  REGISTER: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  EXAM_START: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
  EXAM_SUBMIT: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  EXAM_TAB_SWITCH: 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  EXAM_FLAGGED: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  ADMIN_CREATE: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400',
  ADMIN_UPDATE: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
  ADMIN_DELETE: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  SECURITY_EVENT: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400',
};

const RETENTION_OPTIONS = [
  { label: 'Older than 30 days', days: 30 },
  { label: 'Older than 60 days', days: 60 },
  { label: 'Older than 90 days', days: 90 },
  { label: 'Older than 180 days', days: 180 },
  { label: 'Older than 1 year', days: 365 },
];

const ACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'LOGIN', label: 'Logins' },
  { value: 'LOGIN_FAILED', label: 'Failed Logins' },
  { value: 'REGISTER', label: 'Registrations' },
  { value: 'EXAM_START', label: 'Exam Started' },
  { value: 'EXAM_SUBMIT', label: 'Exam Submitted' },
  { value: 'EXAM_TAB_SWITCH', label: 'Tab Switches' },
];

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [purgeRetention, setPurgeRetention] = useState(90);
  const [purgeAction, setPurgeAction] = useState('all');
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchLogs();
  }, [token, user, router, hasHydrated, filter, startDate, endDate]);

  const buildUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    params.set('page', String(pageNum));
    params.set('limit', '50');
    if (filter !== 'all') params.set('action', filter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return `/admin/audit-logs?${params.toString()}`;
  };

  const fetchLogs = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = loadMore ? page + 1 : 1;
      const response = await api.get(buildUrl(currentPage));

      if (loadMore) {
        setLogs((prev) => [...prev, ...response.data.logs]);
        setPage(currentPage);
      } else {
        setLogs(response.data.logs);
      }

      setTotal(response.data.total);
      setHasMore(response.data.hasMore);
    } catch (err: any) {
      setError('Failed to load audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    try {
      const params = new URLSearchParams({ olderThanDays: String(purgeRetention) });
      if (purgeAction !== 'all') params.set('action', purgeAction);

      const response = await api.delete(`/admin/audit-logs/purge?${params.toString()}`);
      const { deleted, cutoffDate } = response.data;

      toast.success(`Purged ${deleted} log${deleted !== 1 ? 's' : ''} older than ${new Date(cutoffDate).toLocaleDateString()}`);
      fetchLogs();
    } catch (err: any) {
      toast.error('Failed to purge logs');
      console.error(err);
    } finally {
      setPurging(false);
    }
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return '-';
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const hasDateFilter = startDate || endDate;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold mb-3 text-primary">Audit Logs</h1>
          <p className="text-lg text-muted-foreground">Monitor user activity and security events</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="px-4 py-2 text-sm font-semibold bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors">
              Purge Old Logs
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purge Audit Logs</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently delete audit log records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Delete logs</label>
                <select
                  value={purgeRetention}
                  onChange={(e) => setPurgeRetention(Number(e.target.value))}
                  className="w-full border bg-background px-3 py-2 text-sm"
                >
                  {RETENTION_OPTIONS.map((o) => (
                    <option key={o.days} value={o.days}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold">Action type (optional)</label>
                <select
                  value={purgeAction}
                  onChange={(e) => setPurgeAction(e.target.value)}
                  className="w-full border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All actions</option>
                  {Object.keys(actionColors).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-muted-foreground bg-muted px-3 py-2">
                This will permanently delete{' '}
                <strong>
                  {purgeAction === 'all' ? 'all' : purgeAction}
                </strong>{' '}
                logs older than <strong>{purgeRetention} days</strong>.
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePurge}
                disabled={purging}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {purging ? 'Purging...' : 'Purge Logs'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {/* Action filter */}
      <div className="bg-card p-4 border mb-4">
        <div className="flex gap-2 flex-wrap">
          {ACTION_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                filter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-card p-4 border mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border bg-background px-3 py-2 text-sm"
            />
          </div>
          {hasDateFilter && (
            <button
              onClick={clearDateFilters}
              className="px-3 py-2 text-sm border hover:bg-accent transition-colors"
            >
              Clear dates
            </button>
          )}
          {!loading && (
            <span className="ml-auto text-sm text-muted-foreground self-center">
              {logs.length} of <strong>{total.toLocaleString()}</strong> logs
            </span>
          )}
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground mt-4">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-card border">
          <p className="text-muted-foreground">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-card border">
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
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-bold ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">{formatDetails(log.details)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchLogs(true)}
                className="px-6 py-3 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold transition-all"
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

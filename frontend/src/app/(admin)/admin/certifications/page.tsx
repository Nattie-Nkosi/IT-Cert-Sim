'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Certification {
  id: string;
  name: string;
  code: string;
  description: string | null;
  vendor: string;
  _count?: {
    questions: number;
    exams: number;
  };
}

export default function AdminCertificationsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<Certification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchCertifications();
  }, [token, user, router, hasHydrated]);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certifications');
      setCertifications(response.data);
    } catch (err: any) {
      setError('Failed to load certifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !code || !vendor) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.post('/admin/certifications', {
        name,
        code,
        vendor,
        description: description || undefined,
      });

      setSuccess('Certification created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchCertifications();
    } catch (err: any) {
      setError('Failed to create certification: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (cert: Certification) => {
    setCertToDelete(cert);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!certToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/certifications/${certToDelete.id}`);
      setCertifications((prev) => prev.filter((c) => c.id !== certToDelete.id));
      setDeleteDialogOpen(false);
      setCertToDelete(null);
      setSuccess('Certification deleted successfully!');
    } catch (err: any) {
      setError('Failed to delete certification: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setVendor('');
    setDescription('');
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
            Certification Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Create and manage IT certifications
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setError('');
            setSuccess('');
          }}
          className="px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 font-semibold shadow-lg transition-all hover:scale-105"
        >
          Add Certification
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading certifications...</p>
        </div>
      ) : certifications.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-sky-500/5 rounded-xl shadow-sm border border-primary/10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📜</span>
          </div>
          <p className="text-muted-foreground mb-4">No certifications found</p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setError('');
              setSuccess('');
            }}
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-md font-semibold"
          >
            Create First Certification
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-wide">
                    {cert.vendor}
                  </span>
                  <h3 className="text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                    {cert.name}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-sm rounded-lg">
                  {cert.code}
                </span>
              </div>

              {cert.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {cert.description}
                </p>
              )}

              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold">
                    {cert._count?.questions || 0}
                  </span>
                  <span className="text-muted-foreground">Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold">
                    {cert._count?.exams || 0}
                  </span>
                  <span className="text-muted-foreground">Exams</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/questions?certificationId=${cert.id}`}
                  className="flex-1 px-4 py-2 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 text-center text-sm font-semibold transition-all"
                >
                  Manage Questions
                </Link>
                <button
                  onClick={() => handleDeleteClick(cert)}
                  className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-semibold transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Certification</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-muted-foreground hover:text-foreground text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Microsoft, CompTIA, Cisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Certification Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Microsoft 365 Endpoint Administrator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., MD-102"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brief description of the certification..."
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating || !name || !code || !vendor}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold shadow-lg transition-all"
                >
                  {creating ? 'Creating...' : 'Create Certification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{certToDelete?.name} ({certToDelete?.code})</span>?
              This will also delete all associated questions and exams. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

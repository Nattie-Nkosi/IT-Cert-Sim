'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Certification {
  id: string;
  name: string;
  code: string;
  vendor: string;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  certification: {
    id: string;
    name: string;
  };
}

interface Exam {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  passingScore: number;
  isActive: boolean;
  certification: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    questions: number;
  };
}

export default function AdminExamsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [exams, setExams] = useState<Exam[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);

  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(90);
  const [examPassingScore, setExamPassingScore] = useState(70);
  const [examCertificationId, setExamCertificationId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [showNewCertForm, setShowNewCertForm] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [newCertCode, setNewCertCode] = useState('');
  const [newCertVendor, setNewCertVendor] = useState('');
  const [newCertDescription, setNewCertDescription] = useState('');
  const [creatingCert, setCreatingCert] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [token, user, router, hasHydrated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certsRes, examsRes] = await Promise.all([
        api.get('/certifications'),
        api.get('/exams'),
      ]);
      setCertifications(certsRes.data);
      setExams(examsRes.data);
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (certificationId: string) => {
    try {
      const response = await api.get(`/questions/certification/${certificationId}`);
      setQuestions(response.data);
    } catch (err: any) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]);
    }
  };

  const handleCertificationChange = (certId: string) => {
    setExamCertificationId(certId);
    if (certId) {
      fetchQuestions(certId);
    } else {
      setQuestions([]);
    }
    setSelectedQuestions([]);
  };

  const handleCreateExam = async () => {
    if (!examName || !examCertificationId || selectedQuestions.length === 0) {
      setError('Please fill all required fields and select at least one question');
      return;
    }

    try {
      await api.post('/admin/exams', {
        name: examName,
        description: examDescription || undefined,
        duration: examDuration,
        passingScore: examPassingScore,
        certificationId: examCertificationId,
        questionIds: selectedQuestions,
      });

      setSuccess('Exam created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError('Failed to create exam: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const resetForm = () => {
    setExamName('');
    setExamDescription('');
    setExamDuration(90);
    setExamPassingScore(70);
    setExamCertificationId('');
    setSelectedQuestions([]);
    setQuestions([]);
    setShowNewCertForm(false);
    setNewCertName('');
    setNewCertCode('');
    setNewCertVendor('');
    setNewCertDescription('');
  };

  const handleCreateCertification = async () => {
    if (!newCertName || !newCertCode || !newCertVendor) {
      setError('Please fill in all required certification fields');
      return;
    }

    setCreatingCert(true);
    try {
      const response = await api.post('/admin/certifications', {
        name: newCertName,
        code: newCertCode,
        vendor: newCertVendor,
        description: newCertDescription || undefined,
      });

      setCertifications((prev) => [...prev, response.data]);
      setExamCertificationId(response.data.id);
      setShowNewCertForm(false);
      setNewCertName('');
      setNewCertCode('');
      setNewCertVendor('');
      setNewCertDescription('');
      setSuccess('Certification created! Now add questions.');
    } catch (err: any) {
      setError('Failed to create certification: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreatingCert(false);
    }
  };

  const handleEditExam = async (examId: string) => {
    try {
      setError('');
      setSuccess('');
      const [examRes, questionsRes] = await Promise.all([
        api.get(`/admin/exams/${examId}`),
        api.get(`/questions/certification/${exams.find(e => e.id === examId)?.certification.id}`),
      ]);

      setEditingExam(examRes.data);
      setQuestions(questionsRes.data);
      setSelectedQuestions(examRes.data.questions.map((eq: any) => eq.questionId));
      setShowEditModal(true);
    } catch (err: any) {
      setError('Failed to load exam details: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateExamQuestions = async () => {
    if (!editingExam || selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      await api.put(`/admin/exams/${editingExam.id}/questions`, {
        questionIds: selectedQuestions,
      });

      setSuccess('Exam updated successfully!');
      setShowEditModal(false);
      setEditingExam(null);
      setSelectedQuestions([]);
      fetchData();
    } catch (err: any) {
      setError('Failed to update exam: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSyncQuestions = async (examId: string) => {
    try {
      setError('');
      const response = await api.post(`/admin/exams/${examId}/sync-questions`);
      setSuccess(response.data.message);
      fetchData();
    } catch (err: any) {
      setError('Failed to sync questions: ' + (err.response?.data?.message || err.message));
    }
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
            Exam Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Create and manage exams
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setError('');
            setSuccess('');
          }}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold shadow-lg transition-all"
        >
          Create New Exam
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg border border-green-500/30">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-muted-foreground mb-4">No exams found</p>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setError('');
              setSuccess('');
            }}
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-md font-semibold"
          >
            Create First Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold flex-1">{exam.name}</h3>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    exam.isActive
                      ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {exam.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {exam.certification.name} ({exam.certification.code})
              </p>

              {exam.description && (
                <p className="text-sm mb-4 line-clamp-2">{exam.description}</p>
              )}

              <div className="space-y-2 mb-4 text-sm bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-semibold text-primary">{exam._count?.questions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">{exam.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-semibold">{exam.passingScore}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditExam(exam.id)}
                  className="flex-1 px-4 py-2 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 text-primary font-semibold transition-all"
                >
                  Edit Questions
                </button>
                <button
                  onClick={() => handleSyncQuestions(exam.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all"
                  title="Add all certification questions to this exam"
                >
                  Sync All
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create New Exam</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Exam Name</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., CompTIA Network+ Practice Exam 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Certification</label>
                  {!showNewCertForm ? (
                    <div className="space-y-2">
                      <select
                        value={examCertificationId}
                        onChange={(e) => handleCertificationChange(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select certification...</option>
                        {certifications.map((cert) => (
                          <option key={cert.id} value={cert.id}>
                            {cert.vendor} - {cert.name} ({cert.code})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewCertForm(true)}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        + Create New Certification
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">New Certification</span>
                        <button
                          type="button"
                          onClick={() => setShowNewCertForm(false)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={newCertVendor}
                          onChange={(e) => setNewCertVendor(e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Vendor (e.g., Microsoft)"
                        />
                        <input
                          type="text"
                          value={newCertCode}
                          onChange={(e) => setNewCertCode(e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Code (e.g., MD-102)"
                        />
                      </div>
                      <input
                        type="text"
                        value={newCertName}
                        onChange={(e) => setNewCertName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Name (e.g., Microsoft 365 Endpoint Administrator)"
                      />
                      <textarea
                        value={newCertDescription}
                        onChange={(e) => setNewCertDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Description (optional)"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCertification}
                        disabled={creatingCert || !newCertName || !newCertCode || !newCertVendor}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {creatingCert ? 'Creating...' : 'Create Certification'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
                  <textarea
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brief description of the exam"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={examDuration}
                      onChange={(e) => setExamDuration(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Passing Score (%)</label>
                    <input
                      type="number"
                      value={examPassingScore}
                      onChange={(e) => setExamPassingScore(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {examCertificationId && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Select Questions ({selectedQuestions.length} selected)
                    </label>
                    {questions.length === 0 ? (
                      <div className="p-6 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                          No questions available for this certification yet.
                        </p>
                        <Link
                          href={`/admin/questions?certificationId=${examCertificationId}&action=add`}
                          className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                        >
                          Add Questions
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setSelectedQuestions(questions.map(q => q.id))}
                            className="px-3 py-1 text-sm bg-primary text-white rounded hover:opacity-90"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedQuestions([])}
                            className="px-3 py-1 text-sm border border-primary/20 rounded hover:bg-primary/5"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-96 overflow-auto border rounded-lg p-4 space-y-2">
                        {questions.map((question) => (
                          <label
                            key={question.id}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              selectedQuestions.includes(question.id)
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'bg-muted border-2 border-transparent hover:border-border'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question.id)}
                              onChange={() => handleToggleQuestion(question.id)}
                              className="mt-1 w-5 h-5 accent-primary"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{question.questionText}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                                  {question.questionType}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  question.difficulty === 'EASY'
                                    ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                    : question.difficulty === 'MEDIUM'
                                    ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                                }`}>
                                  {question.difficulty}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCreateExam}
                  disabled={!examName || !examCertificationId || selectedQuestions.length === 0}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold shadow-lg transition-all"
                >
                  Create Exam with {selectedQuestions.length} Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditModal && editingExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Exam: {editingExam.name}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingExam(null);
                    setSelectedQuestions([]);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}

              <div className="mb-4 p-4 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Select which questions should be included in this exam.
                  Currently selected: {selectedQuestions.length} questions
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Select Questions ({selectedQuestions.length} selected)
                </label>
                {questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    No questions available for this certification.
                  </p>
                ) : (
                  <div className="max-h-96 overflow-auto border rounded-lg p-4 space-y-2">
                    {questions.map((question) => (
                      <label
                        key={question.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedQuestions.includes(question.id)
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted border-2 border-transparent hover:border-border'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => handleToggleQuestion(question.id)}
                          className="mt-1 w-5 h-5 accent-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{question.questionText}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                              {question.questionType}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              question.difficulty === 'EASY'
                                ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : question.difficulty === 'MEDIUM'
                                ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                                : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleUpdateExamQuestions}
                disabled={selectedQuestions.length === 0}
                className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold shadow-lg transition-all"
              >
                Update Exam with {selectedQuestions.length} Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

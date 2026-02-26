'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  explanation: string | null;
  imageUrl?: string | null;
  difficulty: string;
  answers: Answer[];
  certification: {
    id: string;
    name: string;
    code: string;
    vendor: string;
  };
  createdAt: string;
}

interface Certification {
  id: string;
  name: string;
  code: string;
  vendor: string;
}

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
  explanation: string | null;
  difficulty: string;
  answers: {
    answerText: string;
    isCorrect: boolean;
  }[];
}

function AdminQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, hasHydrated } = useAuthStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCertification, setSelectedCertification] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCertificationId, setUploadCertificationId] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    explanation: '',
    certificationId: '',
    answers: [
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false },
      { answerText: '', isCorrect: false },
    ],
  });
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionImageUrl, setNewQuestionImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchCertifications();
    fetchQuestions();
  }, [token, user, router, hasHydrated]);

  useEffect(() => {
    const certId = searchParams.get('certificationId');
    const action = searchParams.get('action');

    if (certId) {
      setSelectedCertification(certId);
      setNewQuestion(prev => ({ ...prev, certificationId: certId }));
      fetchQuestions(certId);
    }

    if (action === 'add' && certId) {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchCertifications = async () => {
    try {
      const response = await api.get('/certifications');
      setCertifications(response.data);
    } catch (err: any) {
      console.error('Failed to fetch certifications:', err);
    }
  };

  const fetchQuestions = async (certificationId?: string) => {
    try {
      setLoading(true);
      const url = certificationId
        ? `/admin/questions?certificationId=${certificationId}`
        : '/admin/questions';
      const response = await api.get(url);
      setQuestions(response.data);
    } catch (err: any) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificationFilter = (certificationId: string) => {
    setSelectedCertification(certificationId);
    fetchQuestions(certificationId || undefined);
  };

  const handleParsePDF = async () => {
    if (!uploadFile) {
      setError('Please select a PDF file');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await api.post('/admin/questions/parse-pdf', formData);

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      setParsedQuestions(response.data.questions);
      setSuccess(`Successfully parsed ${response.data.count} questions from PDF`);
      toast.success(`Parsed ${response.data.count} questions from PDF`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError('Failed to parse PDF: ' + errorMsg);
      console.error('PDF parsing error:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadCertificationId) {
      setError('Please select a certification');
      return;
    }

    if (parsedQuestions.length === 0) {
      setError('No questions to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const questionsToUpload = parsedQuestions.map(q => ({
        questionText: q.questionText,
        questionType: q.questionType,
        explanation: q.explanation,
        certificationId: uploadCertificationId,
        difficulty: q.difficulty,
        answers: q.answers,
      }));

      await api.post('/admin/questions/bulk', {
        questions: questionsToUpload,
      });

      setSuccess(`Successfully uploaded ${parsedQuestions.length} questions!`);
      toast.success(`Uploaded ${parsedQuestions.length} questions`);
      setShowUploadModal(false);
      setParsedQuestions([]);
      setUploadFile(null);
      setUploadCertificationId('');
      fetchQuestions(selectedCertification || undefined);
    } catch (err: any) {
      setError('Failed to upload questions: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await api.delete(`/admin/questions/${questionId}`);
      setSuccess('Question deleted successfully');
      toast.success('Question deleted');
      fetchQuestions(selectedCertification || undefined);
    } catch (err: any) {
      setError('Failed to delete question: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      await api.put(`/admin/questions/${editingQuestion.id}`, {
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType,
        explanation: editingQuestion.explanation,
        certificationId: editingQuestion.certification.id,
        difficulty: editingQuestion.difficulty,
        imageUrl: editingQuestion.imageUrl || undefined,
        answers: editingQuestion.answers.map(a => ({
          answerText: a.answerText,
          isCorrect: a.isCorrect,
        })),
      });

      setSuccess('Question updated successfully');
      toast.success('Question updated');
      setShowEditModal(false);
      setEditingQuestion(null);
      fetchQuestions(selectedCertification || undefined);
    } catch (err: any) {
      setError('Failed to update question: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.questionText || !newQuestion.certificationId) {
      setError('Please fill in all required fields');
      return;
    }

    const validAnswers = newQuestion.answers.filter(a => a.answerText.trim());
    if (validAnswers.length < 2) {
      setError('Please provide at least 2 answers');
      return;
    }

    if (!validAnswers.some(a => a.isCorrect)) {
      setError('Please mark at least one answer as correct');
      return;
    }

    setAddingQuestion(true);
    setError('');

    try {
      await api.post('/admin/questions', {
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation || undefined,
        certificationId: newQuestion.certificationId,
        answers: validAnswers,
        ...(newQuestionImageUrl ? { imageUrl: newQuestionImageUrl } : {}),
      });

      setSuccess('Question added successfully!');
      toast.success('Question added');
      setShowAddModal(false);
      setNewQuestionImageUrl('');
      setNewQuestion({
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        explanation: '',
        certificationId: selectedCertification,
        answers: [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
        ],
      });
      fetchQuestions(selectedCertification || undefined);
    } catch (err: any) {
      setError('Failed to add question: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingQuestion(false);
    }
  };

  const openAddModal = () => {
    setNewQuestion({
      ...newQuestion,
      certificationId: selectedCertification,
    });
    setNewQuestionImageUrl('');
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const uploadImage = async (file: File, onSuccess: (url: string) => void) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/admin/questions/upload-image', formData);
      onSuccess(response.data.imageUrl);
    } catch (err: any) {
      setError('Failed to upload image: ' + (err.response?.data?.error || err.message));
    } finally {
      setImageUploading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 text-primary">
            Question Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage exam questions and upload from PDF
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all"
          >
            Add Question
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 border-2 border-primary/20 hover:border-primary hover:bg-accent font-semibold transition-all"
          >
            Upload from PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30">
          {success}
        </div>
      )}

      <div className="bg-card p-4 border mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-semibold text-muted-foreground">Filter by Certification:</label>
          <select
            value={selectedCertification}
            onChange={(e) => handleCertificationFilter(e.target.value)}
            className="flex-1 px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Certifications</option>
            {certifications.map((cert) => (
              <option key={cert.id} value={cert.id}>
                {cert.vendor} - {cert.name} ({cert.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-4">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-card border">
          <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-muted-foreground mb-4">No questions found</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
            >
              Add Question
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 border-2 border-primary/20 hover:border-primary hover:bg-accent transition-all font-semibold"
            >
              Upload from PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-card p-6 border hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold px-3 py-1 bg-primary/10 text-primary">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-semibold px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                      {question.questionType.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-semibold px-3 py-1 ${
                      question.difficulty === 'EASY'
                        ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : question.difficulty === 'MEDIUM'
                        ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{question.questionText}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {question.certification.vendor} • {question.certification.name} ({question.certification.code})
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openEditModal(question)}
                    className="px-4 py-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-sm font-semibold transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="px-4 py-2 border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`p-3 rounded border-2 ${
                      answer.isCorrect
                        ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center">
                      {answer.isCorrect && (
                        <span className="mr-2 font-bold text-green-600 dark:text-green-400">✓</span>
                      )}
                      <span>{answer.answerText}</span>
                    </div>
                  </div>
                ))}
              </div>

              {question.imageUrl && (
                <div className="mb-3">
                  <img
                    src={question.imageUrl}
                    alt="Question image"
                    className="max-h-32 border object-contain"
                  />
                </div>
              )}

              {question.explanation && (
                <div className="p-3 bg-muted/50 border-l-4 border-primary text-sm">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Questions from PDF</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setParsedQuestions([]);
                    setUploadFile(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Select Certification
                  </label>
                  <select
                    value={uploadCertificationId}
                    onChange={(e) => setUploadCertificationId(e.target.value)}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose certification...</option>
                    {certifications.map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.vendor} - {cert.name} ({cert.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Upload PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleParsePDF}
                  disabled={!uploadFile || parsing}
                  className="w-full px-6 py-3 bg-blue-600 text-white hover:opacity-90 disabled:opacity-50 font-semibold transition-all"
                >
                  {parsing ? 'Parsing PDF...' : 'Parse PDF'}
                </button>
              </div>

              {parsedQuestions.length > 0 && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-2">
                      Parsed Questions ({parsedQuestions.length})
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review the questions below and click Upload to add them to the database.
                    </p>
                  </div>

                  <div className="max-h-96 overflow-auto mb-4 space-y-4">
                    {parsedQuestions.map((q, index) => (
                      <div key={index} className="border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                            Q{q.questionNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                            {q.questionType}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{q.questionText}</p>
                        <div className="space-y-1">
                          {q.answers.map((answer, idx) => (
                            <div
                              key={idx}
                              className={`text-sm p-2 rounded ${
                                answer.isCorrect
                                  ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-semibold'
                                  : 'bg-muted'
                              }`}
                            >
                              {answer.isCorrect && '✓ '}{answer.answerText}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleBulkUpload}
                    disabled={!uploadCertificationId || uploading}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold transition-all"
                  >
                    {uploading ? 'Uploading...' : `Upload ${parsedQuestions.length} Questions`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Question</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingQuestion(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Question Text</label>
                  <textarea
                    value={editingQuestion.questionText}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, questionText: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Question Type</label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, questionType: e.target.value })
                    }
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Difficulty</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })
                    }
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Answers <span className="text-muted-foreground font-normal">(supports multi-line)</span>
                  </label>
                  {editingQuestion.answers.map((answer, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const newAnswers = [...editingQuestion.answers];
                          newAnswers[index].isCorrect = e.target.checked;
                          setEditingQuestion({ ...editingQuestion, answers: newAnswers });
                        }}
                        className="w-5 h-5 accent-primary mt-3"
                      />
                      <textarea
                        value={answer.answerText}
                        onChange={(e) => {
                          const newAnswers = [...editingQuestion.answers];
                          newAnswers[index].answerText = e.target.value;
                          setEditingQuestion({ ...editingQuestion, answers: newAnswers });
                        }}
                        rows={2}
                        className="flex-1 px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Explanation</label>
                  <textarea
                    value={editingQuestion.explanation || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Question Image (Optional)</label>
                  {editingQuestion.imageUrl && (
                    <div className="mb-3">
                      <img
                        src={editingQuestion.imageUrl}
                        alt="Current image"
                        className="max-h-32 border object-contain"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, (url) =>
                        setEditingQuestion({ ...editingQuestion, imageUrl: url })
                      );
                    }}
                    disabled={imageUploading}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {imageUploading && (
                    <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>
                  )}
                </div>

                <button
                  onClick={handleUpdateQuestion}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all"
                >
                  Update Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Question</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Certification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newQuestion.certificationId}
                    onChange={(e) => setNewQuestion({ ...newQuestion, certificationId: e.target.value })}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select certification...</option>
                    {certifications.map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.vendor} - {cert.name} ({cert.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter the question..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Question Type</label>
                    <select
                      value={newQuestion.questionType}
                      onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                      className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="SINGLE_CHOICE">Single Choice</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="TRUE_FALSE">True/False</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Difficulty</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Answers <span className="text-red-500">*</span>
                    <span className="text-muted-foreground font-normal ml-2">(check correct answers)</span>
                  </label>
                  {newQuestion.answers.map((answer, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const newAnswers = [...newQuestion.answers];
                          newAnswers[index].isCorrect = e.target.checked;
                          setNewQuestion({ ...newQuestion, answers: newAnswers });
                        }}
                        className="w-5 h-5 accent-green-600 mt-3"
                      />
                      <textarea
                        value={answer.answerText}
                        onChange={(e) => {
                          const newAnswers = [...newQuestion.answers];
                          newAnswers[index].answerText = e.target.value;
                          setNewQuestion({ ...newQuestion, answers: newAnswers });
                        }}
                        rows={2}
                        className="flex-1 px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        placeholder={`Answer ${index + 1}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewQuestion({
                      ...newQuestion,
                      answers: [...newQuestion.answers, { answerText: '', isCorrect: false }]
                    })}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    + Add Another Answer
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Explanation (Optional)</label>
                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Explain why the correct answer is correct..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Question Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, setNewQuestionImageUrl);
                    }}
                    disabled={imageUploading}
                    className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {imageUploading && (
                    <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>
                  )}
                  {newQuestionImageUrl && (
                    <div className="mt-3">
                      <img
                        src={newQuestionImageUrl}
                        alt="Preview"
                        className="max-h-32 border object-contain"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddQuestion}
                  disabled={addingQuestion || !newQuestion.questionText || !newQuestion.certificationId}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold transition-all"
                >
                  {addingQuestion ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    }>
      <AdminQuestionsContent />
    </Suspense>
  );
}

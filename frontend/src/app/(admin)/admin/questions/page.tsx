'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

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

export default function AdminQuestionsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

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

  useEffect(() => {
    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchCertifications();
    fetchQuestions();
  }, [token, user, router]);

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
        answers: editingQuestion.answers.map(a => ({
          answerText: a.answerText,
          isCorrect: a.isCorrect,
        })),
      });

      setSuccess('Question updated successfully');
      setShowEditModal(false);
      setEditingQuestion(null);
      fetchQuestions(selectedCertification || undefined);
    } catch (err: any) {
      setError('Failed to update question: ' + (err.response?.data?.message || err.message));
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
            Question Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage exam questions and upload from PDF
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 font-semibold shadow-lg transition-all hover:scale-105"
        >
          Upload from PDF
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

      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-semibold text-muted-foreground">Filter by Certification:</label>
          <select
            value={selectedCertification}
            onChange={(e) => handleCertificationFilter(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-sky-500/5 rounded-xl shadow-sm border border-primary/10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-muted-foreground mb-4">No questions found</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-md font-semibold"
          >
            Upload Questions from PDF
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {question.questionType.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      question.difficulty === 'EASY'
                        ? 'bg-green-50 text-green-700'
                        : question.difficulty === 'MEDIUM'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-red-50 text-red-700'
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
                    className="px-4 py-2 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 text-sm font-semibold transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="px-4 py-2 border-2 border-red-200 rounded-lg hover:border-red-500 hover:bg-red-50 text-red-600 text-sm font-semibold transition-all"
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
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      {answer.isCorrect && (
                        <span className="mr-2 font-bold text-green-600">✓</span>
                      )}
                      <span>{answer.answerText}</span>
                    </div>
                  </div>
                ))}
              </div>

              {question.explanation && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Questions from PDF</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setParsedQuestions([]);
                    setUploadFile(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleParsePDF}
                  disabled={!uploadFile || parsing}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold transition-all"
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
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">
                            Q{q.questionNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded">
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
                                  ? 'bg-green-50 text-green-700 font-semibold'
                                  : 'bg-gray-50'
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
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold shadow-lg transition-all"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Question</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingQuestion(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Question Type</label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, questionType: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Answers</label>
                  {editingQuestion.answers.map((answer, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={(e) => {
                          const newAnswers = [...editingQuestion.answers];
                          newAnswers[index].isCorrect = e.target.checked;
                          setEditingQuestion({ ...editingQuestion, answers: newAnswers });
                        }}
                        className="w-5 h-5 accent-primary"
                      />
                      <input
                        type="text"
                        value={answer.answerText}
                        onChange={(e) => {
                          const newAnswers = [...editingQuestion.answers];
                          newAnswers[index].answerText = e.target.value;
                          setEditingQuestion({ ...editingQuestion, answers: newAnswers });
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleUpdateQuestion}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 font-semibold shadow-lg transition-all"
                >
                  Update Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Certification {
  id: string;
  name: string;
  code: string;
  vendor: string;
}

export default function UploadQuestionPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE');
  const [explanation, setExplanation] = useState('');
  const [certificationId, setCertificationId] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [answers, setAnswers] = useState([
    { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false },
  ]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      const response = await api.get('/certifications');
      setCertifications(response.data);
    } catch (err: any) {
      console.error('Failed to fetch certifications:', err);
    }
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerText: '', isCorrect: false }]);
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index));
    }
  };

  const handleAnswerChange = (index: number, field: string, value: any) => {
    const newAnswers = [...answers];
    (newAnswers[index] as any)[field] = value;
    setAnswers(newAnswers);
  };

  const uploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/admin/questions/upload-image', formData);
      setImageUrl(response.data.imageUrl);
    } catch (err: any) {
      setMessage('Failed to upload image: ' + (err.response?.data?.error || err.message));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/admin/questions', {
        questionText,
        questionType,
        explanation,
        certificationId,
        difficulty,
        answers,
        ...(imageUrl ? { imageUrl } : {}),
      });
      setMessage('Question uploaded successfully!');
      toast.success('Question uploaded');

      // Reset form
      setQuestionText('');
      setExplanation('');
      setImageUrl('');
      setAnswers([
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      setMessage('Failed to upload question: ' + errMsg);
      toast.error('Upload failed', { description: errMsg });
    } finally {
      setLoading(false);
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-3 text-primary">
          Upload Question
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Add a single question to a certification
        </p>

        {message && (
          <div className={`p-4 mb-6 border ${message.includes('success') ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'}`}>
            {message}
          </div>
        )}

        <div className="bg-card p-8 border">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Certification
            </label>
            <select
              required
              value={certificationId}
              onChange={(e) => setCertificationId(e.target.value)}
              className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a certification...</option>
              {certifications.map((cert) => (
                <option key={cert.id} value={cert.id}>
                  {cert.vendor} - {cert.name} ({cert.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Exhibit Image <span className="text-muted-foreground font-normal">(Optional — upload diagram/screenshot shown above the question)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
              disabled={imageUploading}
              className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {imageUploading && (
              <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
            )}
            {imageUrl && (
              <div className="mt-3 p-3 bg-muted/40 border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Exhibit Preview</p>
                <img
                  src={imageUrl}
                  alt="Exhibit preview"
                  className="max-h-48 border object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="mt-2 text-xs text-red-500 hover:underline"
                >
                  Remove exhibit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Question Text
            </label>
            <textarea
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Enter the question... (e.g. Refer to the exhibit. Which command...)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
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
              Answers <span className="text-muted-foreground font-normal">(check correct — supports multi-line)</span>
            </label>
            {answers.map((answer, index) => (
              <div key={index} className="flex gap-2 mb-3 items-start">
                <textarea
                  required
                  value={answer.answerText}
                  onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                  className="flex-1 px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  rows={2}
                  placeholder={`Answer ${index + 1}`}
                />
                <label className="flex items-center gap-2 px-4 py-2 border cursor-pointer hover:bg-muted shrink-0">
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-sm font-medium">Correct</span>
                </label>
                {answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAnswer(index)}
                    className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-all shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAnswer}
              className="mt-2 px-5 py-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-semibold transition-all"
            >
              + Add Answer
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Explain the correct answer..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold transition-all"
          >
            {loading ? 'Uploading...' : 'Upload Question'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

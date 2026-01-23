'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function UploadQuestionPage() {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('SINGLE_CHOICE');
  const [explanation, setExplanation] = useState('');
  const [certificationId, setCertificationId] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [answers, setAnswers] = useState([
    { answerText: '', isCorrect: false },
    { answerText: '', isCorrect: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      });
      setMessage('Question uploaded successfully!');

      // Reset form
      setQuestionText('');
      setExplanation('');
      setAnswers([
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
      ]);
    } catch (err: any) {
      setMessage('Failed to upload question: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Upload Question</h1>

        {message && (
          <div className={`p-3 mb-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Certification ID
            </label>
            <input
              type="text"
              required
              value={certificationId}
              onChange={(e) => setCertificationId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter certification ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Question Text
            </label>
            <textarea
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Enter the question..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Explanation (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Explain the correct answer..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Answers (check correct answer)
            </label>
            {answers.map((answer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  required
                  value={answer.answerText}
                  onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={`Answer ${index + 1}`}
                />
                <label className="flex items-center gap-2 px-3">
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Correct</span>
                </label>
                {answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAnswer(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAnswer}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Add Answer
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Question'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Question } from '../types/models';

interface QuestionListProps {
  questions: Question[];
  eventId: string;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export default function QuestionList({ questions, eventId, onEdit, onDelete }: QuestionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setDeletingId(questionId);

    try {
      const response = await fetch(
        `${apiBaseUrl}/events/${eventId}/questions/${questionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
      }

      onDelete(questionId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setDeletingId(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No questions added yet. Add your first question above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions ({questions.length})</h2>
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 break-words">
                      {question.text}
                    </p>
                    <div className="mt-2 space-y-1">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 text-sm">
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              option.id === question.correctOptionId
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}
                          />
                          <span
                            className={
                              option.id === question.correctOptionId
                                ? 'text-green-700 font-medium'
                                : 'text-gray-600'
                            }
                          >
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    {question.timerSeconds && (
                      <p className="mt-2 text-sm text-gray-500">
                        ⏱️ Timer: {question.timerSeconds} seconds
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(question)}
                  className="flex-1 sm:flex-none px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[44px] font-medium border border-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  disabled={deletingId === question.id}
                  className="flex-1 sm:flex-none px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] font-medium border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === question.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

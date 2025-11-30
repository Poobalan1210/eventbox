import { useState, FormEvent } from 'react';
import { AnswerOption, Question } from '../types/models';

interface QuestionFormProps {
  eventId: string;
  question?: Question;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function QuestionForm({ eventId, question, onSuccess, onCancel }: QuestionFormProps) {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const isEditing = !!question;

  const [questionText, setQuestionText] = useState(question?.text || '');
  const [options, setOptions] = useState<AnswerOption[]>(
    question?.options || [
      { id: crypto.randomUUID(), text: '', color: 'red', shape: 'triangle' },
      { id: crypto.randomUUID(), text: '', color: 'blue', shape: 'diamond' },
    ]
  );
  const [correctOptionId, setCorrectOptionId] = useState(question?.correctOptionId || '');
  const [timerSeconds, setTimerSeconds] = useState<string>(
    question?.timerSeconds?.toString() || ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(question?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 5) {
      // Assign placeholder color and shape (backend will assign proper ones)
      const colorShapeMap: Array<{ color: AnswerOption['color']; shape: AnswerOption['shape'] }> = [
        { color: 'red', shape: 'triangle' },
        { color: 'blue', shape: 'diamond' },
        { color: 'yellow', shape: 'circle' },
        { color: 'green', shape: 'square' },
        { color: 'purple', shape: 'pentagon' },
      ];
      const style = colorShapeMap[options.length];
      setOptions([...options, { id: crypto.randomUUID(), text: '', ...style }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
      if (correctOptionId === id) {
        setCorrectOptionId('');
      }
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid image format. Only JPEG, PNG, and GIF are supported');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image file size exceeds 5MB limit');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (options.length < 2 || options.length > 5) {
      setError('Must have between 2 and 5 answer options');
      return;
    }

    if (options.some((opt) => !opt.text.trim())) {
      setError('All answer options must have text');
      return;
    }

    if (!correctOptionId) {
      setError('Please select the correct answer');
      return;
    }

    const timerValue = timerSeconds ? parseInt(timerSeconds, 10) : undefined;
    if (timerSeconds && (isNaN(timerValue!) || timerValue! <= 0)) {
      setError('Timer must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditing
        ? `${apiBaseUrl}/events/${eventId}/questions/${question.id}`
        : `${apiBaseUrl}/events/${eventId}/questions`;

      const method = isEditing ? 'PUT' : 'POST';

      // For demo purposes, using a hardcoded organizerId
      // In production, this would come from authentication context
      const organizerId = 'demo-organizer-123';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-id': organizerId,
        },
        body: JSON.stringify({
          text: questionText,
          options,
          correctOptionId,
          timerSeconds: timerValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save question');
      }

      const responseData = await response.json();
      const questionId = isEditing ? question.id : responseData.questionId;

      // Upload image if one was selected
      if (imageFile && questionId) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const imageResponse = await fetch(
          `${apiBaseUrl}/events/${eventId}/questions/${questionId}/image`,
          {
            method: 'POST',
            headers: {
              'x-organizer-id': organizerId,
            },
            body: formData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }
      }

      // Reset form if creating new question
      if (!isEditing) {
        setQuestionText('');
        setOptions([
          { id: crypto.randomUUID(), text: '', color: 'red', shape: 'triangle' },
          { id: crypto.randomUUID(), text: '', color: 'blue', shape: 'diamond' },
        ]);
        setCorrectOptionId('');
        setTimerSeconds('');
        setImageFile(null);
        setImagePreview(null);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-6 text-gray-900">
      <h2 className="text-xl font-semibold text-gray-900">
        {isEditing ? 'Edit Question' : 'Add New Question'}
      </h2>

      {/* Question Text */}
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
          Question Text
        </label>
        <textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          rows={3}
          placeholder="Enter your question"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
          disabled={isLoading}
        />
      </div>

      {/* Question Image */}
      <div>
        <label htmlFor="questionImage" className="block text-sm font-medium text-gray-700 mb-2">
          Question Image - Optional
        </label>
        <div className="space-y-3">
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Question preview"
                className="max-w-full h-auto max-h-64 rounded-md border border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                disabled={isLoading}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="file"
              id="questionImage"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:min-h-[44px]"
              disabled={isLoading}
            />
          )}
          <p className="text-sm text-gray-500">
            Supported formats: JPEG, PNG, GIF. Max size: 5MB
          </p>
        </div>
      </div>

      {/* Answer Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer Options (2-5 options)
        </label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <input
                type="radio"
                id={`correct-${option.id}`}
                name="correctAnswer"
                checked={correctOptionId === option.id}
                onChange={() => setCorrectOptionId(option.id)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                disabled={isLoading}
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base"
                disabled={isLoading}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  disabled={isLoading}
                  aria-label="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[44px] font-medium"
            disabled={isLoading}
          >
            + Add Option
          </button>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Select the radio button next to the correct answer
        </p>
      </div>

      {/* Timer */}
      <div>
        <label htmlFor="timerSeconds" className="block text-sm font-medium text-gray-700 mb-2">
          Timer (seconds) - Optional
        </label>
        <input
          type="number"
          id="timerSeconds"
          value={timerSeconds}
          onChange={(e) => setTimerSeconds(e.target.value)}
          min="1"
          placeholder="Leave empty for no timer"
          className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] text-base"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
        >
          {isLoading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
        </button>
        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors min-h-[44px] font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

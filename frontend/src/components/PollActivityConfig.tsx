import { useState, useEffect } from 'react';
import { PollActivity, PollOption } from '../types/models';
import { UpdateActivityRequest } from '../types/api';
import { useTheme } from '../contexts/ThemeContext';

interface PollActivityConfigProps {
  activity: PollActivity;
  onUpdate: () => void;
  onCancel?: () => void;
}

export default function PollActivityConfig({
  activity,
  onUpdate,
  onCancel,
}: PollActivityConfigProps) {
  const { colors } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  // Poll configuration state
  const [question, setQuestion] = useState(activity.question || '');
  const [options, setOptions] = useState<PollOption[]>(() => {
    if (activity.options && activity.options.length > 0) {
      return activity.options.map(opt => ({ 
        ...opt, 
        id: opt.id || crypto.randomUUID(),
        text: opt.text || '',
        voteCount: opt.voteCount || 0
      }));
    } else {
      return [
        { id: crypto.randomUUID(), text: '', voteCount: 0 },
        { id: crypto.randomUUID(), text: '', voteCount: 0 },
      ];
    }
  });
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(activity.allowMultipleVotes || false);
  const [showResultsLive, setShowResultsLive] = useState(activity.showResultsLive || false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch latest poll configuration when component mounts or activity changes
  useEffect(() => {
    // Only fetch on initial mount, not on every render
    fetchPollConfig();
  }, []); // Empty dependency array to run only once

  const fetchPollConfig = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          headers: {
            'x-organizer-id': organizerId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load poll configuration');
      }

      const data = await response.json();
      console.log('Fetched poll config:', data);
      if (data.activity && data.activity.type === 'poll') {
        const pollActivity = data.activity as PollActivity;
        setQuestion(pollActivity.question || '');
        if (pollActivity.options && pollActivity.options.length > 0) {
          // Ensure all option texts are defined and have unique IDs
          const safeOptions = pollActivity.options.map((opt, index) => ({
            ...opt,
            id: opt.id || crypto.randomUUID(),
            text: opt.text || '',
            voteCount: opt.voteCount || 0
          }));
          console.log('Setting options from API:', safeOptions);
          setOptions(safeOptions);
        }
        setAllowMultipleVotes(pollActivity.allowMultipleVotes || false);
        setShowResultsLive(pollActivity.showResultsLive || false);
      }
    } catch (err) {
      console.error('Error fetching poll configuration:', err);
    }
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: crypto.randomUUID(), text: '', voteCount: 0 }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    console.log('Changing option text:', { 
      id, 
      text, 
      currentOptions: options.map(opt => ({ id: opt.id, text: opt.text }))
    });
    
    const newOptions = options.map((opt) => (opt.id === id ? { ...opt, text } : opt));
    console.log('New options after change:', newOptions.map(opt => ({ id: opt.id, text: opt.text })));
    
    setOptions(newOptions);
  };

  const handleSaveConfiguration = async () => {
    console.log('Saving poll configuration...', { question, options, allowMultipleVotes, showResultsLive });
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!question || !question.trim()) {
      setError('Poll question is required');
      setIsSaving(false);
      return;
    }

    if (options.length < 2) {
      setError('Poll must have at least 2 options');
      setIsSaving(false);
      return;
    }

    if (options.some((opt) => !opt.text || !opt.text.trim())) {
      setError('All poll options must have text');
      setIsSaving(false);
      return;
    }

    try {
      const configData = {
        question,
        options: options.map(opt => opt.text),
      };

      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}/configure-poll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify(configData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to configure poll');
      }

      // Also update the poll settings
      const settingsData = {
        allowMultipleVotes,
        showResultsLive,
      };

      const settingsResponse = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify(settingsData),
        }
      );

      if (!settingsResponse.ok) {
        console.warn('Failed to update poll settings, but poll configuration was saved');
      }

      setSuccessMessage('Poll configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const canMarkReady = question && question.trim() !== '' && options.length >= 2 && options.every(opt => opt.text && opt.text.trim() !== '');

  const handleMarkReady = async () => {
    if (!canMarkReady) {
      alert('Please configure the poll question and at least 2 options before marking as ready');
      return;
    }

    // Save configuration first
    await handleSaveConfiguration();

    try {
      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify({ status: 'ready' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as ready');
      }

      setSuccessMessage('Activity marked as ready!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              Configure Poll Activity
            </h2>
            <p className="mt-1" style={{ color: colors.textSecondary }}>
              {activity.name}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md transition-colors"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 border rounded-md backdrop-blur-sm" style={{ 
            backgroundColor: '#ef444420', 
            borderColor: '#ef4444' 
          }}>
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 border rounded-md backdrop-blur-sm" style={{ 
            backgroundColor: '#10b98120', 
            borderColor: '#10b981' 
          }}>
            <p className="text-sm" style={{ color: '#10b981' }}>{successMessage}</p>
          </div>
        )}

        {/* Poll Question */}
        <div className="space-y-4">
          <div>
            <label htmlFor="pollQuestion" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Poll Question
            </label>
            <textarea
              id="pollQuestion"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Enter your poll question"
              className="w-full px-4 py-3 border rounded-md focus:ring-2 text-base resize-none backdrop-blur-sm transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.cardBorder;
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={isSaving}
            />
          </div>

          {/* Poll Options */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Poll Options (2-10 options)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span 
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: colors.accent + '20', 
                      color: colors.accent 
                    }}
                  >
                    {index + 1}
                  </span>
                  <input
                    key={`option-input-${option.id}`}
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-2 border rounded-md focus:ring-2 text-base backdrop-blur-sm transition-all"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.accent;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.cardBorder;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    disabled={isSaving}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      className="px-3 py-2 rounded-md transition-colors"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef444420';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      disabled={isSaving}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 px-4 py-2 rounded-md transition-colors font-medium"
                style={{ color: colors.accent }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent + '20';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                disabled={isSaving}
              >
                + Add Option
              </button>
            )}
          </div>

          {/* Poll Settings */}
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
            <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
              Poll Settings
            </h3>
            
            {/* Allow Multiple Votes */}
            <label 
              className="flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.cardBorder
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <input
                type="checkbox"
                checked={allowMultipleVotes}
                onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                className="w-5 h-5 rounded focus:ring-2"
                style={{ 
                  accentColor: colors.accent,
                  '--tw-ring-color': colors.accent + '80'
                } as any}
                disabled={isSaving}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  Allow Multiple Votes
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Participants can select multiple options
                </div>
              </div>
            </label>

            {/* Show Results Live */}
            <label 
              className="flex items-center gap-3 p-3 rounded-md transition-colors cursor-pointer backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.cardBorder
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <input
                type="checkbox"
                checked={showResultsLive}
                onChange={(e) => setShowResultsLive(e.target.checked)}
                className="w-5 h-5 rounded focus:ring-2"
                style={{ 
                  accentColor: colors.accent,
                  '--tw-ring-color': colors.accent + '80'
                } as any}
                disabled={isSaving}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: colors.textPrimary }}>
                  Show Results Live
                </div>
                <div className="text-sm" style={{ color: colors.textSecondary }}>
                  Display real-time voting results to participants
                </div>
              </div>
            </label>
          </div>

          {/* Save Configuration Button */}
          <button
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed"
            style={{
              backgroundColor: isSaving ? 'rgba(128, 128, 128, 0.5)' : colors.accent,
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = colors.accent + 'CC';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = colors.accent;
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Poll Preview */}
      <div 
        className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Poll Preview
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 rounded-md transition-colors font-medium"
            style={{ color: colors.accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent + '20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {showPreview && (
          <div 
            className="border-2 border-dashed rounded-lg p-6 backdrop-blur-sm"
            style={{ 
              borderColor: colors.cardBorder,
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            {question && question.trim() ? (
              <>
                <h4 className="text-xl font-bold mb-6 text-center" style={{ color: colors.textPrimary }}>
                  {question}
                </h4>
                <div className="space-y-3 max-w-2xl mx-auto">
                  {options.filter(opt => opt.text && opt.text.trim()).map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 p-4 border-2 rounded-lg transition-colors cursor-pointer backdrop-blur-sm"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: colors.cardBorder
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.cardBorder;
                      }}
                    >
                      <span 
                        className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: colors.accent + '20', 
                          color: colors.accent 
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-base" style={{ color: colors.textPrimary }}>
                        {option.text}
                      </span>
                    </div>
                  ))}
                </div>
                {allowMultipleVotes && (
                  <p className="text-sm text-center mt-4" style={{ color: colors.textSecondary }}>
                    ℹ️ Participants can select multiple options
                  </p>
                )}
                {showResultsLive && (
                  <p className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
                    📊 Results will be shown in real-time
                  </p>
                )}
              </>
            ) : (
              <p className="text-center" style={{ color: colors.textSecondary }}>
                Configure your poll question and options to see a preview
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mark as Ready */}
      {activity.status === 'draft' && (
        <div 
          className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
          style={{ 
            backgroundColor: colors.cardBg, 
            borderColor: colors.cardBorder 
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Ready to Go?
          </h3>
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            Once you've configured your poll question and options, mark this activity as
            ready to make it available for activation.
          </p>
          <button
            onClick={handleMarkReady}
            disabled={!canMarkReady}
            className="w-full px-4 py-3 rounded-md transition-colors font-medium disabled:cursor-not-allowed"
            style={{
              backgroundColor: !canMarkReady 
                ? 'rgba(128, 128, 128, 0.5)' 
                : '#10b981',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (canMarkReady) {
                e.currentTarget.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (canMarkReady) {
                e.currentTarget.style.backgroundColor = '#10b981';
              }
            }}
          >
            {canMarkReady ? '✓ Mark as Ready' : '⚠️ Complete Configuration First'}
          </button>
          {!canMarkReady && (
            <p className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
              Add a question and at least 2 options to mark as ready
            </p>
          )}
        </div>
      )}
    </div>
  );
}

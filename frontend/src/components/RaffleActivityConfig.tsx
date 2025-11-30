import { useState, useEffect } from 'react';
import { RaffleActivity } from '../types/models';
import { UpdateActivityRequest } from '../types/api';
import { useTheme } from '../contexts/ThemeContext';

interface RaffleActivityConfigProps {
  activity: RaffleActivity;
  onUpdate: () => void;
  onCancel?: () => void;
}

export default function RaffleActivityConfig({
  activity,
  onUpdate,
  onCancel,
}: RaffleActivityConfigProps) {
  const { colors } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  // Raffle configuration state
  const [prizeDescription, setPrizeDescription] = useState(activity.prizeDescription || '');
  const [entryMethod, setEntryMethod] = useState<'automatic' | 'manual'>(activity.entryMethod || 'automatic');
  const [winnerCount, setWinnerCount] = useState<string>(activity.winnerCount?.toString() || '1');
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch latest raffle configuration when component mounts or activity changes
  useEffect(() => {
    fetchRaffleConfig();
  }, [activity.activityId]);

  const fetchRaffleConfig = async () => {
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
        throw new Error('Failed to load raffle configuration');
      }

      const data = await response.json();
      if (data.activity && data.activity.type === 'raffle') {
        const raffleActivity = data.activity as RaffleActivity;
        setPrizeDescription(raffleActivity.prizeDescription || '');
        setEntryMethod(raffleActivity.entryMethod || 'automatic');
        setWinnerCount(raffleActivity.winnerCount?.toString() || '1');
      }
    } catch (err) {
      console.error('Error fetching raffle configuration:', err);
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!prizeDescription || !prizeDescription.trim()) {
      setError('Prize description is required');
      setIsSaving(false);
      return;
    }

    const winnerCountNum = parseInt(winnerCount, 10);
    if (isNaN(winnerCountNum) || winnerCountNum < 1) {
      setError('Winner count must be at least 1');
      setIsSaving(false);
      return;
    }

    if (winnerCountNum > 100) {
      setError('Winner count cannot exceed 100');
      setIsSaving(false);
      return;
    }

    try {
      const updateData: UpdateActivityRequest = {
        prizeDescription,
        entryMethod,
        winnerCount: winnerCountNum,
      };

      const response = await fetch(
        `${apiBaseUrl}/activities/${activity.activityId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update raffle configuration');
      }

      setSuccessMessage('Raffle configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const canMarkReady = prizeDescription && prizeDescription.trim() !== '' && parseInt(winnerCount, 10) >= 1;

  const handleMarkReady = async () => {
    if (!canMarkReady) {
      alert('Please configure the prize description and winner count before marking as ready');
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
              Configure Raffle Activity
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

        {/* Raffle Configuration */}
        <div className="space-y-4">
          {/* Prize Description */}
          <div>
            <label htmlFor="prizeDescription" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Prize Description
            </label>
            <textarea
              id="prizeDescription"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              rows={4}
              placeholder="Describe the prize(s) participants can win..."
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
            <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
              Be clear and exciting! This will be shown to participants.
            </p>
          </div>

          {/* Entry Method */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Entry Method
            </label>
            <div className="space-y-3">
              <label 
                className="flex items-start gap-3 p-4 rounded-md transition-colors cursor-pointer backdrop-blur-sm border-2"
                style={{ 
                  backgroundColor: entryMethod === 'automatic' ? colors.accent + '20' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: entryMethod === 'automatic' ? colors.accent : colors.cardBorder
                }}
                onMouseEnter={(e) => {
                  if (entryMethod !== 'automatic') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (entryMethod !== 'automatic') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <input
                  type="radio"
                  name="entryMethod"
                  value="automatic"
                  checked={entryMethod === 'automatic'}
                  onChange={(e) => setEntryMethod(e.target.value as 'automatic')}
                  className="mt-1 w-5 h-5 focus:ring-2"
                  style={{ 
                    accentColor: colors.accent,
                    '--tw-ring-color': colors.accent + '80'
                  } as any}
                  disabled={isSaving}
                />
                <div className="flex-1">
                  <div className="font-medium" style={{ color: colors.textPrimary }}>Automatic Entry</div>
                  <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    All connected participants are automatically entered into the raffle when it starts
                  </div>
                </div>
              </label>

              <label 
                className="flex items-start gap-3 p-4 rounded-md transition-colors cursor-pointer backdrop-blur-sm border-2"
                style={{ 
                  backgroundColor: entryMethod === 'manual' ? colors.accent + '20' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: entryMethod === 'manual' ? colors.accent : colors.cardBorder
                }}
                onMouseEnter={(e) => {
                  if (entryMethod !== 'manual') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (entryMethod !== 'manual') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <input
                  type="radio"
                  name="entryMethod"
                  value="manual"
                  checked={entryMethod === 'manual'}
                  onChange={(e) => setEntryMethod(e.target.value as 'manual')}
                  className="mt-1 w-5 h-5 focus:ring-2"
                  style={{ 
                    accentColor: colors.accent,
                    '--tw-ring-color': colors.accent + '80'
                  } as any}
                  disabled={isSaving}
                />
                <div className="flex-1">
                  <div className="font-medium" style={{ color: colors.textPrimary }}>Manual Entry</div>
                  <div className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Participants must click a button to enter the raffle
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Winner Count */}
          <div>
            <label htmlFor="winnerCount" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Number of Winners
            </label>
            <input
              type="number"
              id="winnerCount"
              value={winnerCount}
              onChange={(e) => setWinnerCount(e.target.value)}
              min="1"
              max="100"
              placeholder="1"
              className="w-full sm:w-48 px-4 py-3 border rounded-md focus:ring-2 text-base backdrop-blur-sm transition-all"
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
            <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
              How many winners will be selected? (1-100)
            </p>
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

      {/* Raffle Preview */}
      <div 
        className="rounded-lg shadow-md p-6 backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Raffle Preview
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
            {prizeDescription && prizeDescription.trim() ? (
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="text-6xl">🎁</div>
                <div>
                  <h4 className="text-2xl font-bold mb-3" style={{ color: colors.textPrimary }}>
                    Win Amazing Prizes!
                  </h4>
                  <p className="text-lg whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                    {prizeDescription}
                  </p>
                </div>
                <div className="pt-4 border-t" style={{ borderColor: colors.cardBorder }}>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {entryMethod === 'automatic' 
                      ? '✨ You will be automatically entered when the raffle starts'
                      : '👆 Click the button to enter when the raffle starts'}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    🏆 {winnerCount} {parseInt(winnerCount) === 1 ? 'winner' : 'winners'} will be selected
                  </p>
                </div>
                {entryMethod === 'manual' && (
                  <button
                    disabled
                    className="px-8 py-4 rounded-lg font-bold text-lg shadow-lg cursor-not-allowed opacity-75"
                    style={{
                      background: `linear-gradient(to right, ${colors.accent}, ${colors.accent}CC)`,
                      color: '#FFFFFF'
                    }}
                  >
                    Enter Raffle
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center" style={{ color: colors.textSecondary }}>
                Configure your prize description to see a preview
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
            Once you've configured your prize description and winner count, mark this activity as
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
              Add a prize description and set winner count to mark as ready
            </p>
          )}
        </div>
      )}
    </div>
  );
}

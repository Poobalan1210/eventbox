import { EventVisibility } from '../types/models';

interface PrivacySelectorProps {
  value: EventVisibility;
  onChange: (value: EventVisibility) => void;
  disabled?: boolean;
}

export default function PrivacySelector({ value, onChange, disabled = false }: PrivacySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-base font-bold text-white">
        🔐 Quiz Privacy
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Private Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('private')}
          disabled={disabled}
          className={`
            relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[56px]
            ${value === 'private'
              ? 'bg-answer-blue/30 border-answer-blue text-white shadow-lg'
              : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Radio indicator */}
          <div className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'private' ? 'border-white bg-white' : 'border-white/50'}
          `}>
            {value === 'private' && (
              <div className="w-2.5 h-2.5 rounded-full bg-answer-blue"></div>
            )}
          </div>
          
          {/* Icon and text */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔒</span>
              <span className="font-bold text-base">Private</span>
            </div>
            <p className="text-xs text-white/80">
              Requires Game PIN or link to join
            </p>
          </div>
        </button>

        {/* Public Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('public')}
          disabled={disabled}
          className={`
            relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all min-h-[56px]
            ${value === 'public'
              ? 'bg-answer-green/30 border-answer-green text-white shadow-lg'
              : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20 hover:border-white/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Radio indicator */}
          <div className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'public' ? 'border-white bg-white' : 'border-white/50'}
          `}>
            {value === 'public' && (
              <div className="w-2.5 h-2.5 rounded-full bg-answer-green"></div>
            )}
          </div>
          
          {/* Icon and text */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🌐</span>
              <span className="font-bold text-base">Public</span>
            </div>
            <p className="text-xs text-white/80">
              Discoverable in public quiz browser
            </p>
          </div>
        </button>
      </div>

      {/* Disabled state message */}
      {disabled && (
        <p className="text-xs text-white/60 italic">
          Privacy settings cannot be changed for live events
        </p>
      )}
    </div>
  );
}

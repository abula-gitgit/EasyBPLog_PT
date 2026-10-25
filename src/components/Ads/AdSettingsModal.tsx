import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Check, 
  Power, 
  Layout, 
  Code, 
  Sparkles, 
  Info,
} from 'lucide-react';
import { 
  setCreatorAdOverride, 
  setAdBannerMode,
  getAdBannerMode
} from '../../config/adConfig';

interface AdSettingsModalProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onClose: () => void;
}

export const AdSettingsModal: React.FC<AdSettingsModalProps> = ({
  isEnabled,
  onToggleEnabled,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<'placeholder' | 'custom' | 'script'>(getAdBannerMode());
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleToggle = (newVal: boolean) => {
    onToggleEnabled(newVal);
    setCreatorAdOverride(newVal);
    triggerFeedback();
  };

  const handleModeChange = (mode: 'placeholder' | 'custom' | 'script') => {
    setSelectedMode(mode);
    setAdBannerMode(mode);
    triggerFeedback();
  };

  const triggerFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[1300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-settings-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ad-settings-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ad Banner Settings (Creator Mode)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control bottom ad banner display and delivery slots
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300">
          
          {/* Main Switch Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Power className={`w-4 h-4 ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Ad Banner Display Switch</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isEnabled 
                    ? 'Currently [ON]: Slim banner displayed above bottom navigation.' 
                    : 'Currently [OFF]: Banner is completely removed with zero leftover space.'}
                </p>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggle(!isEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
                role="switch"
                aria-checked={isEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Zero-Space Guarantee Notification */}
            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Space Guarantee:</strong> When turned off, the banner component returns null and leaves 0px of blank space.
              </span>
            </div>
          </div>

          {/* Ad Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Delivery Mode
            </label>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('placeholder')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  selectedMode === 'placeholder'
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Sample / Test Banners</span>
                    {selectedMode === 'placeholder' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Shows built-in clinical health & BP equipment recommendations.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('custom')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  selectedMode === 'custom'
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Layout className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Custom / Affiliate Promotion</span>
                    {selectedMode === 'custom' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Renders custom links defined in `src/config/adConfig.ts`.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('script')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  selectedMode === 'script'
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <Code className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Google AdSense / Network Script</span>
                    {selectedMode === 'script' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Google AdSense slot with automatic fallback until ads are filled.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Code Integration Guide */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Default Value Configuration
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To change default settings for production builds, update <code className="text-amber-300">AD_BANNER_ENABLED</code> in <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">src/config/adConfig.ts</code>.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-2 text-xs">
            {showSavedFeedback ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" /> Settings updated
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Saved immediately in browser storage</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-950 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

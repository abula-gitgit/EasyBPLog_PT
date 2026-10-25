import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_AD_CONFIG, 
  CustomAdItem, 
  getAdBannerMode 
} from '../../config/adConfig';
import { 
  ExternalLink, 
  HeartPulse, 
  Activity, 
  Sparkles 
} from 'lucide-react';

interface BottomAdBannerProps {
  isEnabled: boolean;
}

export const BottomAdBanner: React.FC<BottomAdBannerProps> = ({
  isEnabled,
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const adMode = getAdBannerMode();
  const adSlotRef = useRef<HTMLModElement | null>(null);
  const isPushedRef = useRef(false);

  // Exact delivery detection via official data-ad-status="filled"
  const [isAdFilled, setIsAdFilled] = useState<boolean>(false);

  const ads = DEFAULT_AD_CONFIG.customAds;
  const currentAd: CustomAdItem = ads[currentAdIndex % ads.length] || ads[0];

  // Rotate custom ads periodically if multiple exist
  useEffect(() => {
    if (!isEnabled || (adMode === 'script' && isAdFilled) || ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isEnabled, adMode, isAdFilled, ads.length]);

  // Google AdSense initialization push
  useEffect(() => {
    if (!isEnabled || adMode !== 'script' || isPushedRef.current) return;
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        isPushedRef.current = true;
      }
    } catch (err) {
      console.debug('AdSense push notice:', err);
    }
  }, [isEnabled, adMode]);

  // Strict data-ad-status="filled" observer
  useEffect(() => {
    if (!isEnabled || adMode !== 'script') return;

    const el = adSlotRef.current;
    if (!el) return;

    const checkAdStatus = () => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'filled') {
        setIsAdFilled(true);
      } else if (status === 'unfilled') {
        setIsAdFilled(false);
      }
    };

    checkAdStatus();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
          checkAdStatus();
        }
      }
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isEnabled, adMode]);

  // Zero-space guarantee: return null if not enabled
  if (!isEnabled) {
    return null;
  }

  return (
    <aside
      aria-label="Anúncio patrocinado"
      className="shrink-0 w-full bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-3 pt-1.5 sm:pt-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] text-white relative z-30 transition-all select-none"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Ad Content */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 relative">
          {/* Badge */}
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wider">
            {adMode === 'script' && isAdFilled ? 'Ad' : currentAd.tag}
          </span>

          {/* AdSense Slot (hidden when unfilled) */}
          {adMode === 'script' && (
            <div 
              id="easybplog-pt-ad-slot" 
              className={
                isAdFilled
                  ? "flex-1 w-full min-h-[50px] flex items-center justify-center text-xs text-slate-400 rounded px-1 transition-opacity duration-300 opacity-100"
                  : "w-0 h-0 max-h-0 min-h-0 overflow-hidden opacity-0 pointer-events-none absolute inset-0 -z-50"
              }
              style={
                isAdFilled 
                  ? { display: 'block', height: 'auto', minHeight: '50px' } 
                  : { display: 'block', height: 0, maxHeight: 0, minHeight: 0, overflow: 'hidden' }
              }
            >
              <ins
                ref={adSlotRef}
                className="adsbygoogle"
                style={
                  isAdFilled
                    ? {
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        minHeight: '50px',
                        background: 'transparent',
                      }
                    : {
                        display: 'block',
                        width: '100%',
                        height: '0px',
                        maxHeight: '0px',
                        minHeight: '0px',
                        overflow: 'hidden',
                        background: 'transparent',
                      }
                }
                data-ad-client={DEFAULT_AD_CONFIG.scriptSettings.client || 'ca-pub-5353304887278086'}
                {...(DEFAULT_AD_CONFIG.scriptSettings.slot ? { 'data-ad-slot': DEFAULT_AD_CONFIG.scriptSettings.slot } : {})}
                data-ad-format={DEFAULT_AD_CONFIG.scriptSettings.adFormat || 'horizontal'}
                data-full-width-responsive="true"
              />
            </div>
          )}

          {/* Fallback Custom Ad Item */}
          {(adMode !== 'script' || !isAdFilled) && (
            <a
              href={currentAd.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center gap-2 sm:gap-3 min-w-0 flex-1 hover:opacity-95 transition-opacity"
              title={`${currentAd.title} - ${currentAd.subtitle}`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                {currentAdIndex % 3 === 0 ? (
                  <HeartPulse className="w-4 h-4" />
                ) : currentAdIndex % 3 === 1 ? (
                  <Activity className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-blue-300 truncate transition-colors">
                  {currentAd.title}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 truncate">
                  {currentAd.subtitle}
                </span>
              </div>

              {currentAd.ctaText && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-blue-400 group-hover:text-blue-300 shrink-0 px-2 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40">
                  <span>{currentAd.ctaText}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </a>
          )}
        </div>

      </div>
    </aside>
  );
};

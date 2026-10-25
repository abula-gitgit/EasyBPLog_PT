/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ShieldCheck, Smartphone } from 'lucide-react';
import { UserSettings } from '../types';

interface HeaderProps {
  settings: UserSettings;
  onLogoClick?: () => void;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  settings, 
  onLogoClick,
  onInstallClick,
  isInstalled = false,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div 
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer select-none active:opacity-80 transition-opacity shrink-0"
          title="EasyBPLog"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              EasyBPLog
            </div>
            <div className="text-[10px] sm:text-xs text-blue-700 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Diretrizes SBC/ESC</span>
            </div>
          </div>
        </div>

        {/* Right Section: Install Button + Clinic / Target Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Install Button */}
          {!isInstalled && onInstallClick && (
            <button
              type="button"
              onClick={onInstallClick}
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer transition-all shrink-0"
              title="Adicionar à tela inicial como aplicativo"
            >
              <Smartphone className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Clinic or Target Info */}
          <div className="text-right hidden sm:block">
            {settings.hospitalName ? (
              <div className="text-xs font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[220px]">
                🏥 {settings.hospitalName}
              </div>
            ) : (
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
                Meta: &lt; {settings.targetSystolic} / {settings.targetDiastolic} mmHg
              </div>
            )}
            {settings.patientName && (
              <div className="text-[11px] text-slate-500 font-medium">
                Paciente: <span className="font-bold text-slate-700">{settings.patientName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

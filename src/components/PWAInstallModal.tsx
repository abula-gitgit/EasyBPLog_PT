/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Smartphone, Share, PlusSquare, MoreVertical, Download, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onNativeInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isInstallable,
  onNativeInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight">
                Instalar EasyBPLog
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Adicionar à tela inicial para acesso em 1 toque
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Benefit Badge */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950 leading-relaxed font-medium">
              Adiciona o ícone do aplicativo na tela do seu celular. Funciona em tela cheia como um app nativo. 100% gratuito e sem cadastro.
            </div>
          </div>

          {/* If Native Browser Prompt is available (Chrome / Edge / Android) */}
          {isInstallable ? (
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold text-slate-700">
                Toque abaixo para instalar diretamente no seu aparelho.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const success = await onNativeInstall();
                  if (success) onClose();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-base shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Adicionar à tela inicial</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iPhone (Safari) Steps */
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Como instalar no iPhone / iPad (Safari)
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 font-semibold flex-1">
                    Toque no botão <Share className="w-4 h-4 inline-block text-blue-600 mx-1 align-sub" /> <strong>Compartilhar</strong> na barra inferior do Safari
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 font-semibold flex-1">
                    Role para baixo e toque em <PlusSquare className="w-4 h-4 inline-block text-slate-700 mx-1 align-sub" /> <strong>Adicionar à Tela de Início</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 font-semibold flex-1">
                    Toque em <strong>Adicionar</strong> no canto superior direito
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / PC (Chrome) Steps */
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Como instalar no Android / PC (Chrome)
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 font-semibold flex-1">
                    Toque no <MoreVertical className="w-4 h-4 inline-block text-slate-700 mx-1 align-sub" /> <strong>Menu (3 pontos)</strong> no canto superior direito
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 font-semibold flex-1">
                    Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Delete, ArrowRight, Check } from 'lucide-react';

interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onNextOrDone: () => void;
  isLastField: boolean;
  allowDecimal: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onBackspace,
  onClear,
  onNextOrDone,
  isLastField,
  allowDecimal,
}) => {
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {
      // Haptics not supported or permitted; safe to ignore
    }
  };

  const handlePress = (digit: string) => {
    triggerHaptic();
    onDigitPress(digit);
  };

  const handleBackspace = () => {
    triggerHaptic();
    onBackspace();
  };

  const handleClear = () => {
    triggerHaptic();
    onClear();
  };

  const handleNextOrDone = () => {
    triggerHaptic();
    onNextOrDone();
  };

  return (
    <div className="w-full bg-slate-900/95 p-2 rounded-2xl shadow-xl border border-slate-700/80 select-none">
      <div className="grid grid-cols-3 gap-1.5">
        {/* Row 1 */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num)}
            className="min-h-[46px] sm:min-h-[52px] bg-white text-slate-900 rounded-xl font-black text-xl sm:text-2xl shadow-sm border-b-2 sm:border-b-3 border-slate-300 active:border-b-0 active:translate-y-0.5 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
            aria-label={`Dígito ${num}`}
          >
            {num}
          </button>
        ))}

        {/* Row 2 */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num)}
            className="min-h-[46px] sm:min-h-[52px] bg-white text-slate-900 rounded-xl font-black text-xl sm:text-2xl shadow-sm border-b-2 sm:border-b-3 border-slate-300 active:border-b-0 active:translate-y-0.5 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
            aria-label={`Dígito ${num}`}
          >
            {num}
          </button>
        ))}

        {/* Row 3 */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num)}
            className="min-h-[46px] sm:min-h-[52px] bg-white text-slate-900 rounded-xl font-black text-xl sm:text-2xl shadow-sm border-b-2 sm:border-b-3 border-slate-300 active:border-b-0 active:translate-y-0.5 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
            aria-label={`Dígito ${num}`}
          >
            {num}
          </button>
        ))}

        {/* Row 4: Decimal (if allowed), 0, Backspace */}
        {allowDecimal ? (
          <button
            type="button"
            onClick={() => handlePress('.')}
            className="min-h-[46px] sm:min-h-[52px] bg-slate-100 text-slate-900 rounded-xl font-black text-2xl shadow-sm border-b-2 sm:border-b-3 border-slate-300 active:border-b-0 active:translate-y-0.5 active:bg-blue-100 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Ponto decimal"
          >
            .
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[46px] sm:min-h-[52px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm border-b-2 sm:border-b-3 border-slate-800 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer px-1 text-center"
            aria-label="Limpar valor"
          >
            Limpar
          </button>
        )}

        <button
          type="button"
          onClick={() => handlePress('0')}
          className="min-h-[46px] sm:min-h-[52px] bg-white text-slate-900 rounded-xl font-black text-xl sm:text-2xl shadow-sm border-b-2 sm:border-b-3 border-slate-300 active:border-b-0 active:translate-y-0.5 active:bg-blue-50 transition-all flex items-center justify-center cursor-pointer"
          aria-label="Dígito 0"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="min-h-[46px] sm:min-h-[52px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-sm border-b-2 sm:border-b-3 border-rose-800 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1 cursor-pointer"
          aria-label="Apagar dígito"
        >
          <Delete className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-bold">Apagar</span>
        </button>
      </div>

      {/* Row 5: Navigation controls */}
      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
        {allowDecimal ? (
          <button
            type="button"
            onClick={handleClear}
            className="min-h-[42px] bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm shadow-sm border-b-2 border-slate-800 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Limpar valor"
          >
            Limpar
          </button>
        ) : (
          <div className="flex items-center justify-center px-1 text-[11px] text-slate-400 font-medium text-center">
            Toque no teclado
          </div>
        )}

        <button
          type="button"
          onClick={handleNextOrDone}
          className={`min-h-[42px] ${
            isLastField
              ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-800 text-white'
              : 'bg-blue-600 hover:bg-blue-700 border-blue-800 text-white'
          } rounded-xl font-bold text-sm sm:text-base shadow-sm border-b-2 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            !allowDecimal ? 'col-span-1' : ''
          }`}
        >
          {isLastField ? (
            <>
              <Check className="w-5 h-5" />
              <span>Concluir</span>
            </>
          ) : (
            <>
              <span>Próximo</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

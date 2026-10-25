/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyRecord, TimeSlot, RoundSlot, InputFieldType, UserSettings } from '../types';
import {
  shiftDateString,
  formatDateEN,
  getAutoTimeSlot,
  createEmptyDailyRecord,
  isSystolicExceeded,
  isDiastolicExceeded,
  getAhaBpCategory,
} from '../utils/bloodPressure';
import { LIFESTYLE_TAGS } from '../utils/constants';
import { NumericKeypad } from './NumericKeypad';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Heart,
  Scale,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

interface RecordViewProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  records: DailyRecord[];
  onSaveRecord: (updatedRecord: DailyRecord) => void;
  settings: UserSettings;
}

export const RecordView: React.FC<RecordViewProps> = ({
  currentDate,
  onDateChange,
  records,
  onSaveRecord,
  settings,
}) => {
  // Morning / Evening slot: initial based on local hour
  const [activeSlot, setActiveSlot] = useState<TimeSlot>(getAutoTimeSlot);
  // 1st or 2nd measurement
  const [activeRound, setActiveRound] = useState<RoundSlot>('first');
  // Keypad visibility state
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  // Currently focused input field for the keypad
  const [activeField, setActiveField] = useState<InputFieldType | null>(null);
  // Save confirmation message
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Find or create current day's record
  const currentRecord =
    records.find((r) => r.date === currentDate) || createEmptyDailyRecord(currentDate);

  // Local state for editing the day's record
  const [formData, setFormData] = useState<DailyRecord>(currentRecord);

  // String buffer for weight input to preserve decimal point (e.g. "154.", "154.2") while typing
  const [weightInputStr, setWeightInputStr] = useState<string>(() =>
    currentRecord.weight !== null && currentRecord.weight !== undefined ? String(currentRecord.weight) : ''
  );

  // Sync form when currentDate changes or records change externally
  useEffect(() => {
    const rec = records.find((r) => r.date === currentDate);
    const initialData = rec ? JSON.parse(JSON.stringify(rec)) : createEmptyDailyRecord(currentDate);
    setFormData(initialData);
    setWeightInputStr(
      initialData.weight !== null && initialData.weight !== undefined ? String(initialData.weight) : ''
    );
  }, [currentDate, records]);

  const { formatted, dayOfWeek, isWeekend } = formatDateEN(currentDate, false);

  // Current slot's measurement values
  const currentMeasurement = formData[activeSlot][activeRound];

  // Evaluate AHA category for currently viewed reading
  const currentCategory = getAhaBpCategory(currentMeasurement.systolic, currentMeasurement.diastolic);

  // Helper to update specific measurement values
  const updateMeasurementValue = (field: 'systolic' | 'diastolic' | 'pulse', value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      [activeSlot]: {
        ...prev[activeSlot],
        [activeRound]: {
          ...prev[activeSlot][activeRound],
          [field]: value,
        },
      },
    }));
  };

  const updateWeight = (val: number | null) => {
    setFormData((prev) => ({
      ...prev,
      weight: val,
    }));
  };

  // Helper to select field and sync buffer
  const handleSelectField = (field: InputFieldType) => {
    if (activeField === 'weight' && field !== 'weight') {
      const cleanStr = weightInputStr.endsWith('.') ? weightInputStr.slice(0, -1) : weightInputStr;
      const finalVal = cleanStr === '' ? null : parseFloat(cleanStr);
      updateWeight(isNaN(finalVal as number) ? null : finalVal);
      setWeightInputStr(finalVal !== null ? String(finalVal) : '');
    }
    if (field === 'weight') {
      setWeightInputStr(
        formData.weight !== null && formData.weight !== undefined ? String(formData.weight) : ''
      );
    }
    setActiveField(field);
    setIsKeypadOpen(true);
  };

  const handleCloseKeypad = () => {
    if (activeField === 'weight') {
      const cleanStr = weightInputStr.endsWith('.') ? weightInputStr.slice(0, -1) : weightInputStr;
      const finalVal = cleanStr === '' ? null : parseFloat(cleanStr);
      updateWeight(isNaN(finalVal as number) ? null : finalVal);
      setWeightInputStr(finalVal !== null ? String(finalVal) : '');
    }
    setIsKeypadOpen(false);
    setActiveField(null);
  };

  // Tag toggle
  const toggleTag = (tagId: string) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tagId);
      const newTags = exists ? prev.tags.filter((t) => t !== tagId) : [...prev.tags, tagId];
      return { ...prev, tags: newTags };
    });
  };

  // Keypad Handlers
  const handleDigitPress = (rawDigit: string) => {
    if (!activeField) return;
    const digit = rawDigit.trim();

    if (activeField === 'weight') {
      let nextStr = weightInputStr;
      if (digit === '.') {
        if (!nextStr.includes('.')) {
          nextStr = nextStr === '' ? '0.' : nextStr + '.';
          setWeightInputStr(nextStr);
          const parsed = parseFloat(nextStr);
          updateWeight(isNaN(parsed) ? null : parsed);
        }
      } else if (/[0-9]/.test(digit)) {
        if (nextStr.includes('.')) {
          const parts = nextStr.split('.');
          // Max 1 decimal place (e.g. 154.2)
          if (parts[1].length >= 1) return;
          nextStr = nextStr + digit;
        } else {
          if (nextStr === '0') {
            nextStr = digit;
          } else {
            // Cap integer part at 3 digits
            if (nextStr.length >= 3) return;
            nextStr = nextStr + digit;
          }
        }
        setWeightInputStr(nextStr);
        const parsed = parseFloat(nextStr);
        updateWeight(isNaN(parsed) ? null : parsed);
      }
      return;
    }

    const currentVal = currentMeasurement[activeField];
    const currentStr = currentVal !== null ? String(currentVal) : '';
    if (currentStr.length >= 3) return; // Cap at 3 digits

    const nextStr = currentStr + digit;
    const num = parseInt(nextStr, 10);
    updateMeasurementValue(activeField, num);

    // Auto advance heuristics
    if (activeField === 'systolic') {
      if (num >= 70 && nextStr.length >= 3) {
        handleSelectField('diastolic');
      }
    } else if (activeField === 'diastolic') {
      if (num >= 40 && nextStr.length >= 2) {
        handleSelectField('pulse');
      }
    }
  };

  const handleBackspace = () => {
    if (!activeField) return;
    if (activeField === 'weight') {
      if (weightInputStr.length <= 1) {
        setWeightInputStr('');
        updateWeight(null);
      } else {
        const nextStr = weightInputStr.slice(0, -1);
        setWeightInputStr(nextStr);
        if (nextStr === '' || nextStr === '.' || nextStr === '0.') {
          updateWeight(null);
        } else {
          const parsed = parseFloat(nextStr);
          updateWeight(isNaN(parsed) ? null : parsed);
        }
      }
      return;
    }

    const currentVal = currentMeasurement[activeField];
    const currentStr = currentVal !== null ? String(currentVal) : '';
    if (currentStr.length <= 1) {
      updateMeasurementValue(activeField, null);
    } else {
      const nextStr = currentStr.slice(0, -1);
      updateMeasurementValue(activeField, parseInt(nextStr, 10));
    }
  };

  const handleClear = () => {
    if (!activeField) return;
    if (activeField === 'weight') {
      setWeightInputStr('');
      updateWeight(null);
    } else {
      updateMeasurementValue(activeField, null);
    }
  };

  const handleNextOrDone = () => {
    if (activeField === 'systolic') {
      handleSelectField('diastolic');
    } else if (activeField === 'diastolic') {
      handleSelectField('pulse');
    } else if (activeField === 'pulse') {
      handleSelectField('weight');
    } else {
      // Done - finalize weight, close keypad and save
      const cleanStr = weightInputStr.endsWith('.') ? weightInputStr.slice(0, -1) : weightInputStr;
      const finalVal = cleanStr === '' ? null : parseFloat(cleanStr);
      const finalData: DailyRecord = {
        ...formData,
        weight: isNaN(finalVal as number) ? null : finalVal,
      };
      setWeightInputStr(finalVal !== null ? String(finalVal) : '');
      setIsKeypadOpen(false);
      setActiveField(null);
      onSaveRecord(finalData);
      setSaveToast(`✅ Registro salvo (${formatDateEN(currentDate).formatted})`);
      setTimeout(() => {
        setSaveToast(null);
      }, 3000);
    }
  };

  const handleSave = () => {
    let finalWeight = formData.weight;
    if (activeField === 'weight') {
      const cleanStr = weightInputStr.endsWith('.') ? weightInputStr.slice(0, -1) : weightInputStr;
      const finalVal = cleanStr === '' ? null : parseFloat(cleanStr);
      finalWeight = isNaN(finalVal as number) ? null : finalVal;
    }
    const finalData = { ...formData, weight: finalWeight };
    onSaveRecord(finalData);
    setSaveToast(`✅ Registro salvo (${formatDateEN(currentDate).formatted})`);
    setTimeout(() => {
      setSaveToast(null);
    }, 3000);
  };

  const targetSys = settings.targetSystolic;
  const targetDia = settings.targetDiastolic;
  const weightUnit = settings.weightUnit || 'kg';

  return (
    <div className="pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-3">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          <span className="text-base sm:text-lg">{saveToast}</span>
        </div>
      )}

      {/* 1. Date Selector Bar */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-sm border border-slate-200 flex items-center justify-between gap-1.5 sm:gap-2 mb-3">
        <button
          type="button"
          onClick={() => onDateChange(shiftDateString(currentDate, -1))}
          aria-label="Dia anterior"
          className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
        </button>

        <div className="flex flex-col items-center justify-center text-center px-1 min-w-0">
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Data da medição</span>
          </div>
          <span
            className={`text-base sm:text-xl font-black tracking-tight whitespace-nowrap ${
              isWeekend ? (dayOfWeek === 'Dom' ? 'text-rose-600' : 'text-blue-600') : 'text-slate-900'
            }`}
          >
            {formatted}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDateChange(shiftDateString(currentDate, 1))}
          aria-label="Próximo dia"
          className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>
      </div>

      {/* 2. AHA Clinical Guideline Tip */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 sm:p-3 mb-3 text-xs sm:text-sm text-blue-900 flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-blue-950">Regra de Medição SBC/ESC: </strong>
          {activeSlot === 'morning' ? (
            <span>Repouse 5 minutos sentado. Meça até 1 hora após acordar, após urinar e antes do café da manhã ou remédios.</span>
          ) : (
            <span>Meça antes de dormir. Evite medir logo após banho quente, bebida alcoólica ou exercício. Descanse 5 min.</span>
          )}
        </div>
      </div>

      {/* 3. Morning / Evening Extra-Large Switcher */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            setActiveSlot('morning');
            setActiveField('systolic');
          }}
          className={`min-h-[46px] sm:min-h-[48px] py-2 px-3 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
            activeSlot === 'morning'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <Sun className={`w-5 h-5 sm:w-6 sm:h-6 ${activeSlot === 'morning' ? 'text-amber-100' : 'text-amber-500'}`} />
          <span>Manhã</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSlot('evening');
            setActiveField('systolic');
          }}
          className={`min-h-[46px] sm:min-h-[48px] py-2 px-3 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
            activeSlot === 'evening'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/50'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50/50'
          }`}
        >
          <Moon className={`w-5 h-5 sm:w-6 sm:h-6 ${activeSlot === 'evening' ? 'text-indigo-200' : 'text-indigo-500'}`} />
          <span>Noite</span>
        </button>
      </div>

      {/* 4. Measurement Round Switcher (Reading 1 / Reading 2) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm mb-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Medida:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveRound('first')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm sm:text-base font-bold transition-colors cursor-pointer ${
                  activeRound === 'first'
                    ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1.ª Medida
              </button>
              <button
                type="button"
                onClick={() => setActiveRound('second')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm sm:text-base font-bold transition-colors cursor-pointer ${
                  activeRound === 'second'
                    ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ＋ 2.ª Medida
              </button>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">1 min de intervalo</span>
        </div>

        {/* AHA Real-time Category Indicator Badge */}
        {currentCategory && (
          <div className="mb-2.5 px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs font-bold gap-2 transition-all">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-600">Classificação:</span>
              <span className={`px-2 py-0.5 rounded-md border text-xs font-black ${currentCategory.badgeClass}`}>
                {currentCategory.label}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              {currentCategory.description}
            </span>
          </div>
        )}

        {/* 5. Values Display Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-3">
          {/* Systolic (SYS) */}
          <button
            type="button"
            onClick={() => handleSelectField('systolic')}
            className={`p-2 sm:p-3 rounded-2xl text-left border-2 transition-all cursor-pointer relative ${
              isKeypadOpen && activeField === 'systolic'
                ? 'ring-4 ring-blue-600 bg-blue-50/90 border-blue-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 leading-none">
              <span className="whitespace-nowrap">Sistólica (SIS)</span>
              {isSystolicExceeded(currentMeasurement.systolic, targetSys) && (
                <span className="text-[10px] text-rose-600 font-black whitespace-nowrap bg-rose-50 px-1 py-0.5 rounded border border-rose-200 leading-none">
                  ▲ Alta
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-0.5 sm:gap-1">
              <span
                className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono tabular-nums tracking-tight ${
                  currentMeasurement.systolic
                    ? isSystolicExceeded(currentMeasurement.systolic, targetSys)
                      ? 'text-rose-600'
                      : 'text-slate-900'
                    : 'text-slate-300'
                }`}
              >
                {currentMeasurement.systolic ?? '---'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold whitespace-nowrap">
                mmHg
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
              Meta: &lt; {targetSys}
            </div>
          </button>

          {/* Diastolic (DIA) */}
          <button
            type="button"
            onClick={() => handleSelectField('diastolic')}
            className={`p-2 sm:p-3 rounded-2xl text-left border-2 transition-all cursor-pointer relative ${
              isKeypadOpen && activeField === 'diastolic'
                ? 'ring-4 ring-blue-600 bg-blue-50/90 border-blue-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 leading-none">
              <span className="whitespace-nowrap">Diastólica (DIA)</span>
              {isDiastolicExceeded(currentMeasurement.diastolic, targetDia) && (
                <span className="text-[10px] text-rose-600 font-black whitespace-nowrap bg-rose-50 px-1 py-0.5 rounded border border-rose-200 leading-none">
                  ▲ Alta
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-0.5 sm:gap-1">
              <span
                className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono tabular-nums tracking-tight ${
                  currentMeasurement.diastolic
                    ? isDiastolicExceeded(currentMeasurement.diastolic, targetDia)
                      ? 'text-rose-600'
                      : 'text-slate-900'
                    : 'text-slate-300'
                }`}
              >
                {currentMeasurement.diastolic ?? '---'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold whitespace-nowrap">
                mmHg
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
              Meta: &lt; {targetDia}
            </div>
          </button>

          {/* Pulse (BPM) */}
          <button
            type="button"
            onClick={() => handleSelectField('pulse')}
            className={`p-2 sm:p-3 rounded-2xl text-left border-2 transition-all cursor-pointer relative ${
              isKeypadOpen && activeField === 'pulse'
                ? 'ring-4 ring-blue-600 bg-blue-50/90 border-blue-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 leading-none">
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Pulso</span>
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-0.5 sm:gap-1">
              <span
                className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono tabular-nums tracking-tight ${
                  currentMeasurement.pulse ? 'text-slate-900' : 'text-slate-300'
                }`}
              >
                {currentMeasurement.pulse ?? '---'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold whitespace-nowrap">
                BPM
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
              Repouso
            </div>
          </button>
        </div>

        {/* Weight Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelectField('weight')}
            className={`flex-1 p-2 sm:p-2.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
              isKeypadOpen && activeField === 'weight'
                ? 'ring-4 ring-blue-600 bg-blue-50/90 border-blue-600 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-slate-700">Peso de hoje:</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-extrabold font-mono tabular-nums ${
                  (isKeypadOpen && activeField === 'weight' ? weightInputStr : formData.weight !== null)
                    ? 'text-slate-900'
                    : 'text-slate-300'
                }`}
              >
                {isKeypadOpen && activeField === 'weight'
                  ? (weightInputStr || '---')
                  : (formData.weight !== null && formData.weight !== undefined
                      ? Number(formData.weight).toFixed(1)
                      : '---')}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{weightUnit}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 6. Senior Numeric Keypad */}
      {isKeypadOpen && activeField && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 px-1 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>
                Digitando:
                <span className="text-blue-900 font-extrabold text-sm ml-1">
                  {activeField === 'systolic'
                    ? 'Sistólica (SIS)'
                    : activeField === 'diastolic'
                    ? 'Diastólica (DIA)'
                    : activeField === 'pulse'
                    ? 'Pulso (BPM)'
                    : `Peso (${weightUnit})`}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={handleCloseKeypad}
              className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Fechar teclado</span>
            </button>
          </div>
          <NumericKeypad
            onDigitPress={handleDigitPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onNextOrDone={handleNextOrDone}
            isLastField={activeField === 'weight'}
            allowDecimal={activeField === 'weight'}
          />
        </div>
      )}

      {/* Button to open keypad when closed */}
      {!isKeypadOpen && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => handleSelectField('systolic')}
            className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 text-blue-900 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Keyboard className="w-4 h-4 text-blue-700" />
            <span>Toque em qualquer valor acima ou toque aqui para abrir o teclado</span>
          </button>
        </div>
      )}

      {/* 7. Lifestyle & Clinical Context Tags */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Rotina e Sintomas (toque para marcar)
          </h3>
          <span className="text-xs text-slate-400">Para o relatório médico</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LIFESTYLE_TAGS.map((tag) => {
            const isSelected = formData.tags.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`h-12 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer whitespace-nowrap overflow-hidden ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{tag.label}</span>
              </button>
            );
          })}
        </div>

        {/* Doctor's Note / Symptoms */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <label htmlFor="daily-note" className="block text-xs font-bold text-slate-500 mb-1">
            Observações para o médico / Sintomas (Opcional)
          </label>
          <input
            id="daily-note"
            type="text"
            value={formData.note}
            onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Ex.: Leve dor de cabeça pela manhã, caminhada de 30 min, esqueci a dose"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 8. Save Record Primary Button */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-[56px] bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 border-b-4 border-blue-950 cursor-pointer transition-all"
      >
        <Save className="w-6 h-6" />
        <span>Salvar registro do dia</span>
      </button>
    </div>
  );
};

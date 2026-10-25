/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { DailyRecord, UserSettings } from '../types';
import {
  shiftDateString,
  formatDateEN,
  getSlotAverage,
  getTodayDateString,
  calculatePeriodAverage,
} from '../utils/bloodPressure';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Scale,
  Download,
  Check,
  Loader2,
} from 'lucide-react';

interface GraphViewProps {
  records: DailyRecord[];
  settings: UserSettings;
}

export const GraphView: React.FC<GraphViewProps> = ({ records, settings }) => {
  const getRecentStartDate = (days: number) =>
    shiftDateString(getTodayDateString(), -(days - 1));

  const [rangeDays, setRangeDays] = useState<7 | 14 | 30 | 90 | 180>(14);
  const [windowStartDate, setWindowStartDate] = useState<string>(() =>
    getRecentStartDate(14)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const targetSys = settings.targetSystolic;
  const targetDia = settings.targetDiastolic;
  const weightUnit = settings.weightUnit || 'kg';

  // Create date window
  const dateList: string[] = [];
  for (let i = 0; i < rangeDays; i++) {
    dateList.push(shiftDateString(windowStartDate, i));
  }

  const shiftPeriod = (delta: -1 | 1) => {
    setWindowStartDate((prev) => shiftDateString(prev, delta * rangeDays));
  };

  const handleSelectRange = (days: 7 | 14 | 30 | 90 | 180) => {
    setRangeDays(days);
    setWindowStartDate(getRecentStartDate(days));
  };

  const jumpToRecent = () => {
    setWindowStartDate(getRecentStartDate(rangeDays));
  };

  const startDateFormatted = formatDateEN(dateList[0]).formatted;
  const endDateFormatted = formatDateEN(dateList[dateList.length - 1]).formatted;

  const recordMap = new Map<string, DailyRecord>();
  records.forEach((r) => recordMap.set(r.date, r));

  // Prepare chart points
  const points = dateList.map((d) => {
    const rec = recordMap.get(d);
    if (!rec) {
      return {
        date: d,
        morning: { systolic: null, diastolic: null, pulse: null },
        evening: { systolic: null, diastolic: null, pulse: null },
        weight: null,
        tags: [] as string[],
        note: '',
      };
    }
    const mAvg = getSlotAverage(rec.morning.first, rec.morning.second);
    const eAvg = getSlotAverage(rec.evening.first, rec.evening.second);
    return {
      date: d,
      morning: mAvg,
      evening: eAvg,
      weight: rec.weight,
      tags: rec.tags,
      note: rec.note,
    };
  });

  const handleExportImage = async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const dataUrl = await toPng(exportContainerRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });

      const rangeLabel =
        rangeDays === 7
          ? '1Semana'
          : rangeDays === 14
          ? '2Semanas'
          : rangeDays === 30
          ? '1Mes'
          : rangeDays === 90
          ? '3Meses'
          : '6Meses';

      const safeStart = dateList[0].replace(/-/g, '');
      const safeEnd = dateList[dateList.length - 1].replace(/-/g, '');
      const patientPrefix = settings.patientName?.trim()
        ? `${settings.patientName.trim().replace(/[/\\?%*:|"<>]/g, '')}_`
        : '';
      const filename = `${patientPrefix}BP_Chart_${safeStart}-${safeEnd}_${rangeLabel}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to export graph image:', err);
      setExportError('Não foi possível salvar a imagem do gráfico. Tente novamente.');
      setTimeout(() => {
        setExportError(null);
      }, 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // SVG Chart Dimensions
  const svgWidth = 530;
  const svgHeight = 296;
  const paddingLeft = 40;
  const paddingRight = 62;
  const paddingTop = 22;
  const paddingBottom = 46;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minY = 50;
  const maxY = 180;

  const getY = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + chartHeight - ((clamped - minY) / (maxY - minY)) * chartHeight;
  };

  const getX = (index: number) => {
    if (points.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  // Build SVG path strings
  const buildPath = (accessor: (p: (typeof points)[0]) => number | null) => {
    let d = '';
    let inSegment = false;

    points.forEach((p, idx) => {
      const val = accessor(p);
      if (val !== null) {
        const x = getX(idx);
        const y = getY(val);
        if (y !== null) {
          if (!inSegment) {
            d += `M ${x} ${y}`;
            inSegment = true;
          } else {
            d += ` L ${x} ${y}`;
          }
        }
      } else {
        inSegment = false;
      }
    });

    return d;
  };

  const morningSysPath = buildPath((p) => p.morning.systolic);
  const morningDiaPath = buildPath((p) => p.morning.diastolic);
  const eveningSysPath = buildPath((p) => p.evening.systolic);
  const eveningDiaPath = buildPath((p) => p.evening.diastolic);

  const targetSysY = getY(targetSys) ?? 0;
  const targetDiaY = getY(targetDia) ?? 0;

  // Weight Chart Scale & Geometry Calculations
  const weightValues = points
    .map((p) => p.weight)
    .filter((w): w is number => w !== null && w > 0);

  const hasWeightData = weightValues.length > 0;
  const rawMinW = hasWeightData ? Math.min(...weightValues) : 65;
  const rawMaxW = hasWeightData ? Math.max(...weightValues) : 78;

  let minW = Math.floor(rawMinW - 1);
  let maxW = Math.ceil(rawMaxW + 1);
  if (maxW - minW < 4) {
    minW -= 2;
    maxW += 2;
  }
  const midW = Number(((minW + maxW) / 2).toFixed(1));

  const svgWeightHeight = 96;
  const paddingWeightTop = 18;
  const paddingWeightBottom = 16;
  const chartWeightHeight = svgWeightHeight - paddingWeightTop - paddingWeightBottom;

  const getYWeight = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(minW, Math.min(maxW, val));
    return (
      paddingWeightTop +
      chartWeightHeight -
      ((clamped - minW) / (maxW - minW)) * chartWeightHeight
    );
  };

  let weightPath = '';
  let weightAreaPath = '';
  let inWeightSegment = false;
  let lastWeightX = 0;

  points.forEach((p, idx) => {
    if (p.weight !== null) {
      const x = getX(idx);
      const y = getYWeight(p.weight);
      if (y !== null) {
        if (!inWeightSegment) {
          weightPath += `M ${x} ${y}`;
          weightAreaPath += `M ${x} ${paddingWeightTop + chartWeightHeight} L ${x} ${y}`;
          inWeightSegment = true;
        } else {
          weightPath += ` L ${x} ${y}`;
          weightAreaPath += ` L ${x} ${y}`;
        }
        lastWeightX = x;
      }
    } else {
      inWeightSegment = false;
    }
  });

  if (weightAreaPath && lastWeightX > 0) {
    weightAreaPath += ` L ${lastWeightX} ${paddingWeightTop + chartWeightHeight} Z`;
  }

  const avgWeight =
    weightValues.length > 0
      ? (weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(1)
      : null;

  // Period overall calculations for Doctor's summary
  const windowRecords: DailyRecord[] = dateList
    .map((d) => recordMap.get(d))
    .filter((r): r is DailyRecord => Boolean(r));

  const morningStats = calculatePeriodAverage(windowRecords, 'morning');
  const eveningStats = calculatePeriodAverage(windowRecords, 'evening');

  // Check for Early Morning Hypertension (Morning Surge): morning avg sys >= 135 while evening avg sys is normal (< 125)
  const isEarlyMorningHypertension =
    morningStats.avgSystolic !== null &&
    morningStats.avgSystolic >= 135 &&
    eveningStats.avgSystolic !== null &&
    eveningStats.avgSystolic < 125;

  const selectedPoint = points.find((p) => p.date === selectedDate);

  return (
    <div className="pb-24 max-w-4xl mx-auto px-2 sm:px-4 pt-3">
      {/* Top Controls - Single Line */}
      {/* Top Controls - Single Line without overflow */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-sm border border-slate-200 mb-2 sm:mb-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 sm:p-1 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectRange(7)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rangeDays === 7 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">1S</span>
              <span className="hidden sm:inline">1 Semana</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange(14)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rangeDays === 14 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">2S</span>
              <span className="hidden sm:inline">2 Semanas</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange(30)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rangeDays === 30 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">1M</span>
              <span className="hidden sm:inline">1 Mês</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange(90)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rangeDays === 90 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">3M</span>
              <span className="hidden sm:inline">3 Meses</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRange(180)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                rangeDays === 180 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">6M</span>
              <span className="hidden sm:inline">6 Meses</span>
            </button>
          </div>

          <button
            type="button"
            onClick={jumpToRecent}
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 mb-2 sm:mb-3 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => shiftPeriod(-1)}
          aria-label="Período anterior"
          className="min-h-[38px] min-w-[38px] p-2 bg-white border border-slate-200 rounded-xl text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 cursor-pointer shadow-sm shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-center gap-1 whitespace-nowrap min-w-0">
          <Calendar className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
          <span className="whitespace-nowrap">{startDateFormatted}</span>
          <span className="text-slate-400 mx-0.5 shrink-0">a</span>
          <span className="whitespace-nowrap">{endDateFormatted}</span>
        </div>

        <button
          type="button"
          onClick={() => shiftPeriod(1)}
          aria-label="Próximo período"
          className="min-h-[38px] min-w-[38px] p-2 bg-white border border-slate-200 rounded-xl text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 cursor-pointer shadow-sm shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Clinical Pattern Evaluation Banner */}
      {isEarlyMorningHypertension && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 mb-3 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="font-bold text-amber-950">
              【Alerta de Hipertensão Matinal (Ascensão Matinal)】
            </div>
            <div className="text-amber-900 mt-0.5 leading-relaxed">
              Sua pressão sistólica pela manhã (Média {morningStats.avgSystolic} mmHg) está significativamente maior que à noite (Média{' '}
              {eveningStats.avgSystolic} mmHg). Converse com seu cardiologista sobre o horário da medicação.
            </div>
          </div>
        </div>
      )}

      {/* Selected Date Detail Card */}
      {selectedPoint && (
        <div className="bg-slate-50 border-2 border-blue-300 rounded-2xl p-3 mb-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-xs sm:text-sm text-slate-900">
              {formatDateEN(selectedPoint.date).formattedFull}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Morning */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-700">☀️ Manhã:</span>
              <span className="font-black text-red-600 font-mono text-sm" title="Morning Systolic">
                {selectedPoint.morning.systolic ?? '--'}
              </span>
              <span className="text-slate-400 font-mono">/</span>
              <span className="font-black text-blue-700 font-mono text-sm" title="Morning Diastolic">
                {selectedPoint.morning.diastolic ?? '--'}
              </span>
              {selectedPoint.morning.pulse && (
                <span className="text-[11px] text-slate-500 font-mono ml-0.5">
                  ({selectedPoint.morning.pulse} bpm)
                </span>
              )}
            </div>

            {/* Evening */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-700">🌙 Noite:</span>
              <span className="font-black text-pink-500 font-mono text-sm" title="Evening Systolic">
                {selectedPoint.evening.systolic ?? '--'}
              </span>
              <span className="text-slate-400 font-mono">/</span>
              <span className="font-black text-green-500 font-mono text-sm" title="Evening Diastolic">
                {selectedPoint.evening.diastolic ?? '--'}
              </span>
              {selectedPoint.evening.pulse && (
                <span className="text-[11px] text-slate-500 font-mono ml-0.5">
                  ({selectedPoint.evening.pulse} bpm)
                </span>
              )}
            </div>

            {selectedPoint.weight && (
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-emerald-800 font-bold shadow-xs">
                <span>Peso:</span>
                <span className="font-mono font-black">{selectedPoint.weight} {weightUnit}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Action Row: Export PNG */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1">
          <span>🩺</span>
          <span>Relatório gráfico para consulta médica</span>
        </span>
        <button
          type="button"
          onClick={handleExportImage}
          disabled={isExporting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
            exportSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Salvar gráfico de evolução em imagem PNG de alta resolução"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : exportSuccess ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>
            {isExporting ? 'Gerando imagem...' : exportSuccess ? 'Imagem salva!' : 'Salvar gráfico PNG'}
          </span>
        </button>
      </div>

      {exportError && (
        <div className="mb-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {exportError}
        </div>
      )}

      {/* Exportable Graph & Legend Container */}
      <div
        ref={exportContainerRef}
        className="bg-white rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-200"
      >
        {/* Header Bar inside exported image for physician reference */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-xs gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            <span className="font-extrabold text-xs sm:text-sm text-slate-800 whitespace-nowrap shrink-0">
              Curva de Pressão Arterial
            </span>
            <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shrink-0">
              {rangeDays === 7
                ? '1 Semana'
                : rangeDays === 14
                ? '2 Semanas'
                : rangeDays === 30
                ? '1 Mês'
                : rangeDays === 90
                ? '3 Meses'
                : '6 Meses'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap text-right ml-auto">
            {settings.patientName?.trim() && (
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                <span className="text-slate-500 font-normal mr-1">Paciente:</span>
                {settings.patientName.trim()}
              </span>
            )}
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 font-mono whitespace-nowrap">
              {startDateFormatted} a {endDateFormatted}
            </span>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 mb-2.5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs">
            {/* Morning Solid */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-[11px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                ☀️ Manhã
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shrink-0"></span>
                SYS
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block shrink-0"></span>
                DIA
              </span>
            </div>

            {/* Evening Dashed */}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 text-[11px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                🌙 Noite
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-pink-400 inline-block shrink-0"></span>
                SYS
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-green-400 inline-block shrink-0"></span>
                DIA
              </span>
            </div>

            {/* Target lines */}
            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="inline-flex items-center gap-1 font-bold text-red-700">
                <span className="w-3.5 h-0 border-b-2 border-dashed border-red-500 inline-block"></span>
                Meta SIS &lt; {targetSys}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                <span className="w-3.5 h-0 border-b-2 border-dashed border-blue-500 inline-block"></span>
                Meta DIA &lt; {targetDia}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none block">
            {/* Gridlines */}
            {[60, 80, 100, 120, 140, 160, 180].map((yVal) => {
              const y = getY(yVal);
              if (y === null) return null;
              return (
                <g key={yVal}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 6}
                    y={y + 4.5}
                    textAnchor="end"
                    className="text-[14px] font-mono fill-slate-500 font-bold"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Target Line: Systolic */}
            <line
              x1={paddingLeft}
              y1={targetSysY}
              x2={svgWidth - paddingRight}
              y2={targetSysY}
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <rect
              x={svgWidth - paddingRight + 3}
              y={targetSysY - 8}
              width="54"
              height="16"
              rx="4"
              fill="#fee2e2"
            />
            <text
              x={svgWidth - paddingRight + 30}
              y={targetSysY + 4}
              textAnchor="middle"
              className="text-[9px] font-bold fill-red-900"
            >
              Meta &lt;{targetSys}
            </text>

            {/* Target Line: Diastolic */}
            <line
              x1={paddingLeft}
              y1={targetDiaY}
              x2={svgWidth - paddingRight}
              y2={targetDiaY}
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            <rect
              x={svgWidth - paddingRight + 3}
              y={targetDiaY - 8}
              width="54"
              height="16"
              rx="4"
              fill="#dbeafe"
            />
            <text
              x={svgWidth - paddingRight + 30}
              y={targetDiaY + 4}
              textAnchor="middle"
              className="text-[9px] font-bold fill-blue-900"
            >
              Meta &lt;{targetDia}
            </text>

            {/* Date vertical reference lines & labels */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const { dayOfWeek } = formatDateEN(p.date);
              const isSelected = selectedDate === p.date;
              const dateLabel = p.date.slice(5).replace('-', '/');
              const showDateLabel =
                rangeDays === 7 ||
                (rangeDays === 14 && ((idx % 2 === 0 && idx !== points.length - 2) || idx === points.length - 1)) ||
                (rangeDays === 30 && (idx % 5 === 0 || idx === points.length - 1)) ||
                (rangeDays === 90 && (idx % 15 === 0 || idx === points.length - 1)) ||
                (rangeDays === 180 && (idx % 30 === 0 || idx === points.length - 1));

              return (
                <g key={p.date}>
                  {/* Subtle tick on X-axis */}
                  <line
                    x1={x}
                    y1={svgHeight - paddingBottom}
                    x2={x}
                    y2={svgHeight - paddingBottom + 3}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  {isSelected && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={svgHeight - paddingBottom}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                  )}
                  {showDateLabel && (
                    <text
                      x={x}
                      y={svgHeight - paddingBottom + 16}
                      textAnchor="middle"
                      className={`text-[14px] font-mono font-bold ${
                        isSelected ? 'fill-blue-700 font-extrabold' : 'fill-slate-700'
                      }`}
                    >
                      {dateLabel}
                    </text>
                  )}
                  {(rangeDays === 7 || rangeDays === 14) && showDateLabel && (
                    <text
                      x={x}
                      y={svgHeight - paddingBottom + 33}
                      textAnchor="middle"
                      className={`text-[14px] font-bold ${
                        dayOfWeek === 'Dom'
                          ? 'fill-rose-500'
                          : dayOfWeek === 'Sáb'
                          ? 'fill-blue-500'
                          : 'fill-slate-500'
                      }`}
                    >
                      ({dayOfWeek})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Paths */}
            {/* Morning Systolic: Vivid Red Solid */}
            <path
              d={morningSysPath}
              fill="none"
              stroke="#dc2626"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Morning Diastolic: Vivid Royal Blue Solid */}
            <path
              d={morningDiaPath}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Evening Systolic: Soft Pink Dashed */}
            <path
              d={eveningSysPath}
              fill="none"
              stroke="#f472b6"
              strokeWidth="3"
              strokeDasharray="6 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Evening Diastolic: Soft Green Dashed */}
            <path
              d={eveningDiaPath}
              fill="none"
              stroke="#4ade80"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points on Morning and Evening */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const mSysY = getY(p.morning.systolic);
              const mDiaY = getY(p.morning.diastolic);
              const eSysY = getY(p.evening.systolic);
              const eDiaY = getY(p.evening.diastolic);

              return (
                <g key={`pts-${p.date}`}>
                  {/* Invisible hit column */}
                  <rect
                    x={x - (chartWidth / points.length) / 2}
                    y={paddingTop}
                    width={chartWidth / points.length}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer hover:fill-blue-50/20"
                    onClick={() => setSelectedDate(p.date)}
                  />

                  {/* Morning Systolic Point */}
                  {mSysY !== null && (
                    <circle
                      cx={x}
                      cy={mSysY}
                      r={rangeDays <= 14 ? 4.5 : rangeDays === 30 ? 3.5 : rangeDays === 90 ? 2.5 : 1.8}
                      fill="#dc2626"
                      stroke="#ffffff"
                      strokeWidth={rangeDays >= 90 ? "1" : "2"}
                    />
                  )}
                  {/* Morning Diastolic Point */}
                  {mDiaY !== null && (
                    <circle
                      cx={x}
                      cy={mDiaY}
                      r={rangeDays <= 14 ? 4 : rangeDays === 30 ? 3 : rangeDays === 90 ? 2 : 1.5}
                      fill="#1d4ed8"
                      stroke="#ffffff"
                      strokeWidth={rangeDays >= 90 ? "1" : "1.5"}
                    />
                  )}

                  {/* Evening Systolic Point */}
                  {eSysY !== null && (
                    <rect
                      x={x - (rangeDays <= 14 ? 4 : rangeDays === 30 ? 3 : rangeDays === 90 ? 2 : 1.5)}
                      y={eSysY - (rangeDays <= 14 ? 4 : rangeDays === 30 ? 3 : rangeDays === 90 ? 2 : 1.5)}
                      width={rangeDays <= 14 ? 8 : rangeDays === 30 ? 6 : rangeDays === 90 ? 4 : 3}
                      height={rangeDays <= 14 ? 8 : rangeDays === 30 ? 6 : rangeDays === 90 ? 4 : 3}
                      rx="0.5"
                      fill="#f472b6"
                      stroke="#ffffff"
                      strokeWidth={rangeDays >= 90 ? "1" : "1.5"}
                    />
                  )}
                  {/* Evening Diastolic Point */}
                  {eDiaY !== null && (
                    <rect
                      x={x - (rangeDays <= 14 ? 3.5 : rangeDays === 30 ? 2.5 : rangeDays === 90 ? 1.8 : 1.3)}
                      y={eDiaY - (rangeDays <= 14 ? 3.5 : rangeDays === 30 ? 2.5 : rangeDays === 90 ? 1.8 : 1.3)}
                      width={rangeDays <= 14 ? 7 : rangeDays === 30 ? 5 : rangeDays === 90 ? 3.5 : 2.6}
                      height={rangeDays <= 14 ? 7 : rangeDays === 30 ? 5 : rangeDays === 90 ? 3.5 : 2.6}
                      rx="0.5"
                      fill="#4ade80"
                      stroke="#ffffff"
                      strokeWidth={rangeDays >= 90 ? "1" : "1.5"}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Weight Transition Graph */}
        <div className="mt-3 pt-2.5 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Evolução do Peso ({weightUnit})</span>
              </span>
              {avgWeight && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5">
                  Média do período: {avgWeight} {weightUnit}
                </span>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-50/50 rounded-xl p-1 sm:p-2 border border-slate-100">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgWeightHeight}`}
              className="w-full h-auto select-none block"
            >
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[maxW, midW, minW].map((wVal) => {
                const y = getYWeight(wVal);
                if (y === null) return null;
                return (
                  <g key={`wgrid-${wVal}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={paddingLeft - 6}
                      y={y + 4.5}
                      textAnchor="end"
                      className="text-[14px] font-mono fill-slate-500 font-bold"
                    >
                      {wVal}
                    </text>
                  </g>
                );
              })}

              {/* Date columns & selection indicators */}
              {points.map((p, idx) => {
                const x = getX(idx);
                const isSelected = selectedDate === p.date;
                return (
                  <g key={`wcol-${p.date}`}>
                    {isSelected && (
                      <line
                        x1={x}
                        y1={paddingWeightTop}
                        x2={x}
                        y2={svgWeightHeight - paddingWeightBottom}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="2 2"
                        opacity="0.6"
                      />
                    )}
                    <rect
                      x={x - (chartWidth / points.length) / 2}
                      y={0}
                      width={chartWidth / points.length}
                      height={svgWeightHeight}
                      fill="transparent"
                      className="cursor-pointer hover:fill-emerald-50/20"
                      onClick={() => setSelectedDate(p.date)}
                    />
                  </g>
                );
              })}

              {/* Weight Area Fill & Stroke Line */}
              {weightAreaPath && <path d={weightAreaPath} fill="url(#weightGrad)" />}
              {weightPath && (
                <path
                  d={weightPath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Weight Points */}
              {points.map((p, idx) => {
                if (p.weight === null) return null;
                const x = getX(idx);
                const y = getYWeight(p.weight);
                if (y === null) return null;
                const isSelected = selectedDate === p.date;

                return (
                  <g key={`wpt-${p.date}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 5 : rangeDays <= 14 ? 3.5 : rangeDays === 30 ? 2.8 : 2}
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {!hasWeightData && (
                <text
                  x={svgWidth / 2}
                  y={svgWeightHeight / 2 + 4}
                  textAnchor="middle"
                  className="text-xs fill-slate-400 font-medium"
                >
                  Sem registros de peso neste período
                </text>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Summary Stats for Outpatient Doctor */}
      <div className="mt-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          Resumo do Período ({rangeDays} dias)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-1 whitespace-nowrap">
              <span className="shrink-0">☀️ Média da Manhã</span>
              <span className="text-[10px] text-slate-500 font-normal shrink-0">SYS / DIA</span>
            </div>
            <div className="text-2xl font-black font-mono mt-1 flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-red-600 shrink-0" title="Morning Systolic Mean">
                {morningStats.avgSystolic ?? '--'}
              </span>
              <span className="text-slate-300 font-normal text-lg shrink-0">/</span>
              <span className="text-blue-700 shrink-0" title="Morning Diastolic Mean">
                {morningStats.avgDiastolic ?? '--'}
              </span>
              <span className="text-[11px] text-slate-400 font-sans ml-1 shrink-0 font-normal">mmHg</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/70 flex items-center justify-between gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 shrink-0">Meta &lt; {targetSys}/{targetDia}</span>
              <span
                className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                  morningStats.avgSystolic && morningStats.avgSystolic < targetSys
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {morningStats.avgSystolic && morningStats.avgSystolic < targetSys
                  ? 'Na meta ◎'
                  : 'Acima ▲'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-1 whitespace-nowrap">
              <span className="shrink-0">🌙 Média da Noite</span>
              <span className="text-[10px] text-slate-500 font-normal shrink-0">SYS / DIA</span>
            </div>
            <div className="text-2xl font-black font-mono mt-1 flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-pink-500 shrink-0" title="Evening Systolic Mean">
                {eveningStats.avgSystolic ?? '--'}
              </span>
              <span className="text-slate-300 font-normal text-lg shrink-0">/</span>
              <span className="text-green-500 shrink-0" title="Evening Diastolic Mean">
                {eveningStats.avgDiastolic ?? '--'}
              </span>
              <span className="text-[11px] text-slate-400 font-sans ml-1 shrink-0 font-normal">mmHg</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/70 flex items-center justify-between gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 shrink-0">Meta &lt; {targetSys}/{targetDia}</span>
              <span
                className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                  eveningStats.avgSystolic && eveningStats.avgSystolic < targetSys
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {eveningStats.avgSystolic && eveningStats.avgSystolic < targetSys
                  ? 'Na meta ◎'
                  : 'Acima ▲'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between gap-1 whitespace-nowrap">
              <span className="shrink-0">Dias medidos</span>
              <span className="text-[10px] text-slate-500 font-normal shrink-0">Medido / Período</span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1 flex items-baseline gap-1 whitespace-nowrap">
              <span>{windowRecords.length}</span>
              <span className="text-slate-300 font-normal text-lg">/</span>
              <span>{rangeDays}</span>
              <span className="text-[11px] text-slate-400 font-sans ml-1 font-normal">dias</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/70 flex items-center justify-between gap-1.5 whitespace-nowrap">
              <span className="text-slate-500 shrink-0">Adesão</span>
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {Math.round((windowRecords.length / rangeDays) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

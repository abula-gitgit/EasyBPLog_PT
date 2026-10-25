/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyRecord, UserSettings, Measurement } from '../types';
import {
  shiftDateString,
  formatDateEN,
  calculatePeriodAverage,
  isSystolicExceeded,
  isDiastolicExceeded,
  getTodayDateString,
  createEmptyDailyRecord,
} from '../utils/bloodPressure';
import { NOTE_MIGRATION_MAP } from '../utils/storage';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const TAG_ICONS: Record<string, string> = {
  meds_taken: '💊',
  alcohol: '🍺',
  travel: '✈️',
  stress_sleep: '😰',
  unwell: '🤒',
  meds_changed: '🆕',
  // Backward compatibility with legacy tags
  'くすり飲んだ': '💊',
  '飲酒': '🍺',
  '旅行・外出': '✈️',
  '寝不足・ストレス': '😰',
  '体調不良': '🤒',
  'くすり開始・変更': '🆕',
};

const TAG_LABELS: Record<string, string> = {
  meds_taken: 'Remédio tomado',
  alcohol: 'Álcool',
  travel: 'Viagem / Passeio',
  stress_sleep: 'Estresse / Sono ruim',
  unwell: 'Mal-estar',
  meds_changed: 'Ajuste de dose',
  // Legacy labels
  'くすり飲んだ': 'Meds Taken',
  '飲酒': 'Alcohol',
  '旅行・外出': 'Travel / Out',
  '寝不足・ストレス': 'Poor Sleep',
  '体調不良': 'Unwell',
  'くすり開始・変更': 'Med Changed',
};

interface NotebookViewProps {
  records: DailyRecord[];
  settings: UserSettings;
  onSelectDateToEdit: (date: string) => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  records,
  settings,
  onSelectDateToEdit,
}) => {
  const getRecentStartDate = (days: number) =>
    shiftDateString(getTodayDateString(), -(days - 1));

  // Period view length: 7, 14, 30, 90, or 180 days
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30 | 90 | 180>(7);

  // Start date of the view window (recent period ending today)
  const [windowStartDate, setWindowStartDate] = useState<string>(() =>
    getRecentStartDate(7)
  );

  // Generate array of dates for periodDays
  const dateList: string[] = [];
  for (let i = 0; i < periodDays; i++) {
    dateList.push(shiftDateString(windowStartDate, i));
  }

  // Map of records by date
  const recordsByDate = new Map<string, DailyRecord>();
  records.forEach((r) => recordsByDate.set(r.date, r));

  const windowRecords: DailyRecord[] = dateList.map(
    (d) => recordsByDate.get(d) || createEmptyDailyRecord(d)
  );

  // Averages for the period (all 1st and 2nd measurements)
  const morningAvg = calculatePeriodAverage(windowRecords, 'morning');
  const eveningAvg = calculatePeriodAverage(windowRecords, 'evening');

  const targetSys = settings.targetSystolic;
  const targetDia = settings.targetDiastolic;
  const weightUnit = settings.weightUnit || 'kg';

  const shiftPeriod = (delta: -1 | 1) => {
    setWindowStartDate((prev) => shiftDateString(prev, delta * periodDays));
  };

  const handleSelectPeriod = (days: 7 | 14 | 30 | 90 | 180) => {
    setPeriodDays(days);
    setWindowStartDate(getRecentStartDate(days));
  };

  const jumpToRecent = () => {
    setWindowStartDate(getRecentStartDate(periodDays));
  };

  const startDateFormatted = formatDateEN(dateList[0]).formatted;
  const endDateFormatted = formatDateEN(dateList[dateList.length - 1]).formatted;

  // Single measurement rendered on 2 lines with high-legibility fonts
  const renderMeasurementBlock = (m: Measurement, roundLabel: string) => {
    const hasData = m.systolic !== null || m.diastolic !== null || m.pulse !== null;

    if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center py-0.5 text-[10px] text-slate-300 font-mono leading-none">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-400 bg-slate-100 rounded px-1 text-[9px]">{roundLabel}</span>
            <span>-- / --</span>
          </div>
        </div>
      );
    }

    const sysExceeded = isSystolicExceeded(m.systolic, targetSys);
    const diaExceeded = isDiastolicExceeded(m.diastolic, targetDia);
    const isExceeded = sysExceeded || diaExceeded;

    return (
      <div className="flex flex-col items-center justify-center py-0.5 leading-tight">
        {/* Line 1: Blood Pressure (Sys / Dia) */}
        <div className="inline-flex items-center gap-0.5 font-mono text-xs sm:text-sm font-black tabular-nums tracking-tight">
          <span className="text-[9px] font-bold text-slate-600 bg-slate-200/90 rounded px-1 shrink-0 font-sans">
            {roundLabel}
          </span>
          <span className={sysExceeded ? 'text-rose-600 underline font-black' : 'text-slate-900'}>
            {m.systolic ?? '--'}
          </span>
          <span className="text-slate-400 font-semibold text-[11px] sm:text-xs">/</span>
          <span className={diaExceeded ? 'text-rose-600 underline font-black' : 'text-slate-900'}>
            {m.diastolic ?? '--'}
          </span>
          {isExceeded && <span className="text-rose-600 text-xs sm:text-sm font-black leading-none ml-0.5">▲</span>}
        </div>

        {/* Line 2: Pulse (BPM) */}
        {m.pulse ? (
          <div className="text-[10px] sm:text-xs text-slate-600 font-bold font-mono leading-none mt-0.5">
            {m.pulse} bpm
          </div>
        ) : (
          <div className="text-[10px] text-slate-300 font-mono leading-none mt-0.5">-</div>
        )}
      </div>
    );
  };

  // Stacked 1st and 2nd measurements inside one slot cell (Morning or Evening)
  const renderSlotCell = (slotData: { first: Measurement; second: Measurement }, bgColor: string) => {
    return (
      <div className={`p-0.5 sm:p-1 flex flex-col justify-center rounded-lg ${bgColor} gap-0.5`}>
        {renderMeasurementBlock(slotData.first, '①')}
        {renderMeasurementBlock(slotData.second, '②')}
      </div>
    );
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto px-1 sm:px-4 pt-2 sm:pt-3">
      {/* Printable Header: visible in print mode, clean medical consultation document */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-3">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Diário Residencial de Pressão Arterial (MRPA)</h1>
            <p className="text-xs text-slate-700">Relatório Clínico para Consulta Médica (Diretrizes SBC / ESC)</p>
          </div>
          <div className="text-right text-xs">
            <div>
              Paciente: <span className="font-bold underline text-sm">{settings.patientName || '____________________'}</span>
            </div>
            <div>
              Clínica / Médico: <span className="font-semibold">{settings.hospitalName || 'Não informado'}</span>
            </div>
            <div className="text-slate-800">
              Meta Residencial: <span className="font-bold">&lt; {targetSys} / {targetDia} mmHg</span>
            </div>
          </div>
        </div>
        <div className="text-xs font-semibold mt-1">
          Período do relatório: {startDateFormatted} a {endDateFormatted} ({periodDays} dias)
        </div>
      </div>

      {/* Screen Controls Toolbar (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-2 sm:p-3 shadow-sm border border-slate-200 mb-2 sm:mb-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Period Range Buttons */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 sm:p-1 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectPeriod(7)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                periodDays === 7 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">1S</span>
              <span className="hidden sm:inline">1 Semana</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriod(14)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                periodDays === 14 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">2S</span>
              <span className="hidden sm:inline">2 Semanas</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriod(30)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                periodDays === 30 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">1M</span>
              <span className="hidden sm:inline">1 Mês</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriod(90)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                periodDays === 90 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">3M</span>
              <span className="hidden sm:inline">3 Meses</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriod(180)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                periodDays === 180 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
      <div className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-2 mb-2 sm:mb-3 flex items-center justify-between gap-1">
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

      {/* Legend & Target Indicator */}
      <div className="no-print flex flex-wrap items-center justify-between text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 mb-2">
        <div className="flex items-center gap-2">
          <span>
            Meta: <strong className="text-blue-900 font-bold">&lt; {targetSys} / {targetDia}</strong> mmHg
          </span>
          <span className="text-rose-600 font-bold flex items-center gap-0.5">
            <span>▲ Vermelho</span> = Acima da meta
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">Toque em uma linha para editar</div>
      </div>

      {/* Main Table: Large readable numbers */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-black print:rounded-none">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200 border-b-2 border-slate-300 print:border-black text-xs font-bold text-slate-700">
              {/* Date */}
              <th className="py-2 px-1 border-r border-slate-200 print:border-black w-[54px] sm:w-[68px] text-center">
                Data
              </th>
              {/* Morning BP */}
              <th className="py-1.5 px-0.5 border-r border-slate-200 print:border-black bg-amber-50/70 print:bg-slate-100 text-amber-950 w-[96px] sm:w-[114px]">
                ☀️ Manhã
                <div className="text-[9px] text-amber-800 font-normal">①/② (bpm)</div>
              </th>
              {/* Evening BP */}
              <th className="py-1.5 px-0.5 border-r border-slate-200 print:border-black bg-indigo-50/70 print:bg-slate-100 text-indigo-950 w-[96px] sm:w-[114px]">
                🌙 Noite
                <div className="text-[9px] text-indigo-800 font-normal">①/② (bpm)</div>
              </th>
              {/* Weight */}
              <th className="py-1.5 px-0.5 border-r border-slate-200 print:border-black w-[48px] sm:w-[56px]">
                Peso
                <div className="text-[9px] font-normal text-slate-500">{weightUnit}</div>
              </th>
              {/* Notes & Symptoms */}
              <th className="py-2 px-1.5 sm:px-2 text-left w-[80px] sm:w-auto">
                Sintomas e Notas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 print:divide-black">
            {/* Top Summary Row: Period Averages according to AHA Guidelines */}
            <tr className="bg-emerald-50 text-slate-800 font-bold border-b-2 border-emerald-300 print:bg-slate-100 print:text-black print:border-black text-xs sm:text-sm">
              <td className="py-2.5 px-0.5 border-r border-emerald-200 print:border-black font-extrabold text-emerald-900 print:text-black">
                Média
              </td>

              {/* Morning Average */}
              <td className="py-2 px-0.5 border-r border-emerald-200 print:border-black bg-emerald-100/40 print:bg-slate-200">
                <div className="font-mono text-xs sm:text-sm font-black tracking-tight tabular-nums">
                  {morningAvg.avgSystolic !== null ? (
                    <span className={morningAvg.avgSystolic >= targetSys ? 'text-rose-600 print:text-rose-700 underline font-black' : 'text-slate-900 print:text-black'}>
                      {morningAvg.avgSystolic}
                    </span>
                  ) : (
                    '--'
                  )}
                  <span className="text-slate-400 print:text-slate-600">/</span>
                  {morningAvg.avgDiastolic !== null ? (
                    <span className={morningAvg.avgDiastolic >= targetDia ? 'text-rose-600 print:text-rose-700 underline font-black' : 'text-slate-900 print:text-black'}>
                      {morningAvg.avgDiastolic}
                    </span>
                  ) : (
                    '--'
                  )}
                </div>
                {morningAvg.avgPulse && (
                  <div className="text-[10px] sm:text-xs text-emerald-800 print:text-slate-600 font-mono font-bold leading-none mt-0.5">
                    {morningAvg.avgPulse} bpm
                  </div>
                )}
              </td>

              {/* Evening Average */}
              <td className="py-2 px-0.5 border-r border-emerald-200 print:border-black bg-emerald-100/60 print:bg-slate-200">
                <div className="font-mono text-xs sm:text-sm font-black tracking-tight tabular-nums">
                  {eveningAvg.avgSystolic !== null ? (
                    <span className={eveningAvg.avgSystolic >= targetSys ? 'text-rose-600 print:text-rose-700 underline font-black' : 'text-slate-900 print:text-black'}>
                      {eveningAvg.avgSystolic}
                    </span>
                  ) : (
                    '--'
                  )}
                  <span className="text-slate-400 print:text-slate-600">/</span>
                  {eveningAvg.avgDiastolic !== null ? (
                    <span className={eveningAvg.avgDiastolic >= targetDia ? 'text-rose-600 print:text-rose-700 underline font-black' : 'text-slate-900 print:text-black'}>
                      {eveningAvg.avgDiastolic}
                    </span>
                  ) : (
                    '--'
                  )}
                </div>
                {eveningAvg.avgPulse && (
                  <div className="text-[10px] sm:text-xs text-emerald-800 print:text-slate-600 font-mono font-bold leading-none mt-0.5">
                    {eveningAvg.avgPulse} bpm
                  </div>
                )}
              </td>

              {/* Clinical Assessment Summary */}
              <td colSpan={2} className="py-2 px-2 text-left text-xs leading-tight bg-emerald-50/70">
                {morningAvg.avgSystolic && morningAvg.avgSystolic < targetSys && eveningAvg.avgSystolic && eveningAvg.avgSystolic < targetSys ? (
                  <span className="text-emerald-800 print:text-emerald-800 font-bold">◎ Controlada (Ideal)</span>
                ) : morningAvg.avgSystolic && morningAvg.avgSystolic >= targetSys && eveningAvg.avgSystolic && eveningAvg.avgSystolic < targetSys ? (
                  <span className="text-amber-800 print:text-amber-800 font-bold">▲ Elevação matinal da PA</span>
                ) : (
                  <span className="text-slate-600 print:text-slate-700">Avaliar com seu médico</span>
                )}
              </td>
            </tr>

            {windowRecords.map((record) => {
              const { dayOfWeek, monthDay, isWeekend } = formatDateEN(record.date);
              const isSun = dayOfWeek === 'Dom';
              const isSat = dayOfWeek === 'Sáb';

              return (
                <tr
                  key={record.date}
                  className="hover:bg-blue-50/40 transition-colors print:hover:bg-transparent"
                >
                  {/* Date Column */}
                  <td
                    onClick={() => onSelectDateToEdit(record.date)}
                    className="py-1.5 px-0.5 font-bold border-r border-slate-200 print:border-black cursor-pointer no-print:hover:bg-blue-50/80"
                    title="Toque para editar este dia"
                  >
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                        {monthDay}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs font-black ${
                          isSun ? 'text-rose-600' : isSat ? 'text-blue-600' : 'text-slate-600'
                        }`}
                      >
                        {dayOfWeek}
                      </span>
                    </div>
                  </td>

                  {/* Morning Measurements */}
                  <td className="py-1 px-0.5 border-r border-slate-200 print:border-black bg-amber-50/15">
                    {renderSlotCell(record.morning, 'bg-amber-50/50')}
                  </td>

                  {/* Evening Measurements */}
                  <td className="py-1 px-0.5 border-r border-slate-200 print:border-black bg-indigo-50/15">
                    {renderSlotCell(record.evening, 'bg-indigo-50/50')}
                  </td>

                  {/* Weight */}
                  <td className="py-1 px-0.5 border-r border-slate-200 print:border-black font-mono font-black tabular-nums text-xs sm:text-sm text-slate-800">
                    {record.weight ? `${record.weight.toFixed(1)}` : '--'}
                  </td>

                  {/* Symptoms & Notes */}
                  <td
                    onClick={() => onSelectDateToEdit(record.date)}
                    className="py-1 px-1.5 sm:px-2 text-left align-middle cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5 items-start justify-center">
                      {/* Lifestyle Tags */}
                      {record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          {record.tags.map((t) => (
                            <span
                              key={t}
                              title={TAG_LABELS[t] || t}
                              className="inline-flex items-center justify-center rounded px-1 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 print:border-black leading-none"
                            >
                              <span className="sm:hidden text-xs" role="img" aria-label={TAG_LABELS[t] || t}>
                                {TAG_ICONS[t] || '🏷️'}
                              </span>
                              <span className="hidden sm:inline text-xs font-bold">
                                {TAG_ICONS[t] ? `${TAG_ICONS[t]} ${TAG_LABELS[t] || t}` : t}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Note */}
                      {record.note && (
                        <div className="text-[10px] sm:text-xs text-slate-700 italic leading-tight break-words mt-0.5">
                          "{NOTE_MIGRATION_MAP[record.note] || record.note}"
                        </div>
                      )}

                      {record.tags.length === 0 && !record.note && (
                        <span className="text-[10px] text-slate-300 no-print">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Printable Doctor Stamp and Signature Box */}
      <div className="hidden print:block mt-6 pt-4 border-t border-black text-xs">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="font-bold mb-1">【Conduta e Anotações Médicas】</div>
            <div className="h-24 border border-black rounded p-2"></div>
          </div>
          <div>
            <div className="font-bold mb-1">【Assinatura e Carimbo Médico】</div>
            <div className="h-24 border border-black rounded flex flex-col justify-between p-3">
              <div className="text-slate-700">Data da consulta: ______ / ______ / 202___</div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Assinatura/CRM: ________________________</span>
                <div className="w-16 h-12 border border-dashed border-black flex items-center justify-center text-[9px] text-slate-500">
                  Carimbo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

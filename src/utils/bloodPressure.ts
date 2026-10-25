/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyRecord, Measurement, TimeSlot, AhaBpCategory } from '../types';

export function createEmptyDailyRecord(dateStr: string): DailyRecord {
  return {
    date: dateStr,
    morning: {
      first: { systolic: null, diastolic: null, pulse: null },
      second: { systolic: null, diastolic: null, pulse: null },
    },
    evening: {
      first: { systolic: null, diastolic: null, pulse: null },
      second: { systolic: null, diastolic: null, pulse: null },
    },
    weight: null,
    tags: [],
    note: '',
  };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateString(dateStr: string, daysDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysDelta);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

export function formatDateEN(dateStr: string, includeYear = false): {
  formatted: string;
  formattedFull: string;
  dayOfWeek: string;
  dayOfWeekFull: string;
  monthDay: string;
  isWeekend: boolean;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayOfWeekIndex = dt.getDay();
  const dayOfWeek = DAY_NAMES_SHORT[dayOfWeekIndex];
  const dayOfWeekFull = DAY_NAMES_FULL[dayOfWeekIndex];
  const monthShort = MONTH_NAMES_SHORT[m - 1];
  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

  const monthDay = `${d} ${monthShort}`;
  const formatted = includeYear
    ? `${dayOfWeek}, ${d} ${monthShort} ${y}`
    : `${dayOfWeek}, ${d} ${monthShort}`;
  const formattedFull = `${dayOfWeekFull}, ${d} de ${monthShort} de ${y}`;

  return { formatted, formattedFull, dayOfWeek, dayOfWeekFull, monthDay, isWeekend };
}

export const formatDateJP = formatDateEN;

export function getAutoTimeSlot(): TimeSlot {
  const currentHour = new Date().getHours();
  if (currentHour >= 4 && currentHour < 15) {
    return 'morning';
  }
  return 'evening';
}

export function getSlotAverage(first: Measurement, second: Measurement): Measurement {
  const sysValues = [first.systolic, second.systolic].filter((v): v is number => v !== null && v > 0);
  const diaValues = [first.diastolic, second.diastolic].filter((v): v is number => v !== null && v > 0);
  const pulseValues = [first.pulse, second.pulse].filter((v): v is number => v !== null && v > 0);

  return {
    systolic: sysValues.length > 0 ? Math.round(sysValues.reduce((a, b) => a + b, 0) / sysValues.length) : null,
    diastolic: diaValues.length > 0 ? Math.round(diaValues.reduce((a, b) => a + b, 0) / diaValues.length) : null,
    pulse: pulseValues.length > 0 ? Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length) : null,
  };
}

export function calculatePeriodAverage(
  records: DailyRecord[],
  slot: TimeSlot
): { avgSystolic: number | null; avgDiastolic: number | null; avgPulse: number | null; count: number } {
  const sysList: number[] = [];
  const diaList: number[] = [];
  const pulseList: number[] = [];

  records.forEach((rec) => {
    const slotData = rec[slot];
    [slotData.first, slotData.second].forEach((m) => {
      if (m.systolic !== null && m.systolic > 0) sysList.push(m.systolic);
      if (m.diastolic !== null && m.diastolic > 0) diaList.push(m.diastolic);
      if (m.pulse !== null && m.pulse > 0) pulseList.push(m.pulse);
    });
  });

  return {
    avgSystolic: sysList.length > 0 ? Math.round(sysList.reduce((a, b) => a + b, 0) / sysList.length) : null,
    avgDiastolic: diaList.length > 0 ? Math.round(diaList.reduce((a, b) => a + b, 0) / diaList.length) : null,
    avgPulse: pulseList.length > 0 ? Math.round(pulseList.reduce((a, b) => a + b, 0) / pulseList.length) : null,
    count: sysList.length,
  };
}

export function getAhaBpCategory(systolic: number | null, diastolic: number | null): AhaBpCategory | null {
  if (systolic === null || diastolic === null || systolic <= 0 || diastolic <= 0) {
    return null;
  }

  if (systolic > 180 || diastolic > 120) {
    return {
      category: 'crisis',
      label: 'Crise Hipertensiva',
      shortLabel: 'Crise',
      description: 'Procure atendimento médico imediatamente',
      badgeClass: 'bg-red-600 text-white border-red-700 animate-pulse',
      textColor: 'text-red-700',
    };
  }

  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'stage2',
      label: 'Hipertensão Estágio 2',
      shortLabel: 'Estágio 2',
      description: 'Sistólica ≥140 ou Diastólica ≥90',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      textColor: 'text-rose-600',
    };
  }

  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: 'stage1',
      label: 'Hipertensão Estágio 1',
      shortLabel: 'Estágio 1',
      description: 'Sistólica 130–139 ou Diastólica 80–89',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      textColor: 'text-orange-600',
    };
  }

  if (systolic >= 120 && diastolic < 80) {
    return {
      category: 'elevated',
      label: 'Pré-Hipertensão / Elevada',
      shortLabel: 'Elevada',
      description: 'Sistólica 120–129 e Diastólica <80',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      textColor: 'text-amber-600',
    };
  }

  return {
    category: 'normal',
    label: 'Pressão Ótima / Normal',
    shortLabel: 'Normal',
    description: 'Sistólica <120 e Diastólica <80',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textColor: 'text-emerald-600',
  };
}

export function isSystolicExceeded(val: number | null, targetSystolic: number): boolean {
  if (val === null || val <= 0) return false;
  return val >= targetSystolic;
}

export function isDiastolicExceeded(val: number | null, targetDiastolic: number): boolean {
  if (val === null || val <= 0) return false;
  return val >= targetDiastolic;
}

export function isMeasurementExceeded(m: Measurement, targetSys: number, targetDia: number): boolean {
  return isSystolicExceeded(m.systolic, targetSys) || isDiastolicExceeded(m.diastolic, targetDia);
}

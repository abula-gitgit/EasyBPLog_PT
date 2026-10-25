/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyRecord } from '../types';
import { shiftDateString, getTodayDateString } from './bloodPressure';

export function generateSampleRecords(): DailyRecord[] {
  const today = getTodayDateString();
  const records: DailyRecord[] = [];

  const patterns = [
    { dayOffset: -13, mSys1: 138, mDia1: 84, mPls1: 68, mSys2: 134, mDia2: 82, mPls2: 67, eSys1: 126, eDia1: 78, ePls1: 72, eSys2: 124, eDia2: 76, ePls2: 70, weight: 72.0, tags: ['meds_taken'], note: '' },
    { dayOffset: -12, mSys1: 132, mDia1: 80, mPls1: 65, mSys2: 130, mDia2: 79, mPls2: 66, eSys1: 128, eDia1: 78, ePls1: 74, eSys2: 126, eDia2: 76, ePls2: 72, weight: 71.9, tags: ['meds_taken'], note: '' },
    { dayOffset: -11, mSys1: 142, mDia1: 86, mPls1: 74, mSys2: 138, mDia2: 84, mPls2: 72, eSys1: 134, eDia1: 82, ePls1: 80, eSys2: 130, eDia2: 80, ePls2: 78, weight: 72.2, tags: ['stress_sleep', 'meds_taken'], note: 'Acordei às 3h com preocupação do trabalho' },
    { dayOffset: -10, mSys1: 145, mDia1: 88, mPls1: 76, mSys2: 140, mDia2: 85, mPls2: 74, eSys1: 136, eDia1: 84, ePls1: 76, eSys2: 132, eDia2: 82, ePls2: 75, weight: 72.4, tags: ['alcohol'], note: 'Duas taças de vinho no jantar' },
    { dayOffset: -9,  mSys1: 136, mDia1: 82, mPls1: 69, mSys2: 132, mDia2: 80, mPls2: 68, eSys1: 124, eDia1: 76, ePls1: 70, eSys2: 122, eDia2: 74, ePls2: 69, weight: 72.1, tags: ['meds_taken'], note: '' },
    { dayOffset: -8,  mSys1: 128, mDia1: 78, mPls1: 66, mSys2: 126, mDia2: 77, mPls2: 65, eSys1: 122, eDia1: 74, ePls1: 68, eSys2: 120, eDia2: 72, ePls2: 68, weight: 71.9, tags: ['meds_taken'], note: 'Ótima noite de sono' },
    { dayOffset: -7,  mSys1: 139, mDia1: 83, mPls1: 70, mSys2: 135, mDia2: 81, mPls2: 69, eSys1: 130, eDia1: 80, ePls1: 73, eSys2: 127, eDia2: 78, ePls2: 71, weight: 72.0, tags: ['travel'], note: 'Viagem de fim de semana com a família' },
    { dayOffset: -6,  mSys1: 144, mDia1: 86, mPls1: 72, mSys2: 140, mDia2: 84, mPls2: 71, eSys1: 135, eDia1: 82, ePls1: 75, eSys2: 132, eDia2: 80, ePls2: 74, weight: 72.3, tags: ['travel'], note: 'Almoço em restaurante (churrasco mais salgado)' },
    { dayOffset: -5,  mSys1: 148, mDia1: 90, mPls1: 78, mSys2: 144, mDia2: 88, mPls2: 75, eSys1: 138, eDia1: 86, ePls1: 77, eSys2: 135, eDia2: 84, ePls2: 76, weight: 72.2, tags: ['meds_changed', 'meds_taken'], note: 'Consulta com cardiologista: ajuste de medicação' },
    { dayOffset: -4,  mSys1: 135, mDia1: 82, mPls1: 67, mSys2: 131, mDia2: 80, mPls2: 66, eSys1: 124, eDia1: 76, ePls1: 70, eSys2: 121, eDia2: 74, ePls2: 69, weight: 71.8, tags: ['meds_taken'], note: '' },
    { dayOffset: -3,  mSys1: 127, mDia1: 78, mPls1: 65, mSys2: 124, mDia2: 76, mPls2: 64, eSys1: 120, eDia1: 74, ePls1: 68, eSys2: 118, eDia2: 72, ePls2: 67, weight: 71.7, tags: ['meds_taken'], note: 'Pressão estabilizando bem com o ajuste' },
    { dayOffset: -2,  mSys1: 124, mDia1: 76, mPls1: 66, mSys2: 122, mDia2: 75, mPls2: 65, eSys1: 119, eDia1: 73, ePls1: 69, eSys2: 118, eDia2: 72, ePls2: 68, weight: 71.6, tags: ['meds_taken'], note: '' },
    { dayOffset: -1,  mSys1: 123, mDia1: 75, mPls1: 64, mSys2: 121, mDia2: 74, mPls2: 64, eSys1: 118, eDia1: 72, ePls1: 67, eSys2: 116, eDia2: 70, ePls2: 67, weight: 71.5, tags: ['meds_taken'], note: 'Caminhada matinal de 30 minutos' },
    { dayOffset: 0,   mSys1: 122, mDia1: 74, mPls1: 65, mSys2: 120, mDia2: 73, mPls2: 64, eSys1: null, eDia1: null, ePls1: null, eSys2: null, eDia2: null, ePls2: null, weight: 71.4, tags: ['meds_taken'], note: 'Medição da manhã dentro da meta ideal' },
  ];

  for (const item of patterns) {
    const date = shiftDateString(today, item.dayOffset);
    records.push({
      date,
      morning: {
        first: { systolic: item.mSys1, diastolic: item.mDia1, pulse: item.mPls1 },
        second: { systolic: item.mSys2, diastolic: item.mDia2, pulse: item.mPls2 },
      },
      evening: {
        first: { systolic: item.eSys1, diastolic: item.eDia1, pulse: item.ePls1 },
        second: { systolic: item.eSys2, diastolic: item.eDia2, pulse: item.ePls2 },
      },
      weight: item.weight,
      tags: item.tags,
      note: item.note,
    });
  }

  return records;
}

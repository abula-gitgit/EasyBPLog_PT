/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  targetSystolic: 130,
  targetDiastolic: 80,
  hospitalName: '',
  patientName: '',
  weightUnit: 'kg',
};

export const AHA_TARGET_SYSTOLIC = 130;
export const AHA_TARGET_DIASTOLIC = 80;

export const LIFESTYLE_TAGS = [
  { id: 'meds_taken', label: '💊 Remédio tomado', category: 'medication' },
  { id: 'alcohol', label: '🍺 Álcool', category: 'lifestyle' },
  { id: 'travel', label: '✈️ Viagem / Passeio', category: 'lifestyle' },
  { id: 'stress_sleep', label: '😰 Estresse / Sono ruim', category: 'condition' },
  { id: 'unwell', label: '🤒 Mal-estar', category: 'condition' },
  { id: 'meds_changed', label: '🆕 Ajuste de dose', category: 'medication' },
] as const;

export const EMPTY_MEASUREMENT = {
  systolic: null,
  diastolic: null,
  pulse: null,
};

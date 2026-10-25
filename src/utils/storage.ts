/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyRecord, UserSettings } from '../types';
import { DEFAULT_SETTINGS } from './constants';

const RECORDS_STORAGE_KEY = 'easy_bplog_pt_records_v1';
const SETTINGS_STORAGE_KEY = 'easy_bplog_pt_settings_v1';
const SALT_CHECK_STORAGE_KEY = 'easy_bplog_pt_sodium_check_v1';

export const TAG_MIGRATION_MAP: Record<string, string> = {};
export const NOTE_MIGRATION_MAP: Record<string, string> = {};

export function loadStoredRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load records from localStorage', err);
    return [];
  }
}

export function saveStoredRecords(records: DailyRecord[]): void {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save records to localStorage', err);
  }
}

export function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      targetSystolic: parsed.targetSystolic ?? DEFAULT_SETTINGS.targetSystolic,
      targetDiastolic: parsed.targetDiastolic ?? DEFAULT_SETTINGS.targetDiastolic,
      hospitalName: parsed.hospitalName ?? '',
      patientName: parsed.patientName ?? '',
      weightUnit: parsed.weightUnit ?? 'kg',
    };
  } catch (err) {
    console.error('Failed to load settings from localStorage', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage', err);
  }
}

export function loadStoredSaltCheck(): Record<number, number> {
  try {
    const raw = localStorage.getItem(SALT_CHECK_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredSaltCheck(answers: Record<number, number>): void {
  try {
    localStorage.setItem(SALT_CHECK_STORAGE_KEY, JSON.stringify(answers));
  } catch (err) {
    console.error('Failed to save salt check', err);
  }
}

export function exportBackupJSON(records: DailyRecord[], settings: UserSettings): void {
  const data = {
    app: 'EasyBPLog PT',
    version: '2.0-SBC-ESC',
    exportDate: new Date().toISOString(),
    settings,
    records,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const patientSlug = settings.patientName?.trim()
    ? `${settings.patientName.trim().replace(/[/\\?%*:|"<>]/g, '')}_`
    : '';
  a.download = `EasyBPLog_PT_Backup_${patientSlug}${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRecordsCSV(records: DailyRecord[], settings: UserSettings): void {
  const headers = [
    'Data',
    'Manha_Sis_1',
    'Manha_Dia_1',
    'Manha_Pulso_1',
    'Manha_Sis_2',
    'Manha_Dia_2',
    'Manha_Pulso_2',
    'Noite_Sis_1',
    'Noite_Dia_1',
    'Noite_Pulso_1',
    'Noite_Sis_2',
    'Noite_Dia_2',
    'Noite_Pulso_2',
    `Peso_${settings.weightUnit || 'kg'}`,
    'Marcadores',
    'Observacoes',
  ];

  const rows = records.map((r) => {
    return [
      r.date,
      r.morning.first.systolic ?? '',
      r.morning.first.diastolic ?? '',
      r.morning.first.pulse ?? '',
      r.morning.second.systolic ?? '',
      r.morning.second.diastolic ?? '',
      r.morning.second.pulse ?? '',
      r.evening.first.systolic ?? '',
      r.evening.first.diastolic ?? '',
      r.evening.first.pulse ?? '',
      r.evening.second.systolic ?? '',
      r.evening.second.diastolic ?? '',
      r.evening.second.pulse ?? '',
      r.weight ?? '',
      `"${r.tags.join(';')}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const patientSlug = settings.patientName?.trim()
    ? `${settings.patientName.trim().replace(/[/\\?%*:|"<>]/g, '')}_`
    : '';
  a.download = `EasyBPLog_PT_Relatorio_${patientSlug}${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

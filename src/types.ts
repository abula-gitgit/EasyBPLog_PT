/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Measurement {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
}

export interface DailyRecord {
  date: string; // "YYYY-MM-DD"
  morning: {
    first: Measurement;
    second: Measurement;
  };
  evening: {
    first: Measurement;
    second: Measurement;
  };
  weight: number | null;
  tags: string[];
  note: string;
}

export interface UserSettings {
  targetSystolic: number;  // Default: 130 (AHA standard)
  targetDiastolic: number; // Default: 80  (AHA standard)
  hospitalName: string;    // Clinic / Provider Name
  patientName?: string;    // Patient Full Name
  weightUnit?: 'lbs' | 'kg'; // Default: 'lbs'
}

export type TimeSlot = 'morning' | 'evening';
export type RoundSlot = 'first' | 'second';
export type InputFieldType = 'systolic' | 'diastolic' | 'pulse' | 'weight';

export interface SaltQuestion {
  id: number;
  question: string;
  category: string;
  options: {
    label: string;
    points: number;
  }[];
}

export type AhaBpCategoryType = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';

export interface AhaBpCategory {
  category: AhaBpCategoryType;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  textColor: string;
}

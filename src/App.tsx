/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyRecord, UserSettings } from './types';
import {
  loadStoredRecords,
  saveStoredRecords,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredSaltCheck,
  saveStoredSaltCheck,
} from './utils/storage';
import { generateSampleRecords } from './utils/mockData';
import { getTodayDateString } from './utils/bloodPressure';
import { Header } from './components/Header';
import { BottomNav, AppTab } from './components/BottomNav';
import { RecordView } from './components/RecordView';
import { NotebookView } from './components/NotebookView';
import { GraphView } from './components/GraphView';
import { GuideAndSettingsView } from './components/GuideAndSettingsView';
import { BottomAdBanner } from './components/Ads/BottomAdBanner';
import { AdSettingsModal } from './components/Ads/AdSettingsModal';
import { isAdBannerEnabled } from './config/adConfig';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PWAInstallModal } from './components/PWAInstallModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('record');
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString);

  // PWA App Installation
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Ad Banner state
  const [isAdBannerActive, setIsAdBannerActive] = useState<boolean>(() => isAdBannerEnabled());
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState<boolean>(false);
  const [creatorTapCount, setCreatorTapCount] = useState<number>(0);

  // Creator debug query check (?admin=1 or ?creator=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || params.get('creator') === '1') {
        setIsAdSettingsOpen(true);
      }
    }
  }, []);

  // Secret 5-tap gesture on brand logo
  const handleLogoClick = () => {
    setCreatorTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdSettingsOpen(true);
        return 0;
      }
      return next;
    });
  };

  // Initialize records from storage (or seed sample data if first ever load)
  const [records, setRecords] = useState<DailyRecord[]>(() => {
    const existing = loadStoredRecords();
    if (existing && existing.length > 0) {
      const MIGRATION_KEY = 'raku_bp_pt_remove_default_tags_v1';
      if (typeof window !== 'undefined' && !localStorage.getItem(MIGRATION_KEY)) {
        localStorage.setItem(MIGRATION_KEY, 'done');
        const updated = existing.map((r) => {
          return {
            ...r,
            tags: r.tags.filter(
              (t) => t !== 'Meds Taken' && t !== 'Alcohol' && t !== 'Stress / Sleep Deprived'
            ),
          };
        });
        saveStoredRecords(updated);
        return updated;
      }
      return existing;
    }
    const samples = generateSampleRecords();
    saveStoredRecords(samples);
    return samples;
  });

  const [settings, setSettings] = useState<UserSettings>(loadStoredSettings);
  const [saltAnswers, setSaltAnswers] = useState<Record<number, number>>(loadStoredSaltCheck);

  // Save changes to localStorage
  const handleSaveRecord = (updatedRecord: DailyRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.date === updatedRecord.date);
      let next: DailyRecord[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedRecord;
      } else {
        next = [...prev, updatedRecord];
      }
      saveStoredRecords(next);
      return next;
    });
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleImportRecords = (newRecords: DailyRecord[]) => {
    setRecords(newRecords);
    saveStoredRecords(newRecords);
  };

  const handleUpdateSaltAnswers = (newAnswers: Record<number, number>) => {
    setSaltAnswers(newAnswers);
    saveStoredSaltCheck(newAnswers);
  };

  const handleSelectDateToEdit = (dateStr: string) => {
    setCurrentDate(dateStr);
    setCurrentTab('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: AppTab) => {
    if (tab === 'record') {
      setCurrentDate(getTodayDateString());
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header 
        settings={settings} 
        onLogoClick={handleLogoClick}
        onInstallClick={() => setIsInstallModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Main Screen Content */}
      <main className={`flex-1 transition-all ${isAdBannerActive ? 'pb-14' : ''}`}>
        {currentTab === 'record' && (
          <RecordView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            records={records}
            onSaveRecord={handleSaveRecord}
            settings={settings}
          />
        )}

        {currentTab === 'notebook' && (
          <NotebookView
            records={records}
            settings={settings}
            onSelectDateToEdit={handleSelectDateToEdit}
          />
        )}

        {currentTab === 'graph' && (
          <GraphView records={records} settings={settings} />
        )}

        {currentTab === 'guide' && (
          <GuideAndSettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            records={records}
            onImportRecords={handleImportRecords}
            saltAnswers={saltAnswers}
            onUpdateSaltAnswers={handleUpdateSaltAnswers}
          />
        )}
      </main>

      {/* Fixed Bottom Stack (Bottom Navigation Bar + Ad Banner) */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 flex flex-col">
        {/* Fixed Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />
        {/* Bottom Ad Banner (placed below menu): returns null with zero leftover space when isEnabled is false */}
        <BottomAdBanner isEnabled={isAdBannerActive} />
      </div>

      {/* PWA App Install Guide Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onNativeInstall={install}
      />

      {/* Creator Ad Settings Modal */}
      {isAdSettingsOpen && (
        <AdSettingsModal
          isEnabled={isAdBannerActive}
          onToggleEnabled={(val) => setIsAdBannerActive(val)}
          onClose={() => setIsAdSettingsOpen(false)}
        />
      )}
    </div>
  );
}

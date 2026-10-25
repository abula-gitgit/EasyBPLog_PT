/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PenSquare, BookOpen, LineChart, HelpCircle } from 'lucide-react';

export type AppTab = 'record' | 'notebook' | 'graph' | 'guide';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    {
      id: 'record' as AppTab,
      label: 'Registrar',
      icon: PenSquare,
    },
    {
      id: 'notebook' as AppTab,
      label: 'Diário',
      icon: BookOpen,
    },
    {
      id: 'graph' as AppTab,
      label: 'Gráficos',
      icon: LineChart,
    },
    {
      id: 'guide' as AppTab,
      label: 'Guia e Ajustes',
      icon: HelpCircle,
    },
  ];

  return (
    <nav
      aria-label="Navegação inferior"
      className="w-full bg-white/95 backdrop-blur-md border-t border-slate-300 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] shrink-0"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer active:scale-95 ${
                isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-100/90 text-blue-700' : ''
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-blue-700 font-extrabold' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

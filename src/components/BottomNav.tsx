import React from 'react';
import { Compass, Dumbbell, Mic, Sun, Waves } from 'lucide-react';
import type { MainTab } from '../types';

interface BottomNavProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

const NAV_ITEMS: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'hoje', label: 'Hoje', icon: Sun },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell },
  { id: 'checkin', label: 'Check-in', icon: Mic },
  { id: 'mar', label: 'Mar', icon: Waves },
  { id: 'jornada', label: 'Jornada', icon: Compass },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Navegação principal"
      className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E0D5] pb-safe"
    >
      <div className="max-w-3xl mx-auto grid grid-cols-5 h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1363DF] ${
                isActive ? 'text-[#1363DF]' : 'text-[#5B7689] hover:text-[#06283D]'
              }`}
            >
              <span
                className={`flex items-center justify-center w-10 h-7 rounded-xl transition-colors ${
                  isActive ? 'bg-[#1363DF]/12' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className={`text-[11px] leading-none whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import type {
  AppState,
  CheckInEntry,
  CoachEvaluation,
  MainTab,
  PreWorkoutState,
  SleepEntry,
  Stance,
  SurfSpot,
} from './types';
import { STORAGE_KEY, formatIsoDate, loadState } from './utils/logic';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PilatesDossierModal } from './components/PilatesDossierModal';
import { TodayTab } from './components/TodayTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { CheckInTab } from './components/CheckInTab';
import { SurfTab } from './components/SurfTab';
import { JourneyTab } from './components/JourneyTab';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<MainTab>('hoje');
  const [pilatesModalOpen, setPilatesModalOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const todayIso = formatIsoDate(new Date());

  // Persist every change automatically to localStorage ('metaexplicada_v31')
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [state]);

  // Reset scroll to top when switching primary tabs so each screen opens cleanly at its hero anchor
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  const handleStanceChange = useCallback((stance: Stance) => {
    setState((prev) => ({ ...prev, stance }));
  }, []);

  const handleLogoChange = useCallback((customLogoDataUrl: string) => {
    setState((prev) => ({ ...prev, customLogoDataUrl }));
  }, []);

  const handleUpdatePreWorkout = useCallback(
    (patch: Partial<PreWorkoutState>) => {
      setState((prev) => ({
        ...prev,
        preWorkout: {
          ...prev.preWorkout,
          ...patch,
          date: todayIso,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [todayIso]
  );

  const handleSaveSleep = useCallback((entry: SleepEntry) => {
    setState((prev) => ({
      ...prev,
      sleepLogs: [entry, ...prev.sleepLogs.filter((s) => s.id !== entry.id)],
    }));
  }, []);

  const handleAdjustWater = useCallback(
    (deltaMl: number) => {
      setState((prev) => {
        const cur = prev.dailyHabitsByDate[todayIso] || {
          waterMl: 0,
          breathingDone: false,
          consciousRest: false,
        };
        return {
          ...prev,
          dailyHabitsByDate: {
            ...prev.dailyHabitsByDate,
            [todayIso]: {
              ...cur,
              waterMl: Math.max(0, Math.min(6000, cur.waterMl + deltaMl)),
            },
          },
        };
      });
    },
    [todayIso]
  );

  const handleMarkBreathingDone = useCallback(() => {
    setState((prev) => {
      const cur = prev.dailyHabitsByDate[todayIso] || {
        waterMl: 0,
        breathingDone: false,
        consciousRest: false,
      };
      return {
        ...prev,
        dailyHabitsByDate: {
          ...prev.dailyHabitsByDate,
          [todayIso]: { ...cur, breathingDone: true },
        },
      };
    });
  }, [todayIso]);

  const handleToggleConsciousRest = useCallback(() => {
    setState((prev) => {
      const cur = prev.dailyHabitsByDate[todayIso] || {
        waterMl: 0,
        breathingDone: false,
        consciousRest: false,
      };
      return {
        ...prev,
        dailyHabitsByDate: {
          ...prev.dailyHabitsByDate,
          [todayIso]: { ...cur, consciousRest: !cur.consciousRest },
        },
      };
    });
  }, [todayIso]);

  const handleToggleSet = useCallback(
    (exerciseId: string, setIndex: number, totalSets: number) => {
      setState((prev) => {
        const daySets = prev.completedSetsByDate[todayIso] || {};
        const arr = daySets[exerciseId]
          ? [...daySets[exerciseId]]
          : Array<boolean>(totalSets).fill(false);
        arr[setIndex] = !arr[setIndex];
        return {
          ...prev,
          completedSetsByDate: {
            ...prev.completedSetsByDate,
            [todayIso]: {
              ...daySets,
              [exerciseId]: arr,
            },
          },
        };
      });
    },
    [todayIso]
  );

  const handleSaveCheckIn = useCallback((entry: CheckInEntry) => {
    setState((prev) => ({
      ...prev,
      checkIns: [entry, ...prev.checkIns],
    }));
  }, []);

  const handleAddSpot = useCallback((spot: SurfSpot) => {
    setState((prev) => ({
      ...prev,
      mySpots: [spot, ...prev.mySpots],
    }));
  }, []);

  const handleDeleteSpot = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      mySpots: prev.mySpots.filter((s) => s.id !== id),
    }));
  }, []);

  const handleSaveCoachEval = useCallback((evalItem: CoachEvaluation) => {
    setState((prev) => {
      const exists = prev.coachEvaluations.some((e) => e.monthKey === evalItem.monthKey);
      const next = exists
        ? prev.coachEvaluations.map((e) => (e.monthKey === evalItem.monthKey ? evalItem : e))
        : [evalItem, ...prev.coachEvaluations];
      return { ...prev, coachEvaluations: next };
    });
  }, []);

  const handleImportState = useCallback((nextState: AppState) => {
    setState(nextState);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#06283D] flex flex-col">
      <Header
        logoDataUrl={state.customLogoDataUrl}
        onLogoChange={handleLogoChange}
        stance={state.stance}
        onStanceChange={handleStanceChange}
        onOpenPilatesDossier={() => setPilatesModalOpen(true)}
      />

      {!isOnline && (
        <div
          role="status"
          className="no-print bg-[#D97706] text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Modo Offline — seus treinos, histórico e dossiê continuam salvos localmente.</span>
        </div>
      )}

      <main className="no-print flex-1 w-full max-w-6xl mx-auto px-4 pt-5 pb-28">
        {activeTab === 'hoje' && (
          <TodayTab
            state={state}
            todayIso={todayIso}
            onUpdatePreWorkout={handleUpdatePreWorkout}
            onSaveSleep={handleSaveSleep}
            onAdjustWater={handleAdjustWater}
            onMarkBreathingDone={handleMarkBreathingDone}
            onToggleConsciousRest={handleToggleConsciousRest}
            onGoToCheckIn={() => setActiveTab('checkin')}
          />
        )}

        {activeTab === 'treinos' && (
          <WorkoutsTab
            stance={state.stance}
            completedSets={state.completedSetsByDate[todayIso] || {}}
            onToggleSet={handleToggleSet}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckInTab
            todayIso={todayIso}
            preWorkout={state.preWorkout}
            onSaveCheckIn={handleSaveCheckIn}
          />
        )}

        {activeTab === 'mar' && (
          <SurfTab
            mySpots={state.mySpots}
            onAddSpot={handleAddSpot}
            onDeleteSpot={handleDeleteSpot}
          />
        )}

        {activeTab === 'jornada' && (
          <JourneyTab
            state={state}
            onSaveCoachEval={handleSaveCoachEval}
            onImportState={handleImportState}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <PilatesDossierModal
        isOpen={pilatesModalOpen}
        onClose={() => setPilatesModalOpen(false)}
        logoDataUrl={state.customLogoDataUrl}
        stance={state.stance}
      />
    </div>
  );
}

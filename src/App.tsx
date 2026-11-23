/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, WifiOff } from 'lucide-react';
import type {
  AppState,
  CheckInEntry,
  CoachEvaluation,
  MainTab,
  PreWorkoutState,
  SleepEntry,
  Stance,
  SurfSpot,
  UniversalVoiceParsed,
} from './types';
import {
  STORAGE_KEY,
  formatIsoDate,
  getProjectProgress,
  loadState,
} from './utils/logic';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PilatesDossierModal } from './components/PilatesDossierModal';
import { SleepDrawerModal } from './components/SleepDrawerModal';
import { QuickRestModal } from './components/QuickRestModal';
import { QuickWorkoutModal } from './components/QuickWorkoutModal';
import { UniversalVoiceModal } from './components/UniversalVoiceModal';
import { TodayTab } from './components/TodayTab';
import { WorkoutsTab } from './components/WorkoutsTab';
import { CheckInTab } from './components/CheckInTab';
import { SurfTab } from './components/SurfTab';
import { JourneyTab } from './components/JourneyTab';

function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<MainTab>('hoje');
  const [pilatesModalOpen, setPilatesModalOpen] = useState(false);

  // Independent Quick Action Modals
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);

  // Brief feedback toast after modal save
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const isOnline = useOnlineStatus();
  const todayIso = formatIsoDate(new Date());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  }, []);

  // Persist every change automatically to localStorage ('metaexplicada_v31')
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [state]);

  // Reset scroll to top when switching primary tabs
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

  // Sleep is 100% independent of workouts/check-ins
  const handleSaveSleep = useCallback(
    (entry: SleepEntry) => {
      setState((prev) => ({
        ...prev,
        sleepLogs: sortByDateDesc([
          entry,
          ...prev.sleepLogs.filter((s) => s.id !== entry.id),
        ]),
      }));
      showToast('Sono salvo no histórico independente!');
    },
    [showToast]
  );

  const handleAdjustWater = useCallback(
    (deltaMl: number, targetDate: string = todayIso) => {
      setState((prev) => {
        const cur = prev.dailyHabitsByDate[targetDate] || {
          waterMl: 0,
          breathingDone: false,
          consciousRest: false,
        };
        return {
          ...prev,
          dailyHabitsByDate: {
            ...prev.dailyHabitsByDate,
            [targetDate]: {
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
    showToast('Jogo Mental 60s concluído e salvo no dia!');
  }, [todayIso, showToast]);

  const handleConfirmConsciousRest = useCallback(
    (dateIso: string, note: string) => {
      const { currentDay } = getProjectProgress(dateIso);
      setState((prev) => {
        const curHabits = prev.dailyHabitsByDate[dateIso] || {
          waterMl: 0,
          breathingDone: false,
          consciousRest: false,
        };
        const restEntry: CheckInEntry = {
          id: `rest-${dateIso}-${Date.now()}`,
          date: dateIso,
          dayNumber: currentDay,
          modality: 'Descanso Consciente',
          durationMin: 0,
          calories: 0,
          lumbarBefore: prev.preWorkout.lumbarNow,
          lumbarAfter: prev.preWorkout.lumbarNow,
          rightLegRadiation: prev.preWorkout.rightLegRadiation,
          effort: 1,
          location: 'João Pessoa - PB',
          note,
          hasMediaForInsta: false,
          createdAt: new Date().toISOString(),
        };
        const filtered = prev.checkIns.filter(
          (c) => !(c.date === dateIso && c.modality === 'Descanso Consciente')
        );
        return {
          ...prev,
          dailyHabitsByDate: {
            ...prev.dailyHabitsByDate,
            [dateIso]: { ...curHabits, consciousRest: true },
          },
          checkIns: sortByDateDesc([restEntry, ...filtered]),
        };
      });
      showToast('Descanso Consciente salvo na correntinha!');
    },
    [showToast]
  );

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

  const handleSaveCheckIn = useCallback(
    (entry: CheckInEntry) => {
      setState((prev) => ({
        ...prev,
        checkIns: sortByDateDesc([entry, ...prev.checkIns]),
      }));
      showToast(`Treino (${entry.modality}) salvo na Jornada!`);
    },
    [showToast]
  );

  // Universal Voice Diary Confirmation — saves each detected entity independently
  const handleConfirmUniversalVoice = useCallback(
    (parsed: UniversalVoiceParsed) => {
      const targetDate = parsed.targetDate;
      const { currentDay } = getProjectProgress(targetDate);
      const savedLabels: string[] = [];

      setState((prev) => {
        let nextSleepLogs = prev.sleepLogs;
        let nextCheckIns = prev.checkIns;
        let nextHabitsByDate = prev.dailyHabitsByDate;
        let nextPreWorkout = prev.preWorkout;

        const curHabits = nextHabitsByDate[targetDate] || {
          waterMl: 0,
          breathingDone: false,
          consciousRest: false,
        };
        let updatedHabits = { ...curHabits };
        let habitsChanged = false;

        if (parsed.sleep && parsed.sleep.blocks.length > 0) {
          const isNightShift = parsed.sleep.blocks.some((b) => {
            const h = parseInt(b.bedTime.split(':')[0], 10);
            return h >= 12 && h <= 19;
          });
          const sleepEntry: SleepEntry = {
            id: `sleep-voice-${Date.now()}`,
            date: targetDate,
            blocks: parsed.sleep.blocks,
            totalMinutes: parsed.sleep.totalMinutes,
            fragmented: parsed.sleep.fragmented,
            isNightShift,
            feeling: parsed.sleep.feeling,
            note: parsed.sleep.note || parsed.rawText,
          };
          nextSleepLogs = sortByDateDesc([sleepEntry, ...nextSleepLogs]);
          savedLabels.push('Sono');
        }

        if (parsed.workout) {
          const w = parsed.workout;
          const workoutEntry: CheckInEntry = {
            id: `checkin-voice-${Date.now()}`,
            date: targetDate,
            dayNumber: currentDay,
            modality: w.modality,
            isWellhub: w.isWellhub,
            durationMin: w.durationMin,
            calories: w.calories,
            lumbarBefore: w.lumbarBefore,
            lumbarAfter: w.lumbarAfter,
            rightLegRadiation: w.rightLegRadiation,
            effort: w.effort,
            location: 'João Pessoa - PB',
            note: w.note || parsed.rawText,
            hasMediaForInsta: w.hasMediaForInsta,
            createdAt: new Date().toISOString(),
          };
          nextCheckIns = sortByDateDesc([workoutEntry, ...nextCheckIns]);
          savedLabels.push(`Treino (${w.modality})`);
        }

        if (parsed.consciousRest?.enabled) {
          updatedHabits.consciousRest = true;
          habitsChanged = true;
          const restEntry: CheckInEntry = {
            id: `rest-voice-${targetDate}-${Date.now()}`,
            date: targetDate,
            dayNumber: currentDay,
            modality: 'Descanso Consciente',
            durationMin: 0,
            calories: 0,
            lumbarBefore: prev.preWorkout.lumbarNow,
            lumbarAfter: prev.preWorkout.lumbarNow,
            rightLegRadiation: prev.preWorkout.rightLegRadiation,
            effort: 1,
            location: 'João Pessoa - PB',
            note: parsed.consciousRest.note || parsed.rawText,
            hasMediaForInsta: false,
            createdAt: new Date().toISOString(),
          };
          nextCheckIns = sortByDateDesc([
            restEntry,
            ...nextCheckIns.filter(
              (c) => !(c.date === targetDate && c.modality === 'Descanso Consciente')
            ),
          ]);
          savedLabels.push('Descanso Consciente');
        }

        if (parsed.waterMl && parsed.waterMl > 0) {
          updatedHabits.waterMl = Math.max(
            0,
            Math.min(6000, updatedHabits.waterMl + parsed.waterMl)
          );
          habitsChanged = true;
          savedLabels.push(`+${parsed.waterMl} ml água`);
        }

        if (parsed.lumbarUpdate) {
          nextPreWorkout = {
            ...nextPreWorkout,
            lumbarNow: parsed.lumbarUpdate.lumbarNow,
            rightLegRadiation: parsed.lumbarUpdate.rightLegRadiation,
            date: todayIso,
            updatedAt: new Date().toISOString(),
          };
          savedLabels.push(`Lombar ${parsed.lumbarUpdate.lumbarNow}/10`);
        }

        if (habitsChanged) {
          nextHabitsByDate = {
            ...nextHabitsByDate,
            [targetDate]: updatedHabits,
          };
        }

        return {
          ...prev,
          sleepLogs: nextSleepLogs,
          checkIns: nextCheckIns,
          dailyHabitsByDate: nextHabitsByDate,
          preWorkout: nextPreWorkout,
        };
      });

      if (savedLabels.length > 0) {
        showToast(`Salvo (${parsed.dateLabel}): ${savedLabels.join(' · ')}`);
      }
    },
    [todayIso, showToast]
  );

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

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] sm:max-w-md rounded-2xl bg-[#06283D] text-white px-4 py-3 shadow-lg border border-[#00A896]/50 flex items-center gap-2 text-xs sm:text-sm font-semibold"
        >
          <Check className="w-4 h-4 text-[#7FDAD0] shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="no-print flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-28">
        {activeTab === 'hoje' && (
          <TodayTab
            state={state}
            todayIso={todayIso}
            onUpdatePreWorkout={handleUpdatePreWorkout}
            onAdjustWater={(delta) => handleAdjustWater(delta, todayIso)}
            onMarkBreathingDone={handleMarkBreathingDone}
            onOpenVoiceModal={() => setVoiceModalOpen(true)}
            onOpenWorkoutModal={() => setWorkoutModalOpen(true)}
            onOpenSleepModal={() => setSleepModalOpen(true)}
            onOpenRestModal={() => setRestModalOpen(true)}
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
            onOpenVoiceModal={() => setVoiceModalOpen(true)}
            onOpenRestModal={() => setRestModalOpen(true)}
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

      <UniversalVoiceModal
        isOpen={voiceModalOpen}
        todayIso={todayIso}
        defaultLumbar={state.preWorkout.lumbarNow}
        onClose={() => setVoiceModalOpen(false)}
        onConfirmAll={handleConfirmUniversalVoice}
      />

      <SleepDrawerModal
        isOpen={sleepModalOpen}
        todayIso={todayIso}
        onClose={() => setSleepModalOpen(false)}
        onSaveSleep={handleSaveSleep}
      />

      <QuickRestModal
        isOpen={restModalOpen}
        todayIso={todayIso}
        onClose={() => setRestModalOpen(false)}
        onConfirmConsciousRest={handleConfirmConsciousRest}
      />

      <QuickWorkoutModal
        isOpen={workoutModalOpen}
        todayIso={todayIso}
        defaultLumbar={state.preWorkout.lumbarNow}
        onClose={() => setWorkoutModalOpen(false)}
        onSaveWorkout={handleSaveCheckIn}
      />
    </div>
  );
}

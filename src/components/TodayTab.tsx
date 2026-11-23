import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Droplets,
  Minus,
  Moon,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Square,
  Wind,
} from 'lucide-react';
import type {
  AppState,
  EnergyLevel,
  PreWorkoutState,
  SleepEntry,
  SleepFeeling,
} from '../types';
import {
  WATER_GOAL_ML,
  calculateReadiness,
  calculateSleepDurationMinutes,
  formatDurationHoursMin,
  formatPtDate,
  getLast28Days,
} from '../utils/logic';
import { playBeep, playDoubleChime } from '../utils/audio';

interface TodayTabProps {
  state: AppState;
  todayIso: string;
  onUpdatePreWorkout: (patch: Partial<PreWorkoutState>) => void;
  onSaveSleep: (entry: SleepEntry) => void;
  onAdjustWater: (deltaMl: number) => void;
  onMarkBreathingDone: () => void;
  onToggleConsciousRest: () => void;
  onGoToCheckIn: () => void;
}

const BREATH_PHASES = [
  { label: 'Inspire pelo nariz / barriga', seconds: 4, scale: 1.18, color: '#00A896' },
  { label: 'Segure suave', seconds: 4, scale: 1.18, color: '#1363DF' },
  { label: 'Solte todo o ar devagar', seconds: 6, scale: 0.84, color: '#06283D' },
  { label: 'Pausa vazia', seconds: 2, scale: 0.84, color: '#5B7689' },
];
const CYCLE_SECONDS = 16;

export const TodayTab: React.FC<TodayTabProps> = ({
  state,
  todayIso,
  onUpdatePreWorkout,
  onSaveSleep,
  onAdjustWater,
  onMarkBreathingDone,
  onToggleConsciousRest,
  onGoToCheckIn,
}) => {
  const latestSleep = state.sleepLogs[0];
  const todayHabits = state.dailyHabitsByDate[todayIso] || {
    waterMl: 0,
    breathingDone: false,
    consciousRest: false,
  };

  // Sleep form state prefilled from latest sleep
  const [bedTime, setBedTime] = useState(latestSleep?.bedTime || '22:30');
  const [wakeTime, setWakeTime] = useState(latestSleep?.wakeTime || '06:00');
  const [isNightShift, setIsNightShift] = useState(latestSleep?.isNightShift ?? false);
  const [napMinutes, setNapMinutes] = useState(latestSleep?.napMinutes ?? 0);
  const [feeling, setFeeling] = useState<SleepFeeling>(latestSleep?.feeling || 'Recuperando');
  const [sleepSavedFlash, setSleepSavedFlash] = useState(false);

  const computedSleepMin = useMemo(
    () => calculateSleepDurationMinutes(bedTime, wakeTime),
    [bedTime, wakeTime]
  );

  // Readiness Calculation combining latest sleep + current Pre-Workout state
  const readiness = useMemo(
    () =>
      calculateReadiness({
        sleepMinutes: latestSleep?.durationMinutes ?? computedSleepMin,
        napMinutes: latestSleep?.napMinutes ?? napMinutes,
        lumbarPain: state.preWorkout.lumbarNow,
        rightLegRadiation: state.preWorkout.rightLegRadiation,
        energy: state.preWorkout.energy,
      }),
    [latestSleep, computedSleepMin, napMinutes, state.preWorkout]
  );

  // 60s Breathing Timer (4-4-6-2)
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathElapsed, setBreathElapsed] = useState(0);
  const lastPhaseIndexRef = useRef(-1);

  useEffect(() => {
    if (!breathRunning) return;
    const timer = window.setInterval(() => {
      setBreathElapsed((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          setBreathRunning(false);
          playDoubleChime();
          onMarkBreathingDone();
          return 60;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathRunning, onMarkBreathingDone]);

  const currentBreathInfo = useMemo(() => {
    const pos = breathElapsed % CYCLE_SECONDS;
    let acc = 0;
    for (let i = 0; i < BREATH_PHASES.length; i++) {
      const p = BREATH_PHASES[i];
      if (pos < acc + p.seconds) {
        return { ...p, index: i, remainingInPhase: acc + p.seconds - pos };
      }
      acc += p.seconds;
    }
    return { ...BREATH_PHASES[0], index: 0, remainingInPhase: 4 };
  }, [breathElapsed]);

  useEffect(() => {
    if (breathRunning && currentBreathInfo.index !== lastPhaseIndexRef.current) {
      lastPhaseIndexRef.current = currentBreathInfo.index;
      playBeep(currentBreathInfo.index === 0 ? 520 : 420, 90, 0.08);
    }
  }, [breathRunning, currentBreathInfo.index]);

  const handleSaveSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: SleepEntry = {
      id: `sleep-${Date.now()}`,
      date: todayIso,
      bedTime,
      wakeTime,
      durationMinutes: computedSleepMin,
      isNightShift,
      shiftNote: isNightShift ? 'Escala de Madrugada / Turno' : undefined,
      napMinutes: Math.max(0, Number(napMinutes) || 0),
      feeling,
    };
    onSaveSleep(entry);
    setSleepSavedFlash(true);
    window.setTimeout(() => setSleepSavedFlash(false), 2200);
  };

  // 28-day consistency chain
  const last28Days = useMemo(() => getLast28Days(todayIso), [todayIso]);
  const checkInDatesSet = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of state.checkIns) {
      map.set(c.date, c.modality);
    }
    return map;
  }, [state.checkIns]);

  const streakCount = useMemo(() => {
    let count = 0;
    const reversed = [...last28Days].reverse();
    for (const d of reversed) {
      const hasCheckIn = checkInDatesSet.has(d);
      const hasRest = state.dailyHabitsByDate[d]?.consciousRest;
      const hasBreathing = state.dailyHabitsByDate[d]?.breathingDone;
      if (hasCheckIn || hasRest || hasBreathing) {
        count++;
      } else if (d !== todayIso) {
        break;
      }
    }
    return count;
  }, [last28Days, checkInDatesSet, state.dailyHabitsByDate, todayIso]);

  const waterPercent = Math.min(100, Math.round((todayHabits.waterMl / WATER_GOAL_ML) * 100));

  const lightStyles = {
    verde: {
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#00A896]/40',
      badgeText: 'text-[#007A6D]',
      scoreBg: 'bg-[#00A896]',
    },
    amarelo: {
      bg: 'bg-[#FFFBEB]',
      border: 'border-[#D97706]/40',
      badgeText: 'text-[#B45309]',
      scoreBg: 'bg-[#D97706]',
    },
    vermelho: {
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#E63946]/50',
      badgeText: 'text-[#C81E2B]',
      scoreBg: 'bg-[#E63946]',
    },
  }[readiness.light];

  return (
    <div className="space-y-5">
      {/* Top Row on Desktop: Meu Porquê + Status Médico AMIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E0D5] p-5">
          <p className="text-xs font-bold text-[#1363DF]">Meu Porquê</p>
          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-[#06283D] font-medium">
            30 anos remando e descendo reto → 9 meses de preparação biomecânica inteligente para surfar com cavadas, rasgadas e cutbacks estilosos nas Maldivas sem lesionar L4-S1.
          </p>
        </section>

        <section
          aria-label="Status Médico e Escudo L4-S1"
          className="lg:col-span-5 bg-white rounded-2xl border border-[#E63946]/35 p-5"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#E63946] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-bold text-[#E63946]">
                Status Médico · AMIL / Infiltração Ácido Hialurônico
              </p>
              <p className="text-xs text-[#284559] leading-relaxed">
                Risco cardiológico aprovado (sem indicação cirúrgica). Aguardando liberação AMIL. RM 03/02/2026: L5-S1 extrusão 13 mm + Modic 1; L4-L5 contato raiz D L5; retrolistese L5.
              </p>
              <p className="text-xs font-semibold text-[#06283D] bg-[#FFF5F5] rounded-xl px-3 py-2 border border-[#E63946]/20">
                Regra Pós-Infiltração: desliga o alarme da dor, mas não cicatriza o disco nem o Modic 1 instantaneamente — use a janela sem dor para fortalecer core e glúteos mantendo 100% do Escudo L4-S1.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Main Focal Anchor: Readiness + Pre-Workout Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Readiness & L4-S1 Traffic Light */}
        <section
          aria-label="Prontidão do Dia e Semáforo L4-S1"
          className={`lg:col-span-6 rounded-2xl border p-5 ${lightStyles.bg} ${lightStyles.border}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-xs font-bold ${lightStyles.badgeText}`}>{readiness.label}</p>
              <h2 className="mt-1 font-display font-bold text-lg sm:text-xl text-[#06283D]">
                {readiness.headline}
              </h2>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl ${lightStyles.scoreBg} text-white flex flex-col items-center justify-center shrink-0`}
            >
              <span className="font-mono font-bold text-2xl leading-none tabular-nums">
                {readiness.score}
              </span>
              <span className="text-[10px] font-medium opacity-90 mt-0.5">/ 100</span>
            </div>
          </div>

          <p className="mt-3 text-sm text-[#1E3A4C] leading-relaxed">{readiness.recommendation}</p>

          <div className="mt-4 pt-3 border-t border-[#06283D]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#335368]">
            <span>
              Último sono:{' '}
              <strong className="font-mono text-[#06283D]">
                {latestSleep
                  ? formatDurationHoursMin(latestSleep.durationMinutes + latestSleep.napMinutes)
                  : '--'}
              </strong>
              {' · '}
              Lombar: <strong className="font-mono text-[#06283D]">{state.preWorkout.lumbarNow}/10</strong>
            </span>
            <button
              type="button"
              onClick={onGoToCheckIn}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#06283D] text-white text-xs font-semibold hover:bg-[#0B3B59] transition-colors cursor-pointer whitespace-nowrap"
            >
              Fazer Check-in Agora
            </button>
          </div>
        </section>

        {/* Pre-Workout Check ("Como estou antes de começar?") */}
        <section
          aria-label="Pré-Treino"
          className="lg:col-span-6 bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-base text-[#06283D]">
              Pré-Treino — Como estou antes de começar?
            </h2>
            <span className="text-xs text-[#5B7689]">Sincroniza com Check-in</span>
          </div>

          {/* Lumbar Slider */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="pre-lumbar-slider" className="font-medium text-[#06283D]">
                Lombar Agora (0 = zero dor · 10 = aguda)
              </label>
              <span
                className={`font-mono font-bold tabular-nums text-base ${
                  state.preWorkout.lumbarNow >= 6
                    ? 'text-[#E63946]'
                    : state.preWorkout.lumbarNow >= 4
                      ? 'text-[#D97706]'
                      : 'text-[#00A896]'
                }`}
              >
                {state.preWorkout.lumbarNow}/10
              </span>
            </div>
            <input
              id="pre-lumbar-slider"
              type="range"
              min={0}
              max={10}
              step={1}
              value={state.preWorkout.lumbarNow}
              onChange={(e) => onUpdatePreWorkout({ lumbarNow: Number(e.target.value) })}
              className="mt-2 w-full accent-[#1363DF] h-2 cursor-pointer"
            />
          </div>

          {/* Energy Segmented Control */}
          <div>
            <span className="block text-xs font-semibold text-[#4A6578] mb-1.5">Energia</span>
            <div className="grid grid-cols-3 gap-2">
              {(['Alta', 'Moderada', 'Baixa'] as EnergyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onUpdatePreWorkout({ energy: level })}
                  aria-pressed={state.preWorkout.energy === level}
                  className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    state.preWorkout.energy === level
                      ? 'bg-[#06283D] text-white border-[#06283D]'
                      : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5] hover:bg-[#EFECE4]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Right Leg Radiation Red Flag */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={state.preWorkout.rightLegRadiation}
              onChange={(e) => onUpdatePreWorkout({ rightLegRadiation: e.target.checked })}
              className="mt-1 w-5 h-5 accent-[#E63946] shrink-0 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-[#7F1D24] font-medium leading-snug">
              Sinto irradiação, choque ou formigamento descendo pela <strong>perna direita</strong> (Raiz D L5)
            </span>
          </label>

          {/* Quick Pre-Workout Note */}
          <div>
            <label htmlFor="pre-quick-note" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Nota rápida pré-sessão
            </label>
            <input
              id="pre-quick-note"
              type="text"
              value={state.preWorkout.quickNote}
              onChange={(e) => onUpdatePreWorkout({ quickNote: e.target.value })}
              placeholder="Ex: acordei rígido, fiz 5 min de respiração..."
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm text-[#06283D] focus:outline-2 focus:outline-[#1363DF]"
            />
          </div>
        </section>
      </div>

      {/* 3 Quick Habit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Sono & Escalas */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                <span>Sono &amp; Escalas</span>
              </h3>
              <span className="font-mono text-xs font-bold text-[#1363DF] tabular-nums">
                {formatDurationHoursMin(computedSleepMin + (Number(napMinutes) || 0))}
              </span>
            </div>

            {latestSleep && (
              <p className="mt-2 text-xs text-[#4A6578]">
                Último registro ({latestSleep.nightLabel || formatPtDate(latestSleep.date)}):{' '}
                <strong className="text-[#06283D]">
                  {latestSleep.bedTime} → {latestSleep.wakeTime} ({formatDurationHoursMin(latestSleep.durationMinutes)})
                </strong>
                {latestSleep.shiftNote ? ` · ${latestSleep.shiftNote}` : ''} · {latestSleep.feeling}
              </p>
            )}

            <form onSubmit={handleSaveSleepSubmit} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="sleep-bed" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                    Dormiu
                  </label>
                  <input
                    id="sleep-bed"
                    type="time"
                    value={bedTime}
                    onChange={(e) => setBedTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
                  />
                </div>
                <div>
                  <label htmlFor="sleep-wake" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                    Acordou
                  </label>
                  <input
                    id="sleep-wake"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 items-end">
                <label className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNightShift}
                    onChange={(e) => setIsNightShift(e.target.checked)}
                    className="w-4 h-4 accent-[#1363DF]"
                  />
                  <span className="text-xs font-medium text-[#06283D]">Escala Madrugada</span>
                </label>
                <div>
                  <label htmlFor="sleep-nap" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                    Cochilo (min)
                  </label>
                  <input
                    id="sleep-nap"
                    type="number"
                    min={0}
                    max={240}
                    step={5}
                    value={napMinutes}
                    onChange={(e) => setNapMinutes(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[#4A6578] mb-1">Sensação ao acordar</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Zerado', 'Recuperando', 'Médio', 'Moído'] as SleepFeeling[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFeeling(f)}
                      aria-pressed={feeling === f}
                      className={`min-h-[38px] px-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer truncate ${
                        feeling === f
                          ? 'bg-[#1363DF] text-white border-[#1363DF]'
                          : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-[#06283D] hover:bg-[#0B3B59] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {sleepSavedFlash ? 'Sono salvo no histórico!' : 'Salvar Registro de Sono'}
              </button>
            </form>
          </div>
        </section>

        {/* Card 2: Hidratação dos Discos L4-S1 */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#00A896]" aria-hidden="true" />
                <span>Hidratação L4-S1</span>
              </h3>
              <span className="font-mono text-xs font-bold text-[#00A896] tabular-nums">
                {waterPercent}%
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#4A6578]">
              Discos intervertebrais desidratados (L4-L5) dependem de água constante ao longo do dia. Meta: 3.000 ml.
            </p>

            <div className="mt-5 text-center">
              <p className="font-mono font-bold text-3xl text-[#06283D] tabular-nums" data-testid="water-total">
                {todayHabits.waterMl.toLocaleString('pt-BR')} ml
              </p>
              <p className="text-xs text-[#5B7689] font-mono tabular-nums mt-0.5">
                de {WATER_GOAL_ML.toLocaleString('pt-BR')} ml hoje
              </p>
            </div>

            <div className="mt-4 h-3 rounded-full bg-[#F8F6F1] border border-[#E5E0D5] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1363DF] to-[#00A896] transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onAdjustWater(-250)}
              aria-label="Remover 250 ml de água"
              className="min-h-[48px] rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] font-mono font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
              <span>250 ml</span>
            </button>
            <button
              type="button"
              onClick={() => onAdjustWater(250)}
              aria-label="Adicionar 250 ml de água"
              className="min-h-[48px] rounded-xl bg-[#00A896] hover:bg-[#009282] text-white font-mono font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>250 ml</span>
            </button>
          </div>
        </section>

        {/* Card 3: Mental Game — Respiração Tática 4-4-6-2 (60s) */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                <span>Mental Game (4-4-6-2)</span>
              </h3>
              {todayHabits.breathingDone && (
                <span className="text-xs font-bold text-[#00A896] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Feito hoje
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[#4A6578]">
              60s de descompressão neural para baixar tônus paravertebral e manter calma no mar.
            </p>

            {/* Animated Breathing Circle */}
            <div className="mt-4 flex flex-col items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-white transition-transform duration-1000 ease-out"
                  style={{
                    backgroundColor: breathRunning ? currentBreathInfo.color : '#06283D',
                    transform: `scale(${breathRunning ? currentBreathInfo.scale : 1})`,
                  }}
                >
                  <span className="font-mono font-bold text-2xl tabular-nums leading-none">
                    {60 - breathElapsed}s
                  </span>
                  <span className="text-[10px] font-mono opacity-85 mt-1">
                    {breathRunning ? `${currentBreathInfo.remainingInPhase}s` : '4·4·6·2'}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-[#06283D] text-center min-h-[18px]">
                {breathRunning
                  ? currentBreathInfo.label
                  : breathElapsed >= 60
                    ? 'Ciclo de 60s concluído!'
                    : 'Inspire 4s · Segure 4s · Solte 6s · Pausa 2s'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (breathElapsed >= 60) setBreathElapsed(0);
                setBreathRunning((r) => !r);
              }}
              className="flex-1 min-h-[44px] rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {breathRunning ? (
                <>
                  <Square className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{breathElapsed > 0 && breathElapsed < 60 ? 'Retomar' : 'Iniciar 60s'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setBreathRunning(false);
                setBreathElapsed(0);
              }}
              aria-label="Reiniciar cronômetro de respiração"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-[#06283D] flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* 28-Day Consistency Chain + Conscious Rest */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#06283D]">
              Correntinha de Consistência (Últimos 28 Dias)
            </h3>
            <p className="text-xs text-[#4A6578] mt-0.5">
              Sequência ativa: <strong className="font-mono text-[#06283D]">{streakCount} {streakCount === 1 ? 'dia' : 'dias'}</strong> · Dia 01 (21/11) com respiração 60s e caminhada 8,8 km concluídos.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleConsciousRest}
            aria-pressed={todayHabits.consciousRest}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-colors cursor-pointer whitespace-nowrap ${
              todayHabits.consciousRest
                ? 'bg-[#00A896] text-white border-[#00A896]'
                : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5] hover:bg-[#EFECE4]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>
              {todayHabits.consciousRest
                ? 'Descanso Consciente Registrado'
                : 'Registrar Descanso Consciente'}
            </span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {last28Days.map((iso) => {
            const hasWorkout = checkInDatesSet.has(iso);
            const hasRest = state.dailyHabitsByDate[iso]?.consciousRest;
            const hasBreath = state.dailyHabitsByDate[iso]?.breathingDone;
            const isToday = iso === todayIso;
            const dayNum = iso.slice(-2);

            let cellStyle = 'bg-[#F8F6F1] text-[#7A90A0] border-[#E5E0D5]';
            let statusTitle = `${formatPtDate(iso)}: sem registro`;
            if (hasWorkout) {
              cellStyle = 'bg-[#1363DF] text-white border-[#1363DF]';
              statusTitle = `${formatPtDate(iso)}: ${checkInDatesSet.get(iso)}`;
            } else if (hasRest) {
              cellStyle = 'bg-[#00A896] text-white border-[#00A896]';
              statusTitle = `${formatPtDate(iso)}: Descanso Consciente`;
            } else if (hasBreath) {
              cellStyle = 'bg-[#00A896]/25 text-[#06283D] border-[#00A896]/40';
              statusTitle = `${formatPtDate(iso)}: Respiração concluída`;
            }

            return (
              <div
                key={iso}
                title={statusTitle}
                className={`h-9 rounded-lg border flex items-center justify-center font-mono text-[11px] font-semibold tabular-nums ${cellStyle} ${
                  isToday ? 'ring-2 ring-[#06283D] ring-offset-1' : ''
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5B7689]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#1363DF]" /> Treino registrado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#00A896]" /> Descanso Consciente (mantém sequência)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#F8F6F1] border border-[#E5E0D5]" /> Sem registro
          </span>
        </div>
      </section>

      {/* Clinical Red Flag Reminder Footer */}
      {state.preWorkout.rightLegRadiation && (
        <div className="rounded-2xl bg-[#E63946] text-white p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong>ALERTA VERMELHO ATIVO:</strong> Você sinalizou dor irradiada ou formigamento na perna direita (Raiz D L5). Pause qualquer treino com carga hoje, priorize descompressão e comunique seu médico.
          </div>
        </div>
      )}
    </div>
  );
};

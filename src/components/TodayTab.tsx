import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Droplets,
  Mic,
  Minus,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Wind,
} from 'lucide-react';
import type { AppState, PreWorkoutState } from '../types';
import {
  calculateReadiness,
  getDailyWaterGoalMl,
  getLatestWeightKg,
  getSleepEntryTotalMinutes,
} from '../utils/logic';
import { playBeep, playDoubleChime } from '../utils/audio';

interface TodayTabProps {
  state: AppState;
  todayIso: string;
  onUpdatePreWorkout: (patch: Partial<PreWorkoutState>) => void;
  onAdjustWater: (deltaMl: number) => void;
  onMarkBreathingDone: () => void;
  onOpenVoiceModal: () => void;
}

const BREATH_PHASES = [
  { label: 'Inspire pelo nariz / barriga', seconds: 4, scale: 1.16, color: '#00A896' },
  { label: 'Segure suave', seconds: 4, scale: 1.16, color: '#1363DF' },
  { label: 'Solte todo o ar devagar', seconds: 6, scale: 0.84, color: '#06283D' },
  { label: 'Pausa vazia', seconds: 2, scale: 0.84, color: '#5B7689' },
];
const CYCLE_SECONDS = 16;

export const TodayTab: React.FC<TodayTabProps> = ({
  state,
  todayIso,
  onUpdatePreWorkout,
  onAdjustWater,
  onMarkBreathingDone,
  onOpenVoiceModal,
}) => {
  // Compact accordions — CLOSED by default
  const [whyOpen, setWhyOpen] = useState(false);
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [lumbarEditOpen, setLumbarEditOpen] = useState(false);

  const latestRegisteredSleep =
    state.sleepLogs.find((s) => s.kind !== 'upcoming_shift') || state.sleepLogs[0];
  const latestSleepMinutes = getSleepEntryTotalMinutes(latestRegisteredSleep);

  const todayHabits = state.dailyHabitsByDate[todayIso] || {
    waterMl: 0,
    breathingDone: false,
    consciousRest: false,
  };

  // Water goal silently recalculated from latest weight (38 ml x kg)
  const latestWeightKg = useMemo(
    () => getLatestWeightKg(state.bodyMeasurements),
    [state.bodyMeasurements]
  );
  const waterGoalMl = useMemo(() => getDailyWaterGoalMl(latestWeightKg), [latestWeightKg]);
  const waterPercent = Math.min(100, Math.round((todayHabits.waterMl / waterGoalMl) * 100));

  // Discreet 1-line Lumbar / Readiness Traffic Light
  const readiness = useMemo(
    () =>
      calculateReadiness({
        sleepMinutes: latestSleepMinutes || 420,
        lumbarPain: state.preWorkout.lumbarNow,
        rightLegRadiation: state.preWorkout.rightLegRadiation,
        energy: state.preWorkout.energy,
        fragmentedSleep: latestRegisteredSleep?.fragmented,
        sleepFeeling: latestRegisteredSleep?.feeling,
      }),
    [latestRegisteredSleep, latestSleepMinutes, state.preWorkout]
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

  const trafficMeta = {
    verde: {
      dot: 'bg-[#00A896]',
      bg: 'bg-[#ECFDF5] border-[#00A896]/35',
      text: 'text-[#007A6D]',
      short: 'Verde · Liberado c/ Escudo',
    },
    amarelo: {
      dot: 'bg-[#D97706]',
      bg: 'bg-[#FFFBEB] border-[#D97706]/35',
      text: 'text-[#B45309]',
      short: 'Amarelo · Recuperação Ativa',
    },
    vermelho: {
      dot: 'bg-[#E63946]',
      bg: 'bg-[#FEF2F2] border-[#E63946]/45',
      text: 'text-[#C81E2B]',
      short: 'Vermelho · Proteger L4-S1',
    },
  }[readiness.light];

  return (
    <div className="space-y-4">
      {/* a) Two Compact Collapsible Bars (Closed by Default) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        <div className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden">
          <button
            type="button"
            onClick={() => setWhyOpen((o) => !o)}
            aria-expanded={whyOpen}
            className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-[#FAF8F4] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[#1363DF] shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-[#06283D] truncate">
                Meu Porquê · Projeto 273 Dias
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#5B7689] shrink-0 transition-transform ${
                whyOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          {whyOpen && (
            <div className="px-4 pb-3.5 pt-1 border-t border-[#F0ECE3] text-xs sm:text-sm leading-relaxed text-[#284559]">
              30 anos remando e descendo reto → 9 meses de preparação biomecânica inteligente para surfar com cavadas, rasgadas e cutbacks estilosos nas Maldivas sem lesionar L4-S1.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E63946]/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setMedicalOpen((o) => !o)}
            aria-expanded={medicalOpen}
            className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-[#FFF9F9] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-[#E63946] shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-[#E63946] truncate">
                Status Médico AMIL · Escudo L4-S1
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#E63946] shrink-0 transition-transform ${
                medicalOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          {medicalOpen && (
            <div className="px-4 pb-3.5 pt-2 border-t border-[#F8E2E4] space-y-2 text-xs text-[#284559] leading-relaxed">
              <p>
                Risco cardiológico aprovado (sem indicação cirúrgica). Aguardando liberação AMIL para infiltração com ácido hialurônico. RM 03/02/2026: L5-S1 extrusão 13 mm + Modic 1; L4-L5 contato raiz D L5; retrolistese L5.
              </p>
              <p className="font-semibold text-[#06283D] bg-[#FFF5F5] rounded-xl px-3 py-2 border border-[#E63946]/20">
                Regra Pós-Infiltração: desliga o alarme da dor, mas não cicatriza o disco nem o Modic 1 instantaneamente — use a janela sem dor para fortalecer core e glúteos mantendo 100% do Escudo L4-S1.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* b) Main Hero CTA: Falar meu dia (Diário por Voz) */}
      <section aria-label="Diário por Voz">
        <button
          type="button"
          onClick={onOpenVoiceModal}
          className="w-full min-h-[76px] px-5 py-4 rounded-2xl bg-[#06283D] hover:bg-[#0B3B59] active:scale-[0.99] text-white transition-all cursor-pointer flex items-center justify-between gap-3.5 shadow-sm text-left"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-12 h-12 rounded-2xl bg-[#00A896] text-white flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="block font-display font-bold text-base sm:text-lg leading-tight">
                Falar meu dia (Diário por Voz)
              </span>
              <span className="block text-xs text-white/80 mt-1 leading-snug">
                Sem limite de tempo — o app guia os tópicos e salva tudo no banco de dados
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold text-[#7FDAD0] shrink-0">
            Abrir Roteiro
          </span>
        </button>
      </section>

      {/* c) The Only 2 Daily 1-Tap Controls: Hidratação (Água) + Jogo Mental 60s */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hidratação (Água) */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#00A896]" aria-hidden="true" />
                <span>Hidratação (Água)</span>
              </h2>
              <span className="font-mono text-xs font-bold text-[#00A896] tabular-nums">
                {waterPercent}%
              </span>
            </div>
            <p className="mt-1 text-xs text-[#4A6578]">
              Discos L4-L5 precisam de água constante. Meta diária: {waterGoalMl.toLocaleString('pt-BR')} ml.
            </p>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <p
                className="font-mono font-bold text-3xl text-[#06283D] tabular-nums"
                data-testid="water-total"
              >
                {todayHabits.waterMl.toLocaleString('pt-BR')} ml
              </p>
              <span className="text-xs text-[#5B7689] font-mono tabular-nums">
                / {waterGoalMl.toLocaleString('pt-BR')} ml
              </span>
            </div>

            <div className="mt-3 h-2.5 rounded-full bg-[#F8F6F1] border border-[#E5E0D5] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1363DF] to-[#00A896] transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onAdjustWater(-250)}
              aria-label="Remover 250 ml de água"
              className="min-h-[46px] rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] font-mono font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
              <span>250 ml</span>
            </button>
            <button
              type="button"
              onClick={() => onAdjustWater(250)}
              aria-label="Adicionar 250 ml de água"
              className="min-h-[46px] rounded-xl bg-[#00A896] hover:bg-[#009282] text-white font-mono font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>250 ml</span>
            </button>
          </div>
        </section>

        {/* Jogo Mental 60s */}
        <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                <span>Jogo Mental 60s</span>
              </h2>
              {todayHabits.breathingDone && (
                <span className="text-xs font-bold text-[#00A896] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Concluído hoje
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <div
                  className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-white transition-transform duration-1000 ease-out"
                  style={{
                    backgroundColor: breathRunning ? currentBreathInfo.color : '#06283D',
                    transform: `scale(${breathRunning ? currentBreathInfo.scale : 1})`,
                  }}
                >
                  <span className="font-mono font-bold text-xl tabular-nums leading-none">
                    {60 - breathElapsed}s
                  </span>
                  <span className="text-[10px] font-mono opacity-85 mt-0.5">
                    {breathRunning ? `${currentBreathInfo.remainingInPhase}s` : '4·4·6·2'}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold text-[#06283D]">
                  {breathRunning
                    ? currentBreathInfo.label
                    : breathElapsed >= 60
                      ? 'Ciclo de 60s concluído e salvo!'
                      : 'Respiração Tática 4-4-6-2'}
                </p>
                <p className="text-[11px] text-[#4A6578] leading-snug">
                  Descompressão neural de 60s. Marca automaticamente no histórico do dia ao finalizar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (breathElapsed >= 60) setBreathElapsed(0);
                setBreathRunning((r) => !r);
              }}
              className="flex-1 min-h-[46px] rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="min-h-[46px] min-w-[46px] rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-[#06283D] flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* d) Discreet 1-Line Lumbar Traffic Light (Expandable on tap only if user wants to tweak) */}
      <section
        aria-label="Semáforo Discreto da Lombar"
        className={`rounded-2xl border overflow-hidden ${trafficMeta.bg}`}
      >
        <button
          type="button"
          onClick={() => setLumbarEditOpen((o) => !o)}
          aria-expanded={lumbarEditOpen}
          className="w-full min-h-[46px] px-4 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${trafficMeta.dot}`} />
            <span className={`text-xs font-bold truncate ${trafficMeta.text}`}>
              Semáforo L4-S1: {trafficMeta.short}
            </span>
          </span>
          <span className="flex items-center gap-2 shrink-0 text-xs font-mono font-bold text-[#06283D] tabular-nums">
            <span>Lombar {state.preWorkout.lumbarNow}/10</span>
            <ChevronDown
              className={`w-4 h-4 text-[#5B7689] transition-transform ${
                lumbarEditOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        {lumbarEditOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-[#06283D]/10 space-y-2.5 bg-white/70">
            <p className="text-xs text-[#1E3A4C] leading-relaxed">
              <strong>{readiness.headline}:</strong> {readiness.recommendation}
            </p>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="today-lumbar-slider" className="font-semibold text-[#06283D]">
                Ajustar dor lombar agora
              </label>
              <span className="font-mono font-bold text-[#06283D]">
                {state.preWorkout.lumbarNow}/10
              </span>
            </div>
            <input
              id="today-lumbar-slider"
              type="range"
              min={0}
              max={10}
              step={1}
              value={state.preWorkout.lumbarNow}
              onChange={(e) => onUpdatePreWorkout({ lumbarNow: Number(e.target.value) })}
              className="w-full accent-[#1363DF] h-2 cursor-pointer"
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-[#7F1D24] cursor-pointer">
              <input
                type="checkbox"
                checked={state.preWorkout.rightLegRadiation}
                onChange={(e) =>
                  onUpdatePreWorkout({ rightLegRadiation: e.target.checked })
                }
                className="w-4 h-4 accent-[#E63946] shrink-0 cursor-pointer"
              />
              <span>Irradiação / formigamento na perna direita (Raiz D L5)</span>
            </label>
          </div>
        )}
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

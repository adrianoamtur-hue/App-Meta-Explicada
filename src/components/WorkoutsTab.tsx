import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clapperboard,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Shield,
  SkipBack,
  SkipForward,
  Sunrise,
  Timer,
  Waves,
  X,
} from 'lucide-react';
import type { Stance, WorkoutSubTab } from '../types';
import {
  ACADEMIA_A_EXERCISES,
  ACADEMIA_B_EXERCISES,
  AREIA_EXERCISES,
  CANAL_OFF_PLAYLIST_URL,
  CHINESE_FLOW_STEPS,
  CHINESE_FLOW_VIDEOS,
  ELITE_LESSONS,
  HOTEL_EXERCISES,
  L4S1_MATRIX,
  MANEUVER_SCHOOL,
  SURFSKATE_DRILLS,
  type ChineseFlowStatus,
  type ExerciseItem,
} from '../data/workoutsData';
import { TOTAL_PROJECT_DAYS, getProjectProgress } from '../utils/logic';
import { playBeep, playDoubleChime } from '../utils/audio';

interface WorkoutsTabProps {
  stance: Stance;
  completedSets: Record<string, boolean[]>;
  onToggleSet: (exerciseId: string, setIndex: number, totalSets: number) => void;
}

const SUB_TABS: { id: WorkoutSubTab; label: string }[] = [
  { id: 'academia_a', label: 'Academia A' },
  { id: 'academia_b', label: 'Academia B' },
  { id: 'areia', label: 'Areia / Orla' },
  { id: 'fluxo_chines', label: 'Fluxo Chinês' },
  { id: 'hotel', label: 'Hotel / Elásticos' },
  { id: 'surfskate', label: 'Surfskate' },
  { id: 'manobras', label: 'Manobras' },
  { id: 'elite', label: 'Elite Segura' },
  { id: 'guia_l4s1', label: 'Guia L4-S1' },
];

function getFlowBadgeStyle(status: ChineseFlowStatus): {
  pill: string;
  cardBg: string;
  dot: string;
} {
  if (status === 'substituido') {
    return {
      pill: 'bg-[#FEF2F2] text-[#C81E2B] border-[#E63946]/40',
      cardBg: 'bg-[#FFF5F5] border-[#E63946]/35',
      dot: 'bg-[#E63946]',
    };
  }
  if (status === 'adaptado') {
    return {
      pill: 'bg-[#FFFBEB] text-[#B45309] border-[#D97706]/40',
      cardBg: 'bg-white border-[#E5E0D5]',
      dot: 'bg-[#D97706]',
    };
  }
  return {
    pill: 'bg-[#ECFDF5] text-[#007A6D] border-[#00A896]/40',
    cardBg: 'bg-white border-[#E5E0D5]',
    dot: 'bg-[#00A896]',
  };
}

export const WorkoutsTab: React.FC<WorkoutsTabProps> = ({
  stance,
  completedSets,
  onToggleSet,
}) => {
  const [subTab, setSubTab] = useState<WorkoutSubTab>('academia_a');
  const { currentDay } = getProjectProgress();

  // Floating Rest Timer (45s / 60s)
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);

  useEffect(() => {
    if (!restRunning) return;
    const id = window.setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          setRestRunning(false);
          playDoubleChime();
          return 0;
        }
        if (prev <= 4) playBeep(720, 80, 0.08);
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [restRunning]);

  const startRest = (seconds: number) => {
    setRestSeconds(seconds);
    setRestRunning(true);
    playBeep(560, 80, 0.08);
  };

  // Chinese Flow Automatic Guided Timer + 60s Recording Mode
  const [flowModeSec, setFlowModeSec] = useState<60 | 30>(60);
  const [flowStepIdx, setFlowStepIdx] = useState(0);
  const [flowRemaining, setFlowRemaining] = useState(60);
  const [flowRunning, setFlowRunning] = useState(false);
  const [recordingModeOpen, setRecordingModeOpen] = useState(false);

  useEffect(() => {
    if (!flowRunning) return;
    const id = window.setInterval(() => {
      setFlowRemaining((prev) => {
        if (prev <= 1) {
          if (flowStepIdx < CHINESE_FLOW_STEPS.length - 1) {
            playDoubleChime();
            setFlowStepIdx((i) => i + 1);
            return flowModeSec;
          } else {
            playDoubleChime();
            setFlowRunning(false);
            return 0;
          }
        }
        if (prev <= 4) playBeep(680, 70, 0.08);
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [flowRunning, flowStepIdx, flowModeSec]);

  const switchFlowMode = (sec: 60 | 30) => {
    setFlowModeSec(sec);
    setFlowRunning(false);
    setFlowStepIdx(0);
    setFlowRemaining(sec);
  };

  const openRecordingMode = () => {
    setFlowModeSec(60);
    setFlowRemaining(60);
    setFlowRunning(false);
    setRecordingModeOpen(true);
  };

  const handleSetClick = (exId: string, setIdx: number, totalSets: number) => {
    const arr = completedSets[exId] || Array(totalSets).fill(false);
    const becomingChecked = !arr[setIdx];
    onToggleSet(exId, setIdx, totalSets);
    if (becomingChecked) {
      startRest(60);
    }
  };

  const renderExerciseCard = (ex: ExerciseItem) => {
    const sets = completedSets[ex.id] || Array(ex.setsCount).fill(false);
    const doneCount = sets.filter(Boolean).length;

    return (
      <article
        key={ex.id}
        className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3.5"
      >
        <div className="space-y-2.5">
          <div>
            <h3 className="font-display font-bold text-base text-[#06283D]">{ex.name}</h3>
            <p className="text-xs font-mono text-[#1363DF] font-semibold mt-0.5">
              {ex.prescription} · {doneCount}/{ex.setsCount} séries
            </p>
          </div>

          {/* Individual Video Demonstration Buttons (100% coverage) */}
          <div className="flex flex-wrap gap-2">
            {ex.videos.map((v) => (
              <a
                key={v.url + v.label}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] px-3 rounded-xl bg-[#F0F7FF] hover:bg-[#E1EFFF] border border-[#1363DF]/25 text-xs font-bold text-[#06283D] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-[#1363DF] fill-current shrink-0" aria-hidden="true" />
                <span>{v.label}</span>
                <ExternalLink className="w-3 h-3 text-[#5B7689] shrink-0" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Clickable Set Checkboxes */}
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: ex.setsCount }).map((_, idx) => {
            const checked = Boolean(sets[idx]);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSetClick(ex.id, idx, ex.setsCount)}
                aria-pressed={checked}
                aria-label={`${ex.name} — Série ${idx + 1}`}
                className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  checked
                    ? 'bg-[#00A896] text-white border-[#00A896]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5] hover:bg-[#EFECE4]'
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 ${checked ? 'opacity-100' : 'opacity-30'}`}
                  aria-hidden="true"
                />
                <span>Série {idx + 1}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => startRest(45)}
            className="min-h-[44px] px-3 rounded-xl border border-[#E5E0D5] text-xs font-mono font-semibold text-[#4A6578] hover:text-[#06283D] hover:bg-[#F8F6F1] inline-flex items-center gap-1 cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>45s</span>
          </button>
          <button
            type="button"
            onClick={() => startRest(60)}
            className="min-h-[44px] px-3 rounded-xl border border-[#E5E0D5] text-xs font-mono font-semibold text-[#4A6578] hover:text-[#06283D] hover:bg-[#F8F6F1] inline-flex items-center gap-1 cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>60s</span>
          </button>
        </div>

        {/* Surf Purpose & L4-S1 Shield */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl bg-[#F4F8FC] border border-[#1363DF]/15 p-3">
            <p className="text-[11px] font-bold text-[#1363DF]">Para que serve no surf</p>
            <p className="mt-1 text-xs text-[#1E3A4C] leading-relaxed">{ex.surfPurpose}</p>
          </div>
          <div className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/25 p-3">
            <p className="text-[11px] font-bold text-[#007A6D]">Escudo L4-S1</p>
            <p className="mt-1 text-xs text-[#1E3A4C] leading-relaxed">{ex.l4s1Shield}</p>
          </div>
        </div>
      </article>
    );
  };

  const activeFlowStep = CHINESE_FLOW_STEPS[flowStepIdx];
  const activeFlowBadge = getFlowBadgeStyle(activeFlowStep.status);

  return (
    <div className="space-y-5">
      {/* Swipeable 9 Sub-Tabs Bar */}
      <div
        role="tablist"
        aria-label="Programas de Treino e Manobras"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={(e) => {
                setSubTab(t.id);
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center',
                  block: 'nearest',
                });
              }}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 border cursor-pointer ${
                active
                  ? 'bg-[#06283D] text-white border-[#06283D]'
                  : 'bg-white text-[#335368] border-[#E5E0D5] hover:text-[#06283D]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1) ACADEMIA A */}
      {subTab === 'academia_a' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#EFF6FF] border border-[#1363DF]/25 p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#1363DF] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-[#1E3A4C]">
              <p className="font-bold text-[#06283D]">
                Academia A — Pernas Unilaterais, Glúteos &amp; Anti-Rotação
              </p>
              <p className="mt-1">
                Todos os exercícios com vídeo demonstrativo seguro para L4-L5, extrusão L5-S1 (13 mm) e Modic Tipo 1.
              </p>
            </div>
          </div>
          <div className="space-y-4">{ACADEMIA_A_EXERCISES.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* 2) ACADEMIA B */}
      {subTab === 'academia_b' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-[#E5E0D5] p-4">
            <h2 className="font-display font-bold text-base text-[#06283D]">
              Academia B — Remada, Escápulas &amp; Potência Rotacional
            </h2>
            <p className="mt-1 text-xs text-[#4A6578]">
              Foco em resistência de remada para sessões longas nas Maldivas e rotação segura com pivot do pé de trás (zero torção lombar).
            </p>
          </div>
          <div className="space-y-4">{ACADEMIA_B_EXERCISES.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* 3) AREIA / ORLA */}
      {subTab === 'areia' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FFF5F5] border border-[#E63946]/35 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E63946] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-[#7F1D24]">
              <p className="font-bold">Alerta Orla / Escoliose à Direita (25 min)</p>
              <p className="mt-0.5">
                Evite caminhada longa na faixa inclinada perto da água. Utilize sempre o calçadão plano ou areia batida 100% nivelada.
              </p>
            </div>
          </div>
          <div className="space-y-4">{AREIA_EXERCISES.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* 4) FLUXO CHINÊS MATINAL BLINDADO */}
      {subTab === 'fluxo_chines' && (
        <div className="space-y-4">
          {/* Regra da Manhã em Jejum (L4-S1) */}
          <section className="rounded-2xl bg-[#FFFBEB] border border-[#D97706]/40 p-4 flex items-start gap-3">
            <Sunrise className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
              <p className="font-bold text-[#92400E]">Regra da Manhã em Jejum (L4-S1)</p>
              <p className="mt-0.5">
                Beber 300–500 ml de água ao acordar e aguardar 20–30 min em pé antes de iniciar (os discos acordam hidratados e com maior pressão). Se fizer antes, manter 70% da amplitude e ritmo suave.
              </p>
            </div>
          </section>

          {/* Guided Automatic Timer Banner + Modo Gravação 60s */}
          <section className="rounded-2xl bg-[#06283D] text-white p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#7FDAD0]">
                  CRONÔMETRO GUIADO · 16 EXERCÍCIOS ADAPTADOS L4-S1
                </p>
                <h2 className="font-display font-bold text-lg mt-0.5">
                  Fluxo Chinês Matinal Blindado
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-1 rounded-xl bg-white/10">
                  <button
                    type="button"
                    onClick={() => switchFlowMode(60)}
                    aria-pressed={flowModeSec === 60}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                      flowModeSec === 60 ? 'bg-[#00A896] text-white' : 'text-white/80'
                    }`}
                  >
                    60s (16 min)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchFlowMode(30)}
                    aria-pressed={flowModeSec === 30}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${
                      flowModeSec === 30 ? 'bg-[#00A896] text-white' : 'text-white/80'
                    }`}
                  >
                    30s (8 min)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openRecordingMode}
                  className="min-h-[42px] px-3.5 rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Clapperboard className="w-4 h-4" aria-hidden="true" />
                  <span>Modo Gravação 60s (@metaexplicada)</span>
                </button>
              </div>
            </div>

            {/* Active Step Spotlight */}
            <div className="rounded-xl bg-white/10 border border-white/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[#7FDAD0] font-bold tabular-nums">
                    {String(flowStepIdx + 1).padStart(2, '0')} / {CHINESE_FLOW_STEPS.length}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white">
                    {activeFlowStep.statusLabel}
                  </span>
                </div>
                <p className="font-display font-bold text-xl">{activeFlowStep.name}</p>
                <p className="text-xs text-[#7FDAD0] leading-snug">
                  No surf: {activeFlowStep.surfBridge}
                </p>
                <p className="text-xs text-white/85 leading-relaxed">
                  {activeFlowStep.instruction}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  data-testid="chinese-flow-timer"
                  className="font-mono font-bold text-4xl tabular-nums text-[#7FDAD0] w-20 text-center"
                >
                  {String(flowRemaining).padStart(2, '0')}s
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlowRunning((r) => !r)}
                    aria-label={flowRunning ? 'Pausar fluxo chinês' : 'Iniciar fluxo chinês'}
                    className="min-h-[48px] px-4 rounded-xl bg-[#00A896] hover:bg-[#009282] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {flowRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{flowRunning ? 'Pausar' : 'Iniciar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (flowStepIdx + 1) % CHINESE_FLOW_STEPS.length;
                      setFlowStepIdx(next);
                      setFlowRemaining(flowModeSec);
                      playBeep(660, 90, 0.08);
                    }}
                    aria-label="Próximo exercício do fluxo chinês"
                    className="min-h-[48px] min-w-[48px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowRunning(false);
                      setFlowStepIdx(0);
                      setFlowRemaining(flowModeSec);
                    }}
                    aria-label="Reiniciar fluxo chinês"
                    className="min-h-[48px] min-w-[48px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 16 Steps Grid: Status Badge + Surf Bridge + How-To + Safe Video Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CHINESE_FLOW_STEPS.map((step, idx) => {
              const isCurrent = idx === flowStepIdx;
              const badgeStyle = getFlowBadgeStyle(step.status);
              return (
                <article
                  key={step.id}
                  onClick={() => {
                    setFlowStepIdx(idx);
                    setFlowRemaining(flowModeSec);
                  }}
                  className={`rounded-2xl border p-4 space-y-2.5 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#EFF6FF] border-[#1363DF] ring-2 ring-[#1363DF]/25'
                      : `${badgeStyle.cardBg} hover:border-[#1363DF]/40`
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm text-[#06283D]">
                      #{String(step.index).padStart(2, '0')} · {step.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${badgeStyle.pill}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                      <span>{step.statusLabel}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#1E3A4C] leading-relaxed">
                    <strong className="text-[#1363DF]">Para que serve no corpo e no surf:</strong>{' '}
                    {step.surfBridge}
                  </p>

                  <p className="text-xs text-[#284559] leading-relaxed">
                    <strong className="text-[#007A6D]">Como fazer / adaptar:</strong>{' '}
                    {step.instruction}
                  </p>

                  {step.videoUrl && (
                    <div className="pt-1">
                      <a
                        href={step.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[38px] px-3 rounded-xl bg-[#F0F7FF] hover:bg-[#E1EFFF] border border-[#1363DF]/25 text-xs font-bold text-[#06283D] inline-flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 text-[#1363DF] fill-current" aria-hidden="true" />
                        <span>{step.videoLabel || 'Ver Vídeo Seguro'}</span>
                        <ExternalLink className="w-3 h-3 text-[#5B7689]" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Reference YouTube Videos */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5">
            <h3 className="font-display font-bold text-sm text-[#06283D]">
              Vídeos de Referência — Fluxo Chinês &amp; Qi Gong
            </h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHINESE_FLOW_VIDEOS.map((v) => (
                <a
                  key={v.url}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[52px] p-3 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#06283D] truncate">{v.label}</p>
                    {v.note && <p className="text-[11px] text-[#5B7689] truncate">{v.note}</p>}
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#1363DF] shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 5) HOTEL / ELÁSTICOS */}
      {subTab === 'hotel' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-[#E5E0D5] p-4">
            <h2 className="font-display font-bold text-base text-[#06283D]">
              Hotel — Elásticos (25 min · Superband + Mini-band)
            </h2>
            <p className="mt-1 text-xs text-[#4A6578]">
              Protocolo portátil para viagens e escalas fora de casa: zero equipamento pesado, 100% blindado para L4-S1 e com vídeo em todos os exercícios.
            </p>
          </div>
          <div className="space-y-4">{HOTEL_EXERCISES.map(renderExerciseCard)}</div>
        </div>
      )}

      {/* 6) SURFSKATE → MAR + O ELO PERDIDO */}
      {subTab === 'surfskate' && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-[#06283D] text-white p-5 space-y-2.5">
            <p className="text-xs font-bold text-[#7FDAD0]">
              O ELO PERDIDO — PÉ NO DECK ({stance.toUpperCase()})
            </p>
            <h2 className="font-display font-bold text-lg">
              Treino com Fita Crepe no Chão (Memória Motora)
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              Marque o contorno da prancha e o deck com fita crepe no chão da sala. Treine 5 minutos por dia a transição automática: <strong>passo curto à frente</strong> para acelerar (pumping) e <strong>pé de trás cravado em cima das quilhas (kick do deck)</strong> antes de iniciar qualquer cavada, rasgada ou cutback.
            </p>
            <p className="text-xs text-[#7FDAD0]">
              Dica para base {stance}:{' '}
              {stance === 'Regular'
                ? 'Pé esquerdo comanda o trilho da frente e o direito crava firme nas quilhas na hora da curva.'
                : 'Pé direito comanda o trilho da frente e o esquerdo crava firme nas quilhas na hora da curva.'}
            </p>
          </section>

          <div className="rounded-2xl bg-[#FFF5F5] border border-[#E63946]/35 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E63946] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-[#7F1D24]">
              <p className="font-bold">Vícios Proibidos no Surfskate</p>
              <p className="mt-0.5">
                Zero derrapagem de rabeta (power slide — gera cisalhamento seco em L5-S1 e vicia mal no mar) e zero &ldquo;boneco de posto&rdquo; (girar só os braços sem inclinar a borda).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {SURFSKATE_DRILLS.map((drill) => {
              const sets = completedSets[drill.id] || Array(drill.setsCount).fill(false);
              return (
                <article
                  key={drill.id}
                  className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3.5"
                >
                  <div>
                    <h3 className="font-display font-bold text-base text-[#06283D]">
                      {drill.name}
                    </h3>
                    <p className="text-xs font-mono text-[#1363DF] font-semibold mt-0.5">
                      {drill.prescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: drill.setsCount }).map((_, idx) => {
                      const checked = Boolean(sets[idx]);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSetClick(drill.id, idx, drill.setsCount)}
                          aria-pressed={checked}
                          className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            checked
                              ? 'bg-[#00A896] text-white border-[#00A896]'
                              : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                          }`}
                        >
                          <Check
                            className={`w-3.5 h-3.5 ${checked ? 'opacity-100' : 'opacity-30'}`}
                          />
                          <span>Bloco {idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-[#F4F8FC] border border-[#1363DF]/15 p-3">
                      <p className="text-[11px] font-bold text-[#1363DF]">Para que serve no surf</p>
                      <p className="mt-1 text-xs text-[#1E3A4C]">{drill.surfPurpose}</p>
                    </div>
                    <div className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/25 p-3">
                      <p className="text-[11px] font-bold text-[#007A6D]">Escudo L4-S1</p>
                      <p className="mt-1 text-xs text-[#1E3A4C]">{drill.l4s1Shield}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {drill.videos.map((v) => (
                      <a
                        key={v.url}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[40px] px-3 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-xs font-semibold text-[#06283D] inline-flex items-center gap-1.5"
                      >
                        <span>{v.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#1363DF]" />
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 7) ESCOLA DE MANOBRAS */}
      {subTab === 'manobras' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-2.5">
              <h2 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                <span>Mapa de Decisão na Onda</span>
              </h2>
              <ul className="space-y-1.5 text-xs text-[#1E3A4C] leading-relaxed">
                <li>
                  <strong>Parede longa e limpa:</strong> Cavada profunda (Bottom Turn) → Rasgada longa na borda.
                </li>
                <li>
                  <strong>Onda ficando cheia / perdendo força:</strong> Cutback redondo olhando para a espuma.
                </li>
                <li>
                  <strong>Lip em pé / seção crítica:</strong> Batida / Snap entrando leve no topo.
                </li>
                <li>
                  <strong>Seção fechando na frente:</strong> Acelerada (Pumping) ou Floater suave descendo junto com a espuma.
                </li>
              </ul>
              <p className="text-xs font-semibold text-[#007A6D] bg-[#F2FBF9] rounded-xl p-2.5 border border-[#00A896]/20">
                Regra de Estilo: mãos calmas na linha da cintura e paciência para completar a curva na borda. (Aéreo, Layback e 360 excluídos por segurança do Modic 1 / L5-S1).
              </p>
            </section>

            <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-2.5">
              <h2 className="font-display font-bold text-base text-[#06283D]">
                Ritual 5 min Pré-Mar &amp; 5 min Pós-Mar (Obrigatório)
              </h2>
              <div className="space-y-2 text-xs text-[#1E3A4C] leading-relaxed">
                <p>
                  <strong>Pré-Mar (5 min na areia):</strong> 10 mobilidades de tornozelo/lado + 8 rotações torácicas em pé (Arco e Flecha) + 10 agachamentos Gorila + 3 pop-ups lentos sem salto.
                </p>
                <p>
                  <strong>Pós-Mar (5 min — Descompressão L5-S1 / Retrolistese):</strong> após horas remando em extensão leve, deite 2 min com pernas apoiadas (ou posição de criança suave com coluna longa), faça 60s de Respiração 4-4-6-2 e beba 500 ml de água.
                </p>
              </div>
              <a
                href={CANAL_OFF_PLAYLIST_URL}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 rounded-xl bg-[#06283D] hover:bg-[#0B3B59] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <span>Playlist Oficial: Guia de Manobras Canal OFF</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MANEUVER_SCHOOL.map((m) => (
              <article
                key={m.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#1363DF]">MANOBRA {m.number}</p>
                    <h3 className="font-display font-bold text-lg text-[#06283D]">{m.title}</h3>
                    <p className="text-xs text-[#4A6578] mt-0.5">{m.subtitle}</p>
                  </div>

                  <div className="space-y-2 text-xs text-[#1E3A4C] leading-relaxed">
                    <p>
                      <strong className="text-[#06283D]">O que prestar atenção no vídeo:</strong>{' '}
                      {m.watchFor}
                    </p>
                    <p>
                      <strong className="text-[#06283D]">Como simular no solo/surfskate:</strong>{' '}
                      {m.drylandDrill}
                    </p>
                    <p className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/25 p-2.5 text-[#06283D]">
                      <strong className="text-[#007A6D]">Escudo L4-S1:</strong> {m.l4s1Shield}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E0D5]">
                  <a
                    href={m.mainVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[42px] px-3.5 rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>{m.mainVideoLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {m.extraVideos.map((ev) => (
                    <a
                      key={ev.url}
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[42px] px-3 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>{ev.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#1363DF]" />
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 8) ELITE SEGURA */}
      {subTab === 'elite' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FFFBEB] border border-[#D97706]/35 p-4 text-xs sm:text-sm text-[#78350F]">
            <p className="font-bold">Curadoria Clínica — Elite Segura (Baixo Impacto)</p>
            <p className="mt-1">
              Não copie pliometria, saltos ou abdominais explosivos de treinos competitivos. Estas 3 aulas foram filtradas para entregar mobilidade, estabilidade e base de pés/quadris com as adaptações L4-S1 integradas.
            </p>
          </div>

          <div className="space-y-4">
            {ELITE_LESSONS.map((lesson) => (
              <article
                key={lesson.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#06283D]">
                      {lesson.title}
                    </h3>
                    <p className="text-xs font-mono text-[#1363DF] font-semibold mt-0.5">
                      {lesson.duration} · {lesson.coach}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lesson.videos.map((v) => (
                      <a
                        key={v.url}
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[42px] px-3.5 rounded-xl bg-[#06283D] hover:bg-[#0B3B59] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>{v.label}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#284559] leading-relaxed">{lesson.focus}</p>
                <div className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/30 p-3.5 space-y-1.5">
                  <p className="text-xs font-bold text-[#007A6D]">
                    Adaptações Escudo L4-S1 Obrigatórias
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#1E3A4C] list-disc list-inside leading-relaxed">
                    {lesson.adaptations.map((ad, i) => (
                      <li key={i}>{ad}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 9) GUIA FIXO L4-S1 */}
      {subTab === 'guia_l4s1' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="rounded-2xl bg-[#FFF5F5] border border-[#E63946]/40 p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#C81E2B]">
              PROIBIDOS DE FORMA ALGUMA
            </h2>
            <ul className="space-y-2 text-xs text-[#7F1D24] leading-relaxed list-disc list-inside">
              {L4S1_MATRIX.proibidos.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-[#FFFBEB] border border-[#D97706]/40 p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#B45309]">
              COM CAUTELA (ADAPTADOS)
            </h2>
            <ul className="space-y-2 text-xs text-[#78350F] leading-relaxed list-disc list-inside">
              {L4S1_MATRIX.cautela.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-[#ECFDF5] border border-[#00A896]/40 p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#007A6D]">
              PADRÃO-OURO LIBERADOS
            </h2>
            <ul className="space-y-2 text-xs text-[#064E3B] leading-relaxed list-disc list-inside">
              {L4S1_MATRIX.ouro.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Fullscreen High-Contrast 60s Recording Mode for Reels (@metaexplicada) */}
      {recordingModeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modo Gravação 60s Fluxo Chinês"
          className="no-print fixed inset-0 z-50 bg-[#041C2C] text-white flex flex-col justify-between p-5 sm:p-8 overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] sm:text-sm font-bold text-[#7FDAD0] tracking-wide">
                @metaexplicada · FLUXO CHINÊS <span className="whitespace-nowrap">L4-S1</span>
              </p>
              <p className="font-mono font-extrabold text-2xl sm:text-3xl tracking-tight mt-0.5 tabular-nums">
                DIA {String(currentDay).padStart(2, '0')} / {TOTAL_PROJECT_DAYS}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFlowRunning(false);
                setRecordingModeOpen(false);
              }}
              aria-label="Sair do Modo Gravação"
              className="min-h-[48px] px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Center Giant High-Contrast Display */}
          <div className="my-auto py-6 text-center max-w-2xl mx-auto space-y-5">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="font-mono font-extrabold text-xl sm:text-2xl text-[#7FDAD0] tabular-nums">
                {String(activeFlowStep.index).padStart(2, '0')} / {CHINESE_FLOW_STEPS.length}
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-xl border text-xs sm:text-sm font-extrabold ${activeFlowBadge.pill}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${activeFlowBadge.dot}`} />
                <span>{activeFlowStep.statusLabel}</span>
              </span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight tracking-tight">
              {activeFlowStep.name}
            </h2>

            {/* Giant 60s Countdown */}
            <div
              data-testid="recording-mode-timer"
              className="font-mono font-extrabold text-7xl sm:text-9xl tabular-nums text-[#7FDAD0] leading-none py-2"
            >
              {String(flowRemaining).padStart(2, '0')}s
            </div>

            {/* Surf Bridge & Safe Cue */}
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 text-left space-y-2">
              <p className="text-sm sm:text-base font-bold text-[#7FDAD0]">
                Para que serve no surf:
              </p>
              <p className="text-base sm:text-xl font-medium text-white leading-snug">
                {activeFlowStep.surfBridge}
              </p>
              <p className="text-xs sm:text-sm text-white/80 pt-1">
                {activeFlowStep.instruction}
              </p>
            </div>
          </div>

          {/* Bottom Giant Controls */}
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={() => {
                const prev =
                  (flowStepIdx - 1 + CHINESE_FLOW_STEPS.length) % CHINESE_FLOW_STEPS.length;
                setFlowStepIdx(prev);
                setFlowRemaining(60);
              }}
              aria-label="Exercício anterior"
              className="min-h-[56px] min-w-[56px] rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setFlowRunning((r) => !r)}
              className="flex-1 min-h-[56px] rounded-2xl bg-[#00A896] hover:bg-[#009282] text-white font-display font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              {flowRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{flowRunning ? 'Pausar' : 'Iniciar 60s'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = (flowStepIdx + 1) % CHINESE_FLOW_STEPS.length;
                setFlowStepIdx(next);
                setFlowRemaining(60);
                playBeep(660, 90, 0.08);
              }}
              aria-label="Próximo exercício"
              className="min-h-[56px] min-w-[56px] rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Rest Timer Bar */}
      {(restRunning || restSeconds > 0) && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40 rounded-2xl bg-[#06283D] text-white p-3.5 shadow-xl border border-[#00A896]/50 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-[#00A896]" aria-hidden="true" />
            <div>
              <p className="text-[11px] text-white/75">Descanso entre séries</p>
              <p className="font-mono font-bold text-xl tabular-nums leading-none">
                00:{String(restSeconds).padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => startRest(45)}
              className="min-h-[38px] px-2.5 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-xs font-bold cursor-pointer"
            >
              45s
            </button>
            <button
              type="button"
              onClick={() => startRest(60)}
              className="min-h-[38px] px-2.5 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-xs font-bold cursor-pointer"
            >
              60s
            </button>
            <button
              type="button"
              onClick={() => {
                setRestRunning(false);
                setRestSeconds(0);
              }}
              aria-label="Fechar cronômetro de descanso"
              className="min-h-[38px] min-w-[38px] rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

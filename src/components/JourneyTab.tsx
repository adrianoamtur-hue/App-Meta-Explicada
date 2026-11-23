import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Upload,
} from 'lucide-react';
import type { AppState, CoachEvaluation } from '../types';
import {
  TOTAL_PROJECT_DAYS,
  formatDurationHoursMin,
  formatPtDate,
  formatSleepBlocksSummary,
  getSleepEntryTotalMinutes,
  validateBackupJson,
} from '../utils/logic';
import { buildStoryCaption, renderStoryCanvas } from '../utils/storyCanvas';

interface JourneyTabProps {
  state: AppState;
  onSaveCoachEval: (evalItem: CoachEvaluation) => void;
  onImportState: (nextState: AppState) => void;
}

const COACH_CRITERIA: {
  key: keyof CoachEvaluation['scores'];
  label: string;
  desc: string;
}[] = [
  {
    key: 'lookHeadRudder',
    label: '1. Olhar / Cabeça como leme',
    desc: 'Queixo e olhar apontam primeiro para o lip ou espuma antes da prancha girar.',
  },
  {
    key: 'straightSpineGorilla',
    label: '2. Coluna reta / Posição do Gorila',
    desc: 'Comprime dobrando tornozelos e quadris sem arredondar a lombar (Escudo L4-S1).',
  },
  {
    key: 'backArmConnected',
    label: '3. Braço de trás conectado',
    desc: 'Mãos calmas; braço traseiro acompanha o eixo do tronco sem jogar para trás.',
  },
  {
    key: 'legLeverTop',
    label: '4. Alavanca das pernas no topo',
    desc: 'Pé de trás firme em cima das quilhas e extensão controlada para empurrar água.',
  },
  {
    key: 'railAngleVsFlat',
    label: '5. Inclinação da borda vs. prancha chapada',
    desc: 'Troca limpa de borda a borda sem chapar a prancha na água ou derrapar a rabeta.',
  },
];

export const JourneyTab: React.FC<JourneyTabProps> = ({
  state,
  onSaveCoachEval,
  onImportState,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    state.checkIns[0]?.id || ''
  );
  const [filterMode, setFilterMode] = useState<'all' | 'insta'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Selected entry for Story PNG
  const selectedEntry = useMemo(
    () => state.checkIns.find((c) => c.id === selectedEntryId) || state.checkIns[0],
    [state.checkIns, selectedEntryId]
  );

  // Match sleep log closest to selected entry
  const matchingSleep = useMemo(() => {
    if (!selectedEntry) return state.sleepLogs[0];
    return (
      state.sleepLogs.find((s) => s.date === selectedEntry.date) || state.sleepLogs[0]
    );
  }, [selectedEntry, state.sleepLogs]);

  // Render high-res Story PNG whenever selection or logo changes
  useEffect(() => {
    if (canvasRef.current && selectedEntry) {
      renderStoryCanvas(
        canvasRef.current,
        selectedEntry,
        matchingSleep,
        state.customLogoDataUrl
      );
    }
  }, [selectedEntry, matchingSleep, state.customLogoDataUrl]);

  const handleDownloadStoryPng = () => {
    if (!canvasRef.current || !selectedEntry) return;
    const link = document.createElement('a');
    link.download = `metaexplicada-dia-${String(selectedEntry.dayNumber).padStart(2, '0')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setCopiedId(null);
    }
  };

  // Coach Eye Monthly Evaluation
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const activeEval = useMemo(() => {
    return (
      state.coachEvaluations.find((e) => e.monthKey === currentMonthKey) ||
      state.coachEvaluations[0] || {
        id: `eval-${currentMonthKey}`,
        monthKey: currentMonthKey,
        monthLabel: currentMonthKey,
        scores: {
          lookHeadRudder: false,
          straightSpineGorilla: false,
          backArmConnected: false,
          legLeverTop: false,
          railAngleVsFlat: false,
        },
        notes: '',
        updatedAt: new Date().toISOString(),
      }
    );
  }, [state.coachEvaluations, currentMonthKey]);

  const toggleCoachCriterion = (key: keyof CoachEvaluation['scores']) => {
    onSaveCoachEval({
      ...activeEval,
      scores: {
        ...activeEval.scores,
        [key]: !activeEval.scores[key],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCoachNotes = (notes: string) => {
    onSaveCoachEval({
      ...activeEval,
      notes,
      updatedAt: new Date().toISOString(),
    });
  };

  // Chart 1 Data: Sleep Hours x Lumbar Health (0..10)
  const sleepVsLumbarPoints = useMemo(() => {
    const dates = new Set<string>([
      ...state.checkIns.map((c) => c.date),
      ...state.sleepLogs.map((s) => s.date),
    ]);
    const sorted = Array.from(dates).sort();
    return sorted.slice(-10).map((d) => {
      const ci = state.checkIns.find((c) => c.date === d);
      const daySleeps = state.sleepLogs.filter((s) => s.date === d);
      const daySleepMinutes = daySleeps.reduce((acc, s) => acc + getSleepEntryTotalMinutes(s), 0);
      const fallbackSleep = state.sleepLogs[0];
      const sleepHours =
        daySleepMinutes > 0
          ? Number((daySleepMinutes / 60).toFixed(1))
          : fallbackSleep
            ? Number((getSleepEntryTotalMinutes(fallbackSleep) / 60).toFixed(1))
            : 6;
      const lumbarAfter = ci ? ci.lumbarAfter : state.preWorkout.lumbarNow;
      return {
        date: d.slice(5).split('-').reverse().join('/'),
        sleepHours,
        lumbarAfter,
      };
    });
  }, [state.checkIns, state.sleepLogs, state.preWorkout.lumbarNow]);

  // Chart 2 Data: Sessions by Modality
  const modalityCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of state.checkIns) {
      map.set(c.modality, (map.get(c.modality) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [state.checkIns]);

  const maxModalityCount = Math.max(1, ...modalityCounts.map(([, n]) => n));

  // Filtered Timeline
  const filteredTimeline = useMemo(() => {
    if (filterMode === 'insta') {
      return state.checkIns.filter((c) => c.hasMediaForInsta);
    }
    return state.checkIns;
  }, [state.checkIns, filterMode]);

  // JSON Backup Export / Import
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaexplicada-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage({ ok: true, text: 'Backup JSON exportado com sucesso!' });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const validated = validateBackupJson(reader.result);
      if (validated.ok) {
        onImportState(validated.state);
        setBackupMessage({ ok: true, text: 'Histórico restaurado com sucesso do arquivo JSON!' });
      } else {
        setBackupMessage({ ok: false, text: validated.error });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const coachScoreCount = Object.values(activeEval.scores).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Top Instagram @metaexplicada Banner */}
      <section className="rounded-2xl bg-[#06283D] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#7FDAD0]">DIÁRIO PÚBLICO · PROJETO 273 DIAS</p>
          <h2 className="font-display font-bold text-lg sm:text-xl mt-0.5">
            Jornada @metaexplicada
          </h2>
          <p className="text-xs text-white/80 mt-0.5">
            {state.checkIns.length} {state.checkIns.length === 1 ? 'sessão registrada' : 'sessões registradas'} · Gerador de Card Story 1080×1920 + Gráficos Clínicos + Backup JSON.
          </p>
        </div>
        <a
          href="https://instagram.com/metaexplicada"
          target="_blank"
          rel="noreferrer"
          className="min-h-[46px] px-4 rounded-xl bg-[#00A896] hover:bg-[#009282] text-white text-xs font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <span>Abrir instagram.com/metaexplicada</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </section>

      {/* Story PNG Generator + Native SVG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Story Card PNG Generator */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-base text-[#06283D]">
              Gerador de Card Story PNG (1080×1920)
            </h3>
            <p className="text-xs text-[#4A6578] mt-0.5">
              Selecione qualquer dia para baixar o Story numerado com seu emblema e dados reais.
            </p>
          </div>

          {state.checkIns.length > 0 && selectedEntry ? (
            <>
              <div>
                <label htmlFor="story-day-select" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Escolher registro
                </label>
                <select
                  id="story-day-select"
                  value={selectedEntry.id}
                  onChange={(e) => setSelectedEntryId(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-xs font-semibold text-[#06283D]"
                >
                  {state.checkIns.map((c) => (
                    <option key={c.id} value={c.id}>
                      DIA {String(c.dayNumber).padStart(2, '0')}/{TOTAL_PROJECT_DAYS} — {formatPtDate(c.date)} · {c.modality}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scaled Preview of 1080x1920 Canvas */}
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  data-testid="story-png-canvas"
                  className="w-full max-w-[230px] aspect-[9/16] rounded-2xl border border-[#E5E0D5] shadow-md bg-[#06283D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadStoryPng}
                  className="min-h-[46px] px-3.5 rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Card Story (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(buildStoryCaption(selectedEntry, matchingSleep), 'story-caption')
                  }
                  className="min-h-[46px] px-3.5 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'story-caption' ? (
                    <>
                      <Check className="w-4 h-4 text-[#00A896]" />
                      <span>Legenda Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#1363DF]" />
                      <span>Copiar Legenda Pronta</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-[#5B7689]">
              Faça seu primeiro check-in para gerar o card Story.
            </p>
          )}
        </section>

        {/* Right Column: Native SVG Charts + Olho de Coach */}
        <div className="lg:col-span-7 space-y-5">
          {/* Chart 1: Sono (h) x Lombar (0-10) */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#06283D]">
                  Curva Sono (h) × Lombar (0–10)
                </h3>
                <p className="text-xs text-[#4A6578]">
                  Linha tracejada em 6h marca o ponto de corte de recuperação do Modic Tipo 1.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold shrink-0">
                <span className="text-[#1363DF]">● Sono (h)</span>
                <span className="text-[#E63946]">● Lombar</span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 520 180"
                role="img"
                aria-label="Gráfico comparando horas de sono e dor lombar de 0 a 10"
                className="w-full h-44"
              >
                {/* Horizontal Gridlines */}
                {[0, 2, 4, 6, 8, 10].map((v) => {
                  const y = 150 - (v / 10) * 125;
                  return (
                    <g key={v}>
                      <line
                        x1="36"
                        y1={y}
                        x2="500"
                        y2={y}
                        stroke={v === 6 ? '#D97706' : '#E5E0D5'}
                        strokeDasharray={v === 6 ? '4 4' : undefined}
                        strokeWidth={v === 6 ? 1.5 : 1}
                      />
                      <text
                        x="26"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#5B7689"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Sleep & Lumbar Bars / Points */}
                {sleepVsLumbarPoints.map((pt, idx) => {
                  const count = Math.max(1, sleepVsLumbarPoints.length);
                  const stepX = count === 1 ? 0 : 420 / (count - 1);
                  const x = count === 1 ? 260 : 60 + idx * stepX;
                  const sleepY = 150 - (Math.min(10, pt.sleepHours) / 10) * 125;
                  const lumbarY = 150 - (Math.min(10, pt.lumbarAfter) / 10) * 125;

                  return (
                    <g key={pt.date}>
                      {/* Sleep vertical bar */}
                      <rect
                        x={x - 14}
                        y={sleepY}
                        width="12"
                        height={Math.max(4, 150 - sleepY)}
                        rx="4"
                        fill="#1363DF"
                        opacity="0.85"
                      />
                      {/* Lumbar vertical bar */}
                      <rect
                        x={x + 2}
                        y={lumbarY}
                        width="12"
                        height={Math.max(4, 150 - lumbarY)}
                        rx="4"
                        fill={pt.lumbarAfter >= 5 ? '#E63946' : '#00A896'}
                      />
                      <text
                        x={x}
                        y="168"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#4A6578"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Chart 2: Constância / Sessões por Modalidade */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3">
            <h3 className="font-display font-bold text-base text-[#06283D]">
              Constância · Sessões por Modalidade
            </h3>
            <div className="space-y-2.5">
              {modalityCounts.map(([mod, count]) => {
                const widthPct = Math.max(10, Math.round((count / maxModalityCount) * 100));
                return (
                  <div key={mod} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#06283D]">{mod}</span>
                      <span className="font-mono font-bold text-[#1363DF] tabular-nums">
                        {count} {count === 1 ? 'sessão' : 'sessões'}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#F8F6F1] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#06283D] to-[#00A896]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Olho de Coach Monthly Video Checklist */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                  <span>Checklist Mensal &ldquo;Olho de Coach&rdquo;</span>
                </h3>
                <p className="text-xs text-[#4A6578]">
                  Avalie seus vídeos do mês ({activeEval.monthLabel}) nos 5 critérios de estilo.
                </p>
              </div>
              <span className="font-mono font-bold text-sm text-[#00A896] tabular-nums">
                {coachScoreCount}/5
              </span>
            </div>

            <div className="space-y-2">
              {COACH_CRITERIA.map((c) => {
                const checked = activeEval.scores[c.key];
                return (
                  <label
                    key={c.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#ECFDF5] border-[#00A896]/40'
                        : 'bg-[#F8F6F1] border-[#E5E0D5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCoachCriterion(c.key)}
                      className="mt-0.5 w-5 h-5 accent-[#00A896] shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#06283D]">{c.label}</p>
                      <p className="text-[11px] text-[#4A6578] leading-snug mt-0.5">{c.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label htmlFor="coach-notes" className="block text-xs font-semibold text-[#4A6578] mb-1">
                Observação técnica do mês
              </label>
              <input
                id="coach-notes"
                type="text"
                value={activeEval.notes}
                onChange={(e) => updateCoachNotes(e.target.value)}
                placeholder="Ex: Melhorou muito o olhar na cavada de frontside..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-xs text-[#06283D]"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Complete Timeline + Filter + Copy Summary */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#06283D]">
              Linha do Tempo Completa
            </h3>
            <p className="text-xs text-[#4A6578]">
              Histórico salvo automaticamente em localStorage (metaexplicada_v31).
            </p>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] self-start">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              aria-pressed={filterMode === 'all'}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold cursor-pointer ${
                filterMode === 'all' ? 'bg-[#06283D] text-white' : 'text-[#4A6578]'
              }`}
            >
              Todos ({state.checkIns.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('insta')}
              aria-pressed={filterMode === 'insta'}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold cursor-pointer ${
                filterMode === 'insta' ? 'bg-[#1363DF] text-white' : 'text-[#4A6578]'
              }`}
            >
              Só @metaexplicada
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTimeline.map((entry) => {
            const summaryText = buildStoryCaption(
              entry,
              state.sleepLogs.find((s) => s.date === entry.date)
            );
            return (
              <article
                key={entry.id}
                className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2 text-xs">
                    <span className="font-mono font-bold text-[#1363DF]">
                      DIA {String(entry.dayNumber).padStart(2, '0')} / {TOTAL_PROJECT_DAYS}
                    </span>
                    <span className="text-[#94A3B8]" aria-hidden="true">·</span>
                    <span className="font-semibold text-[#06283D]">{formatPtDate(entry.date)}</span>
                    <span className="text-[#94A3B8]" aria-hidden="true">·</span>
                    <span className="font-bold text-[#06283D]">{entry.modality}</span>
                    {entry.hasMediaForInsta && (
                      <>
                        <span className="text-[#94A3B8]" aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#007A6D] font-semibold">
                          <Camera className="w-3 h-3" aria-hidden="true" /> @metaexplicada
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(summaryText, entry.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-white border border-[#E5E0D5] text-xs font-semibold text-[#06283D] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#00A896]" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#1363DF]" />
                        <span>Copiar resumo</span>
                      </>
                    )}
                  </button>
                </div>

                {entry.routeTitle && (
                  <p className="text-xs font-semibold text-[#06283D]">{entry.routeTitle}</p>
                )}

                <p className="text-xs font-mono text-[#335368] tabular-nums">
                  {entry.distanceKm ? `${entry.distanceKm.toString().replace('.', ',')} km · ` : ''}
                  {entry.durationMin} min · {entry.calories} kcal · Lombar {entry.lumbarBefore}/10 →{' '}
                  <strong className={entry.lumbarAfter <= entry.lumbarBefore ? 'text-[#007A6D]' : 'text-[#E63946]'}>
                    {entry.lumbarAfter}/10
                  </strong>{' '}
                  · Esforço {entry.effort}/5 · {entry.location}
                </p>

                <p className="text-xs text-[#1E3A4C] leading-relaxed">&ldquo;{entry.note}&rdquo;</p>
              </article>
            );
          })}
        </div>

        {/* Sleep Logs compact view */}
        {state.sleepLogs.length > 0 && (
          <div className="pt-3 border-t border-[#E5E0D5]">
            <p className="text-xs font-bold text-[#06283D] mb-2">Histórico Independente de Sono &amp; Escalas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {state.sleepLogs.slice(0, 9).map((sl) => (
                <div
                  key={sl.id}
                  className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3 text-xs text-[#284559]"
                >
                  <p className="font-bold text-[#06283D]">
                    {sl.nightLabel || formatPtDate(sl.date)} ·{' '}
                    <span className="font-mono text-[#1363DF]">
                      {formatDurationHoursMin(getSleepEntryTotalMinutes(sl))}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono text-[#06283D]">
                    {formatSleepBlocksSummary(sl)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#4A6578]">
                    Acordou: <strong>{sl.feeling}</strong>
                    {sl.fragmented ? ' · Sono picado' : ''}
                    {sl.shiftNote ? ` · ${sl.shiftNote}` : ''}
                  </p>
                  {sl.note && <p className="mt-1 text-[11px] text-[#5B7689]">{sl.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* JSON Backup & Restore Area */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3">
        <div>
          <h3 className="font-display font-bold text-base text-[#06283D]">
            Backup &amp; Restauração (.json)
          </h3>
          <p className="text-xs text-[#4A6578]">
            Exporte uma cópia de segurança dos seus 9 meses de registros para iCloud Drive / WhatsApp ou restaure em outro aparelho.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[46px] px-4 rounded-xl bg-[#06283D] hover:bg-[#0B3B59] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup (.json)</span>
          </button>
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="min-h-[46px] px-4 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#1363DF]" />
            <span>Importar Backup (.json)</span>
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportJson}
            className="hidden"
            aria-label="Selecionar arquivo JSON de backup"
          />
        </div>

        {backupMessage && (
          <p
            role="status"
            className={`text-xs font-semibold ${
              backupMessage.ok ? 'text-[#007A6D]' : 'text-[#E63946]'
            }`}
          >
            {backupMessage.text}
          </p>
        )}
      </section>
    </div>
  );
};

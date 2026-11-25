import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  Lock,
  Plus,
  Scale,
  Upload,
  X,
} from 'lucide-react';
import type { AppState, BodyMeasurementEntry } from '../types';
import {
  DEFAULT_HEIGHT_CM,
  WAIST_TARGET_CM,
  buildPrivateDatabaseReport,
  calculateBodyMetrics,
  formatDurationHoursMin,
  formatIsoDate,
  formatPtDate,
  formatSleepBlocksSummary,
  getDailyWaterGoalMl,
  getLatestWaistCm,
  getLatestWeightKg,
  getSleepEntryTotalMinutes,
  validateBackupJson,
} from '../utils/logic';

interface PrivateDatabaseModalProps {
  isOpen: boolean;
  state: AppState;
  onClose: () => void;
  onAddMeasurement: (entry: BodyMeasurementEntry) => void;
  onImportState: (nextState: AppState) => void;
}

type DbFilter =
  | 'todos'
  | 'sono'
  | 'remedios'
  | 'humor'
  | 'lombar'
  | 'peso'
  | 'treinos';

interface TimelineRow {
  id: string;
  date: string;
  category: Exclude<DbFilter, 'todos'>;
  categoryLabel: string;
  headline: string;
  detail: string;
  subDetail?: string;
}

export const PrivateDatabaseModal: React.FC<PrivateDatabaseModalProps> = ({
  isOpen,
  state,
  onClose,
  onAddMeasurement,
  onImportState,
}) => {
  const [filter, setFilter] = useState<DbFilter>('todos');
  const [copiedDays, setCopiedDays] = useState<7 | 30 | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const heightCm = state.profileHeightCm || DEFAULT_HEIGHT_CM;
  const latestWeight = useMemo(
    () => getLatestWeightKg(state.bodyMeasurements),
    [state.bodyMeasurements]
  );
  const latestWaist = useMemo(
    () => getLatestWaistCm(state.bodyMeasurements),
    [state.bodyMeasurements]
  );
  const bodyMetrics = useMemo(
    () => calculateBodyMetrics(latestWeight, latestWaist, heightCm),
    [latestWeight, latestWaist, heightCm]
  );
  const dynamicWaterGoal = useMemo(() => getDailyWaterGoalMl(latestWeight), [latestWeight]);

  // Unified chronological rows across all structured tables
  const allRows = useMemo<TimelineRow[]>(() => {
    const rows: TimelineRow[] = [];

    for (const s of state.sleepLogs) {
      const kindLabel = s.kind === 'upcoming_shift' ? 'Próximo Sono / Escala' : 'Sono Registrado';
      rows.push({
        id: `row-sleep-${s.id}`,
        date: s.date,
        category: 'sono',
        categoryLabel: 'Sono & Escalas',
        headline: `${kindLabel} · ${formatSleepBlocksSummary(s)} (${formatDurationHoursMin(getSleepEntryTotalMinutes(s))})`,
        detail: `Acordou: ${s.feeling}${s.fragmented ? ' · Sono picado' : ''}${s.inBedTime ? ` · Foi deitar às ${s.inBedTime}` : ''}${s.shiftNote ? ` · ${s.shiftNote}` : ''}`,
        subDetail: s.note,
      });
    }

    for (const m of state.medicationLogs) {
      rows.push({
        id: `row-med-${m.id}`,
        date: m.date,
        category: 'remedios',
        categoryLabel: 'Remédios',
        headline: `${m.name}${m.timeApprox ? ` (${m.timeApprox})` : ''}`,
        detail: m.note || 'Registrado via Diário por Voz.',
      });
    }

    for (const mood of state.moodLogs) {
      rows.push({
        id: `row-mood-${mood.id}`,
        date: mood.date,
        category: 'humor',
        categoryLabel: 'Como me senti',
        headline: `${mood.summary} · Energia ${mood.energy}`,
        detail: mood.note,
      });
    }

    for (const b of state.bodyMeasurements) {
      const m = calculateBodyMetrics(b.weightKg, b.waistCm, heightCm);
      rows.push({
        id: `row-body-${b.id}`,
        date: b.date,
        category: 'peso',
        categoryLabel: 'Peso/Medidas',
        headline: `${b.weightKg ? `${b.weightKg.toString().replace('.', ',')} kg` : '--'} · Cintura ${b.waistCm ? `${b.waistCm.toString().replace('.', ',')} cm` : '--'}`,
        detail: `IMC: ${m.bmi ?? '--'} (${m.bmiLabel || '--'}) · Relação Cintura/Altura: ${m.waistToHeightRatio ?? '--'} (meta < 0,50)`,
        subDetail: b.note,
      });
    }

    for (const c of state.checkIns) {
      rows.push({
        id: `row-ci-${c.id}`,
        date: c.date,
        category: 'treinos',
        categoryLabel: 'Treinos',
        headline: `DIA ${String(c.dayNumber).padStart(2, '0')} · ${c.modality} (${c.durationMin} min · ${c.calories} kcal)`,
        detail: `Lombar ${c.lumbarBefore}/10 → ${c.lumbarAfter}/10${c.rightLegRadiation ? ' · ALERTA RAIZ D L5' : ''} · ${c.location}`,
        subDetail: c.note,
      });
      rows.push({
        id: `row-lumbar-${c.id}`,
        date: c.date,
        category: 'lombar',
        categoryLabel: 'Lombar',
        headline: `Lombar ${c.lumbarBefore}/10 → ${c.lumbarAfter}/10${c.rightLegRadiation ? ' · Irradiação Perna Direita!' : ' · Sem irradiação'}`,
        detail: `Sessão: ${c.modality}`,
        subDetail: c.note,
      });
    }

    // Voice raw transcripts (visible in 'todos' and 'humor')
    for (const v of state.voiceDiaryLogs) {
      rows.push({
        id: `row-voice-${v.id}`,
        date: v.date,
        category: 'humor',
        categoryLabel: 'Transcrição Original',
        headline: `Fala original (${v.detectedCategories.join(' · ') || 'Diário'})`,
        detail: `"${v.rawText}"`,
      });
    }

    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [
    state.sleepLogs,
    state.medicationLogs,
    state.moodLogs,
    state.bodyMeasurements,
    state.checkIns,
    state.voiceDiaryLogs,
    heightCm,
  ]);

  const filteredRows = useMemo(() => {
    if (filter === 'todos') {
      // Avoid duplicating lumbar rows when viewing 'todos' since checkIns already display lumbar
      return allRows.filter((r) => !r.id.startsWith('row-lumbar-'));
    }
    return allRows.filter((r) => r.category === filter);
  }, [allRows, filter]);

  // Weekly chart points for weight/waist evolution
  const chartPoints = useMemo(() => {
    return [...state.bodyMeasurements]
      .filter((m) => typeof m.weightKg === 'number' || typeof m.waistCm === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
  }, [state.bodyMeasurements]);

  if (!isOpen) return null;

  const handleCopyReport = async (days: 7 | 30) => {
    const report = buildPrivateDatabaseReport(state, days);
    try {
      await navigator.clipboard.writeText(report);
      setCopiedDays(days);
      window.setTimeout(() => setCopiedDays(null), 2600);
    } catch {
      setCopiedDays(null);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metaexplicada-banco-privado-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg({ ok: true, text: 'Backup JSON completo exportado com sucesso!' });
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
        setBackupMsg({ ok: true, text: 'Banco de dados restaurado com sucesso!' });
      } else {
        setBackupMsg({ ok: false, text: validated.error });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveManualMetric = (e: React.FormEvent) => {
    e.preventDefault();
    const w = weightInput.trim() ? parseFloat(weightInput.replace(',', '.')) : undefined;
    const c = waistInput.trim() ? parseFloat(waistInput.replace(',', '.')) : undefined;
    if (!w && !c) return;
    const calc = calculateBodyMetrics(w, c, heightCm);
    onAddMeasurement({
      id: `body-${Date.now()}`,
      date: formatIsoDate(new Date()),
      weightKg: w,
      waistCm: c,
      bmi: calc.bmi,
      waistToHeightRatio: calc.waistToHeightRatio,
      note: 'Registro manual no Banco Privado.',
      createdAt: new Date().toISOString(),
    });
    setWeightInput('');
    setWaistInput('');
    setShowAddMetric(false);
  };

  const FILTER_TABS: { id: DbFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'sono', label: 'Sono & Escalas' },
    { id: 'remedios', label: 'Remédios' },
    { id: 'humor', label: 'Como me senti' },
    { id: 'lombar', label: 'Lombar' },
    { id: 'peso', label: 'Peso/Medidas' },
    { id: 'treinos', label: 'Treinos' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Banco de Dados Privado"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#F8F6F1] border border-[#E5E0D5] text-[#06283D] shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#06283D] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/10 text-[#7FDAD0] flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#7FDAD0]" aria-hidden="true" />
                <span>Banco de Dados Privado</span>
              </h2>
              <p className="text-[11px] text-white/75 truncate">
                Armazenamento local estruturado (localStorage · metaexplicada_v31) — fora da tela inicial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Banco de Dados Privado"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* 1. Peso & Medidas (Altura Fixa 1,72 m) */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#1363DF]" aria-hidden="true" />
                  <span>Peso &amp; Medidas (Altura fixa: 1,72 m)</span>
                </h3>
                <p className="text-xs text-[#4A6578] mt-0.5">
                  Meta visual Relação Cintura/Altura &lt; 0,50 (cintura &lt; {WAIST_TARGET_CM} cm) para reduzir carga anterior sobre L5-S1. Meta de água recalculada automaticamente: <strong className="font-mono text-[#06283D]">{dynamicWaterGoal} ml/dia</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMetric((s) => !s)}
                className="min-h-[40px] px-3 rounded-xl bg-[#F4F8FC] hover:bg-[#E7F0FB] border border-[#1363DF]/30 text-xs font-bold text-[#1363DF] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Medida</span>
              </button>
            </div>

            {showAddMetric && (
              <form
                onSubmit={handleSaveManualMetric}
                className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
              >
                <div>
                  <label htmlFor="db-weight" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                    Peso (kg)
                  </label>
                  <input
                    id="db-weight"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 81,5"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-[#E5E0D5] font-mono text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="db-waist" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                    Cintura / Abdômen (cm)
                  </label>
                  <input
                    id="db-waist"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 85"
                    value={waistInput}
                    onChange={(e) => setWaistInput(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-[#E5E0D5] font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[42px] px-4 rounded-xl bg-[#00A896] hover:bg-[#009282] text-white text-xs font-bold cursor-pointer"
                >
                  Salvar Medida
                </button>
              </form>
            )}

            {/* 4 Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3">
                <p className="text-[11px] font-semibold text-[#5B7689]">Último Peso</p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D]">
                  {latestWeight ? `${latestWeight.toString().replace('.', ',')} kg` : '--'}
                </p>
              </div>
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3">
                <p className="text-[11px] font-semibold text-[#5B7689]">Última Cintura</p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D]">
                  {latestWaist ? `${latestWaist.toString().replace('.', ',')} cm` : '--'}
                </p>
                <p className="text-[10px] text-[#5B7689]">Meta: &lt; {WAIST_TARGET_CM} cm</p>
              </div>
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3">
                <p className="text-[11px] font-semibold text-[#5B7689]">IMC (1,72 m)</p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D]">
                  {bodyMetrics.bmi ? bodyMetrics.bmi.toFixed(1).replace('.', ',') : '--'}
                </p>
                <p className="text-[10px] text-[#4A6578]">{bodyMetrics.bmiLabel || 'Aguardando peso'}</p>
              </div>
              <div
                className={`rounded-xl border p-3 ${
                  bodyMetrics.waistStatus === 'ideal'
                    ? 'bg-[#ECFDF5] border-[#00A896]/40'
                    : bodyMetrics.waistStatus === 'atencao'
                      ? 'bg-[#FFFBEB] border-[#D97706]/40'
                      : 'bg-[#F8F6F1] border-[#E5E0D5]'
                }`}
              >
                <p className="text-[11px] font-semibold text-[#5B7689]">Cintura / Altura</p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D]">
                  {bodyMetrics.waistToHeightRatio
                    ? bodyMetrics.waistToHeightRatio.toFixed(2).replace('.', ',')
                    : '--'}
                </p>
                <p className="text-[10px] font-semibold text-[#007A6D]">
                  {bodyMetrics.waistStatus === 'ideal'
                    ? 'Abaixo de 0,50 (Alívio L5-S1)'
                    : bodyMetrics.waistStatus === 'atencao'
                      ? 'Meta: reduzir abaixo de 0,50'
                      : 'Meta: < 0,50 (< 86 cm)'}
                </p>
              </div>
            </div>

            {/* Simple Weekly Evolution SVG Chart */}
            {chartPoints.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-bold text-[#4A6578] mb-2">
                  Evolução Semanal — Peso (kg) &amp; Cintura (cm)
                </p>
                <svg
                  viewBox="0 0 500 120"
                  role="img"
                  aria-label="Evolução semanal de peso e cintura"
                  className="w-full h-32 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5]"
                >
                  {chartPoints.map((pt, idx) => {
                    const count = Math.max(1, chartPoints.length);
                    const x = count === 1 ? 250 : 50 + (idx * 400) / (count - 1);
                    const wVal = pt.weightKg ?? 0;
                    const cVal = pt.waistCm ?? 0;
                    const wH = Math.min(70, Math.max(10, (wVal / 120) * 70));
                    const cH = Math.min(70, Math.max(10, (cVal / 120) * 70));
                    return (
                      <g key={pt.id}>
                        {wVal > 0 && (
                          <rect
                            x={x - 14}
                            y={92 - wH}
                            width="12"
                            height={wH}
                            rx="3"
                            fill="#1363DF"
                          />
                        )}
                        {cVal > 0 && (
                          <rect
                            x={x + 2}
                            y={92 - cH}
                            width="12"
                            height={cH}
                            rx="3"
                            fill={cVal < WAIST_TARGET_CM ? '#00A896' : '#D97706'}
                          />
                        )}
                        <text
                          x={x}
                          y="108"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#4A6578"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {formatPtDate(pt.date).slice(0, 5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </section>

          {/* 2. Copy Complete Report (7 or 30 Days) + Backup JSON */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-[#06283D]">
              Relatório Clínico &amp; Backup Completo
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyReport(7)}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#1363DF] hover:bg-[#0F52BD] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDays === 7 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>
                  {copiedDays === 7
                    ? 'Relatório 7 dias copiado!'
                    : 'Copiar Relatório Completo (7 dias)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyReport(30)}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#00A896] hover:bg-[#009282] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDays === 30 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>
                  {copiedDays === 30
                    ? 'Relatório 30 dias copiado!'
                    : 'Copiar Relatório Completo (30 dias)'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#06283D] hover:bg-[#0B3B59] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#1363DF]" />
                <span>Importar Backup (.json)</span>
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="hidden"
                aria-label="Importar arquivo JSON do Banco Privado"
              />
            </div>
            {backupMsg && (
              <p
                role="status"
                className={`text-xs font-semibold ${
                  backupMsg.ok ? 'text-[#007A6D]' : 'text-[#E63946]'
                }`}
              >
                {backupMsg.text}
              </p>
            )}
          </section>

          {/* 3. Filterable Full Private Timeline by Date */}
          <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-[#06283D]">
                Linha do Tempo Privada ({filteredRows.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTER_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  aria-pressed={filter === t.id}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    filter === t.id
                      ? 'bg-[#06283D] text-white border-[#06283D]'
                      : 'bg-[#F8F6F1] text-[#335368] border-[#E5E0D5] hover:text-[#06283D]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {filteredRows.length === 0 ? (
              <p className="text-xs text-[#5B7689] py-4 text-center">
                Nenhum registro encontrado neste filtro ainda. Use o Diário por Voz para alimentar automaticamente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredRows.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5 space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-bold text-[#1363DF]">
                        {formatPtDate(row.date)}
                      </span>
                      <span className="font-bold text-[#4A6578]">{row.categoryLabel}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#06283D]">{row.headline}</p>
                    <p className="text-xs text-[#284559] leading-relaxed">{row.detail}</p>
                    {row.subDetail && (
                      <p className="text-[11px] text-[#5B7689] leading-relaxed">{row.subDetail}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

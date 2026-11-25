import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  MapPin,
  Moon,
  Save,
  ShieldCheck,
} from 'lucide-react';
import type { CheckInEntry, Modality, PreWorkoutState, UniversalVoiceParsed } from '../types';
import {
  estimateCalories,
  formatPtDate,
  getProjectProgress,
  shiftIsoDate,
} from '../utils/logic';
import { VoiceDiaryPanel } from './VoiceDiaryPanel';

interface CheckInTabProps {
  todayIso: string;
  preWorkout: PreWorkoutState;
  latestWeightKg?: number;
  initialManualMode?: boolean;
  onClearInitialManualMode?: () => void;
  onSaveCheckIn: (entry: CheckInEntry) => void;
  onConfirmVoiceAll: (payload: UniversalVoiceParsed) => void;
  onOpenSleepModal: () => void;
  onOpenRestModal: () => void;
}

const MOVEMENT_MODALITIES: { id: Modality; label: string; highlight?: boolean }[] = [
  { id: 'Wellhub — Pilates', label: 'Wellhub — Pilates', highlight: true },
  { id: 'Personal Trainer', label: 'Personal Trainer', highlight: true },
  { id: 'Areia / Orla', label: 'Areia / Orla' },
  { id: 'Fluxo Chinês', label: 'Fluxo Chinês' },
  { id: 'Academia A', label: 'Academia A' },
  { id: 'Academia B', label: 'Academia B' },
  { id: 'Hotel / Elásticos', label: 'Hotel / Elásticos' },
  { id: 'Surfskate', label: 'Surfskate' },
  { id: 'Surf no Mar', label: 'Surf no Mar' },
  { id: 'Elite Segura', label: 'Elite Segura' },
];

export const CheckInTab: React.FC<CheckInTabProps> = ({
  todayIso,
  preWorkout,
  latestWeightKg,
  initialManualMode = false,
  onClearInitialManualMode,
  onSaveCheckIn,
  onConfirmVoiceAll,
  onOpenSleepModal,
  onOpenRestModal,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const [manualMode, setManualMode] = useState(initialManualMode);

  useEffect(() => {
    if (initialManualMode) {
      setManualMode(true);
      onClearInitialManualMode?.();
    }
  }, [initialManualMode, onClearInitialManualMode]);

  // Manual Movement Form State
  const [date, setDate] = useState(todayIso);
  const [modality, setModality] = useState<Modality>('Wellhub — Pilates');
  const [isWellhub, setIsWellhub] = useState(true);
  const [lumbarBefore, setLumbarBefore] = useState(preWorkout.lumbarNow);
  const [lumbarAfter, setLumbarAfter] = useState(Math.max(0, preWorkout.lumbarNow - 1));
  const [rightLegRadiation, setRightLegRadiation] = useState(preWorkout.rightLegRadiation);
  const [effort, setEffort] = useState(3);
  const [durationMin, setDurationMin] = useState(50);
  const [calories, setCalories] = useState(() =>
    estimateCalories('Wellhub — Pilates', 50, latestWeightKg)
  );
  const [caloriesManual, setCaloriesManual] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [location, setLocation] = useState('João Pessoa - PB');
  const [hasMediaForInsta, setHasMediaForInsta] = useState(true);
  const [note, setNote] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setLumbarBefore(preWorkout.lumbarNow);
    setRightLegRadiation(preWorkout.rightLegRadiation);
  }, [preWorkout.lumbarNow, preWorkout.rightLegRadiation]);

  useEffect(() => {
    if (!caloriesManual) {
      setCalories(estimateCalories(modality, durationMin, latestWeightKg));
    }
  }, [modality, durationMin, caloriesManual, latestWeightKg]);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS indisponível neste navegador — preencha a localização manualmente.');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('Obtendo coordenadas GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
          );
          if (!resp.ok) throw new Error('nominatim');
          const data = await resp.json();
          const addr = data.address || {};
          const place =
            addr.beach ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.road ||
            addr.city ||
            addr.town ||
            '';
          const city = addr.city || addr.town || addr.municipality || '';
          const stateCode = addr.state || '';
          const formatted = [place, city, stateCode]
            .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
            .slice(0, 3)
            .join(', ');
          setLocation(formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setGpsStatus('Localização atualizada via GPS.');
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setGpsStatus('Coordenadas capturadas.');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('Permissão de GPS negada — digite o local manualmente.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const { currentDay } = getProjectProgress(date);
    const parsedDist = distanceKm.trim()
      ? parseFloat(distanceKm.replace(',', '.'))
      : undefined;

    const entry: CheckInEntry = {
      id: `checkin-${Date.now()}`,
      date,
      dayNumber: currentDay,
      modality,
      isWellhub: isWellhub || modality === 'Wellhub — Pilates',
      distanceKm: parsedDist && !Number.isNaN(parsedDist) ? parsedDist : undefined,
      durationMin: Math.max(0, Number(durationMin) || 0),
      calories: Math.max(0, Number(calories) || 0),
      lumbarBefore,
      lumbarAfter,
      rightLegRadiation,
      effort,
      location: location.trim() || 'João Pessoa - PB',
      note:
        note.trim() ||
        `Sessão de ${modality} concluída respeitando 100% do Escudo L4-S1.`,
      hasMediaForInsta,
      createdAt: new Date().toISOString(),
    };

    onSaveCheckIn(entry);
    setSavedNotice(
      `Treino do DIA ${String(currentDay).padStart(2, '0')} salvo! Já disponível na Jornada e nos Cards Story.`
    );
    setNote('');
    setDistanceKm('');
    window.setTimeout(() => setSavedNotice(null), 4500);
  };

  // Primary Screen of Check-in Tab: Teleprompter + Bulletproof Voice Diary
  if (!manualMode) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 space-y-4">
        <div>
          <p className="text-[11px] font-bold text-[#1363DF]">
            DIÁRIO POR VOZ UNIVERSAL · SEM LIMITE DE TEMPO
          </p>
          <h2 className="font-display font-bold text-lg text-[#06283D] mt-0.5">
            Falar meu dia
          </h2>
          <p className="text-xs text-[#4A6578] mt-0.5">
            Fale naturalmente sobre sono/escalas, como se sentiu, lombar, remédios, treino ou medidas — o app organiza tudo e salva a fala original no Banco Privado.
          </p>
        </div>

        <VoiceDiaryPanel
          todayIso={todayIso}
          defaultLumbar={preWorkout.lumbarNow}
          latestWeightKg={latestWeightKg}
          onConfirmAll={onConfirmVoiceAll}
          onOpenManualEntry={() => setManualMode(true)}
        />
      </div>
    );
  }

  // Fallback Manual Entry Mode
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setManualMode(false)}
          className="min-h-[42px] px-3.5 rounded-xl bg-white border border-[#E5E0D5] text-xs font-bold text-[#06283D] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#1363DF]" />
          <span>Voltar para Diário por Voz</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSleepModal}
            className="min-h-[42px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-xs font-bold text-[#06283D] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Moon className="w-3.5 h-3.5 text-[#1363DF]" />
            <span>Lançar Sono</span>
          </button>
          <button
            type="button"
            onClick={onOpenRestModal}
            className="min-h-[42px] px-3 rounded-xl bg-[#ECFDF5] border border-[#00A896]/40 text-xs font-bold text-[#064E3B] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A896]" />
            <span>Descanso Consciente</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmitManual}
        className="bg-white rounded-2xl border border-[#E5E0D5] p-4 sm:p-5 space-y-5"
      >
        <div>
          <h2 className="font-display font-bold text-base text-[#06283D]">
            Lançamento Manual de Movimento / Treino
          </h2>
          <p className="text-xs text-[#4A6578]">
            Modo manual de fallback — independente do histórico de sono.
          </p>
        </div>

        {savedNotice && (
          <div
            role="status"
            className="rounded-xl bg-[#ECFDF5] border border-[#00A896]/40 p-3.5 text-xs sm:text-sm font-semibold text-[#064E3B] flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-[#00A896] shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        <div>
          <span className="block text-xs font-bold text-[#06283D] mb-2">1. Dia do treino</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDate(todayIso)}
              aria-pressed={date === todayIso}
              className={`min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer ${
                date === todayIso
                  ? 'bg-[#06283D] text-white border-[#06283D]'
                  : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
              }`}
            >
              Hoje ({formatPtDate(todayIso).slice(0, 5)})
            </button>
            <button
              type="button"
              onClick={() => setDate(yesterdayIso)}
              aria-pressed={date === yesterdayIso}
              className={`min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer ${
                date === yesterdayIso
                  ? 'bg-[#06283D] text-white border-[#06283D]'
                  : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
              }`}
            >
              Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
            </button>
            <input
              id="ci-date"
              aria-label="Escolher outra data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-2 sm:col-span-1 w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold text-[#06283D] mb-2">
            2. Modalidade (1 toque)
          </span>
          <div className="flex flex-wrap gap-2">
            {MOVEMENT_MODALITIES.map((m) => {
              const selected = modality === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setModality(m.id);
                    setIsWellhub(m.id === 'Wellhub — Pilates');
                  }}
                  aria-pressed={selected}
                  className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#1363DF] text-white border-[#1363DF]'
                      : m.highlight
                        ? 'bg-[#F0F7FF] text-[#06283D] border-[#1363DF]/30 hover:bg-[#E2EFFF]'
                        : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5] hover:bg-[#EFECE4]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="ci-duration" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Duração (min)
            </label>
            <input
              id="ci-duration"
              type="number"
              min={0}
              max={600}
              value={durationMin}
              onChange={(e) => {
                setDurationMin(Number(e.target.value));
                setCaloriesManual(false);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
          <div>
            <label htmlFor="ci-calories" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Calorias (kcal)
            </label>
            <input
              id="ci-calories"
              type="number"
              min={0}
              max={4000}
              value={calories}
              onChange={(e) => {
                setCalories(Number(e.target.value));
                setCaloriesManual(true);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
          <div>
            <label htmlFor="ci-distance" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Distância (km)
            </label>
            <input
              id="ci-distance"
              type="text"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="Opcional"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="ci-lumbar-before">Lombar Antes</label>
              <span className="font-mono font-bold text-[#06283D]">{lumbarBefore}/10</span>
            </div>
            <input
              id="ci-lumbar-before"
              type="range"
              min={0}
              max={10}
              value={lumbarBefore}
              onChange={(e) => setLumbarBefore(Number(e.target.value))}
              className="mt-2 w-full accent-[#06283D] cursor-pointer"
            />
          </div>

          <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="ci-lumbar-after">Lombar Depois</label>
              <span
                className={`font-mono font-bold ${
                  lumbarAfter <= lumbarBefore ? 'text-[#00A896]' : 'text-[#E63946]'
                }`}
              >
                {lumbarAfter}/10
              </span>
            </div>
            <input
              id="ci-lumbar-after"
              type="range"
              min={0}
              max={10}
              value={lumbarAfter}
              onChange={(e) => setLumbarAfter(Number(e.target.value))}
              className="mt-2 w-full accent-[#00A896] cursor-pointer"
            />
          </div>

          <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
            <span className="block text-xs font-semibold mb-2">Esforço Percebido (1–5)</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEffort(n)}
                  aria-pressed={effort === n}
                  className={`min-h-[38px] rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                    effort === n
                      ? 'bg-[#06283D] text-white border-[#06283D]'
                      : 'bg-white text-[#06283D] border-[#E5E0D5]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={rightLegRadiation}
              onChange={(e) => setRightLegRadiation(e.target.checked)}
              className="w-5 h-5 accent-[#E63946] shrink-0"
            />
            <span className="text-xs font-semibold text-[#7F1D24]">
              Alerta Raiz Direita L5 (irradiação)
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={isWellhub}
              onChange={(e) => setIsWellhub(e.target.checked)}
              className="w-5 h-5 accent-[#1363DF] shrink-0"
            />
            <span className="text-xs font-semibold text-[#06283D]">Check-in via Wellhub</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F0F7FF] border border-[#1363DF]/25 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={hasMediaForInsta}
              onChange={(e) => setHasMediaForInsta(e.target.checked)}
              className="w-5 h-5 accent-[#1363DF] shrink-0"
            />
            <span className="text-xs font-semibold text-[#06283D] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#1363DF]" aria-hidden="true" />
              <span>Foto/vídeo @metaexplicada</span>
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="ci-location" className="block text-xs font-semibold text-[#4A6578] mb-1">
            Localização (opcional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="ci-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Praia de Cabo Branco, João Pessoa - PB"
              className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm text-[#06283D]"
            />
            <button
              type="button"
              onClick={handleGetGps}
              disabled={gpsLoading}
              className="min-h-[46px] px-4 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-xs font-bold text-[#06283D] inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {gpsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1363DF]" />
              ) : (
                <MapPin className="w-4 h-4 text-[#1363DF]" />
              )}
              <span>Localização GPS</span>
            </button>
          </div>
          {gpsStatus && <p className="mt-1 text-[11px] text-[#5B7689]">{gpsStatus}</p>}
        </div>

        <div>
          <label htmlFor="ci-note" className="block text-xs font-semibold text-[#4A6578] mb-1">
            Nota / Vitória Técnica do Dia
          </label>
          <textarea
            id="ci-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Como respondeu a lombar? Qual evolução técnica você sentiu hoje?"
            className="w-full p-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm text-[#06283D] focus:outline-2 focus:outline-[#1363DF]"
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[52px] rounded-2xl bg-[#1363DF] hover:bg-[#0F52BD] active:scale-[0.99] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>Salvar Treino na Jornada</span>
        </button>
      </form>
    </div>
  );
};

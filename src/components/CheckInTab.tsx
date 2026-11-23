import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Save,
  Sparkles,
} from 'lucide-react';
import type { CheckInEntry, Modality, PreWorkoutState } from '../types';
import {
  estimateCalories,
  getProjectProgress,
  parseVoiceCheckIn,
} from '../utils/logic';

interface CheckInTabProps {
  todayIso: string;
  preWorkout: PreWorkoutState;
  onSaveCheckIn: (entry: CheckInEntry) => void;
}

const MODALITIES: { id: Modality; label: string; highlight?: boolean }[] = [
  { id: 'Wellhub — Pilates', label: 'Wellhub — Pilates', highlight: true },
  { id: 'Personal Trainer', label: 'Personal Trainer', highlight: true },
  { id: 'Areia / Orla', label: 'Areia / Orla' },
  { id: 'Academia A', label: 'Academia A' },
  { id: 'Academia B', label: 'Academia B' },
  { id: 'Fluxo Chinês', label: 'Fluxo Chinês' },
  { id: 'Hotel / Elásticos', label: 'Hotel / Elásticos' },
  { id: 'Surfskate', label: 'Surfskate' },
  { id: 'Surf no Mar', label: 'Surf no Mar' },
  { id: 'Elite Segura', label: 'Elite Segura' },
  { id: 'Descanso Consciente', label: 'Descanso Consciente' },
];

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({
  todayIso,
  preWorkout,
  onSaveCheckIn,
}) => {
  const [date, setDate] = useState(todayIso);
  const [modality, setModality] = useState<Modality>('Wellhub — Pilates');
  const [isWellhub, setIsWellhub] = useState(true);
  const [lumbarBefore, setLumbarBefore] = useState(preWorkout.lumbarNow);
  const [lumbarAfter, setLumbarAfter] = useState(Math.max(0, preWorkout.lumbarNow - 1));
  const [rightLegRadiation, setRightLegRadiation] = useState(preWorkout.rightLegRadiation);
  const [effort, setEffort] = useState(3);
  const [durationMin, setDurationMin] = useState(50);
  const [calories, setCalories] = useState(() => estimateCalories('Wellhub — Pilates', 50));
  const [caloriesManual, setCaloriesManual] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [location, setLocation] = useState('João Pessoa - PB');
  const [hasMediaForInsta, setHasMediaForInsta] = useState(true);
  const [note, setNote] = useState('');

  // Voice Dictation state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Save state
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sync lumbarBefore when preWorkout updates
  useEffect(() => {
    setLumbarBefore(preWorkout.lumbarNow);
    setRightLegRadiation(preWorkout.rightLegRadiation);
  }, [preWorkout.lumbarNow, preWorkout.rightLegRadiation]);

  // Auto-update calories unless user manually edited
  useEffect(() => {
    if (!caloriesManual) {
      setCalories(estimateCalories(modality, durationMin));
    }
  }, [modality, durationMin, caloriesManual]);

  const applyParsedVoice = (spokenText: string) => {
    const parsed = parseVoiceCheckIn(spokenText);
    if (parsed.modality) {
      setModality(parsed.modality);
      if (parsed.modality === 'Wellhub — Pilates') setIsWellhub(true);
    }
    if (parsed.isWellhub !== undefined) setIsWellhub(parsed.isWellhub);
    if (parsed.effort !== undefined) setEffort(parsed.effort);
    if (parsed.lumbarBefore !== undefined) setLumbarBefore(parsed.lumbarBefore);
    if (parsed.lumbarAfter !== undefined) setLumbarAfter(parsed.lumbarAfter);
    if (parsed.rightLegRadiation !== undefined) setRightLegRadiation(parsed.rightLegRadiation);
    if (parsed.durationMin !== undefined) {
      setDurationMin(parsed.durationMin);
      if (parsed.calories === undefined) setCaloriesManual(false);
    }
    if (parsed.calories !== undefined) {
      setCalories(parsed.calories);
      setCaloriesManual(true);
    }
    if (parsed.hasMediaForInsta !== undefined) setHasMediaForInsta(parsed.hasMediaForInsta);
    setNote((prev) => (prev ? `${prev} ${spokenText}` : spokenText));

    if (parsed.matchedFields.length > 0) {
      setVoiceFeedback(`Preenchido automaticamente: ${parsed.matchedFields.join(' · ')}`);
    } else {
      setVoiceFeedback('Transcrição adicionada à nota. Ajuste os campos abaixo se necessário.');
    }
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceFeedback(
        'Web Speech API indisponível neste navegador. Use o microfone nativo do teclado do iPhone diretamente no campo de Nota ou cole o ditado abaixo.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      let latestTranscript = '';

      recognition.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
        }
        latestTranscript = combined.trim();
        setTranscript(latestTranscript);
      };

      recognition.onerror = (err) => {
        setIsListening(false);
        setVoiceFeedback(
          `Não foi possível captar áudio (${err.error}). Você também pode usar o ditado nativo do teclado do iPhone.`
        );
      };

      recognition.onend = () => {
        setIsListening(false);
        if (latestTranscript) {
          applyParsedVoice(latestTranscript);
        }
      };

      recognitionRef.current = recognition;
      setTranscript('');
      setVoiceFeedback('Ouvindo em português... fale modalidade, duração, esforço e lombar.');
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback('Microfone bloqueado. Libere a permissão ou use o ditado nativo do teclado.');
    }
  };

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
          setGpsStatus('Localização atualizada via GPS + OpenStreetMap.');
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setGpsStatus('Coordenadas capturadas (edite o nome do local se preferir).');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('Permissão de GPS negada ou indisponível — digite o local manualmente.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      `Check-in do DIA ${String(currentDay).padStart(2, '0')} salvo! Já disponível na Jornada e no Gerador de Card Story.`
    );
    setNote('');
    setDistanceKm('');
    window.setTimeout(() => setSavedNotice(null), 4500);
  };

  return (
    <div className="space-y-5">
      {/* Voice Dictation Hero Card */}
      <section className="rounded-2xl bg-[#06283D] text-white p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#7FDAD0]">CHECK-IN UNIVERSAL EM 10 SEGUNDOS</p>
            <h2 className="font-display font-bold text-lg sm:text-xl mt-0.5">
              Ditar Check-in por Voz (pt-BR)
            </h2>
            <p className="text-xs text-white/80 mt-1">
              Ex: &ldquo;Fiz Pilates pelo Wellhub por 50 minutos, esforço 3, lombar antes 4 depois 2, gravei vídeo pro @metaexplicada.&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={toggleVoiceRecognition}
            className={`min-h-[54px] px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-[#E63946] text-white'
                : 'bg-[#00A896] hover:bg-[#009282] text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" aria-hidden="true" />
                <span>Parar Ditado</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" aria-hidden="true" />
                <span>Ditar Check-in por Voz</span>
              </>
            )}
          </button>
        </div>

        {transcript && (
          <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-xs">
            <span className="text-[#7FDAD0] font-bold">Transcrição: </span>
            <span>{transcript}</span>
          </div>
        )}

        {voiceFeedback && (
          <p className="text-xs text-[#7FDAD0] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{voiceFeedback}</span>
          </p>
        )}

        <p className="text-[11px] text-white/65">
          Dica iPhone: se preferir, toque no campo de Nota abaixo e use o microfone nativo do teclado iOS — depois toque em &ldquo;Interpretar texto&rdquo; para preencher os campos automaticamente.
        </p>
      </section>

      {/* Main Check-in Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-5">
        {savedNotice && (
          <div
            role="status"
            className="rounded-xl bg-[#ECFDF5] border border-[#00A896]/40 p-3.5 text-xs sm:text-sm font-semibold text-[#064E3B] flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-[#00A896] shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* 1-Tap Modality Picker */}
        <div>
          <span className="block text-xs font-bold text-[#06283D] mb-2">
            1. Modalidade (1 toque)
          </span>
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map((m) => {
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

        {/* Date, Duration, Calories, Distance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="ci-date" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Data
            </label>
            <input
              id="ci-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
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
              Distância km (opcional)
            </label>
            <input
              id="ci-distance"
              type="text"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="Ex: 8,8"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
            />
          </div>
        </div>

        {/* Lumbar Before -> After & Effort */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="ci-lumbar-before">Lombar Antes (do Pré-Treino)</label>
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

        {/* Clinical Alert + Wellhub + Insta Flags */}
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
              <span>Gravei foto/vídeo @metaexplicada</span>
            </span>
          </label>
        </div>

        {/* GPS Location */}
        <div>
          <label htmlFor="ci-location" className="block text-xs font-semibold text-[#4A6578] mb-1">
            Localização (GPS ou manual)
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
              <span>Pegar Localização GPS</span>
            </button>
          </div>
          {gpsStatus && <p className="mt-1 text-[11px] text-[#5B7689]">{gpsStatus}</p>}
        </div>

        {/* Note / Technical Win + Smart Text Parse Helper */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="ci-note" className="text-xs font-semibold text-[#4A6578]">
              Nota / Vitória Técnica do Dia
            </label>
            {note.trim().length > 10 && (
              <button
                type="button"
                onClick={() => applyParsedVoice(note)}
                className="text-xs font-bold text-[#1363DF] hover:underline cursor-pointer"
              >
                Interpretar texto ditado
              </button>
            )}
          </div>
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
          <span>Salvar Check-in na Jornada</span>
        </button>
      </form>
    </div>
  );
};

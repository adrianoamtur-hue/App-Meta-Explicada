import React, { useRef, useState } from 'react';
import {
  Check,
  Droplets,
  Dumbbell,
  Mic,
  MicOff,
  Moon,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { Modality, SleepFeeling, UniversalVoiceParsed } from '../types';
import {
  buildSleepBlock,
  estimateCalories,
  formatDurationHoursMin,
  formatPtDate,
  parseUniversalVoiceDiary,
  shiftIsoDate,
  sumSleepBlocksMinutes,
} from '../utils/logic';

interface UniversalVoiceModalProps {
  isOpen: boolean;
  todayIso: string;
  defaultLumbar: number;
  onClose: () => void;
  onConfirmAll: (payload: UniversalVoiceParsed) => void;
}

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

const MODALITIES: Modality[] = [
  'Wellhub — Pilates',
  'Fluxo Chinês',
  'Areia / Orla',
  'Academia A',
  'Academia B',
  'Personal Trainer',
  'Hotel / Elásticos',
  'Surfskate',
  'Surf no Mar',
  'Elite Segura',
];

const SLEEP_FEELINGS: SleepFeeling[] = ['Zerado', 'Médio', 'Moído'];

export const UniversalVoiceModal: React.FC<UniversalVoiceModalProps> = ({
  isOpen,
  todayIso,
  defaultLumbar,
  onClose,
  onConfirmAll,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const [rawText, setRawText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [draft, setDraft] = useState<UniversalVoiceParsed | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  if (!isOpen) return null;

  const analyzePhrase = (textToParse: string) => {
    const clean = textToParse.trim();
    if (!clean) return;
    const result = parseUniversalVoiceDiary(clean, todayIso, defaultLumbar);
    setDraft(result);
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceHint(
        'Web Speech API indisponível aqui. Toque no campo abaixo e use o microfone nativo do teclado do iPhone, depois toque em "Analisar frase".'
      );
      return;
    }

    try {
      const rec = new SpeechRecognitionCtor();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = true;
      let latest = '';

      rec.onresult = (e) => {
        let out = '';
        for (let i = 0; i < e.results.length; i++) {
          out += e.results[i][0].transcript;
        }
        latest = out.trim();
        setRawText(latest);
      };

      rec.onerror = (err) => {
        setIsListening(false);
        setVoiceHint(
          `Não foi possível ouvir (${err.error}). Use o microfone nativo do teclado do iPhone no campo abaixo.`
        );
      };

      rec.onend = () => {
        setIsListening(false);
        if (latest) {
          analyzePhrase(latest);
        }
      };

      recognitionRef.current = rec;
      setVoiceHint('Ouvindo em português... fale naturalmente o que você fez.');
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
      setVoiceHint('Microfone indisponível. Digite ou use o ditado nativo do teclado iOS.');
    }
  };

  const hasAnyDetected = Boolean(
    draft &&
      (draft.sleep ||
        draft.workout ||
        draft.consciousRest ||
        draft.waterMl !== undefined ||
        draft.lumbarUpdate)
  );

  const handleConfirm = () => {
    if (!draft || !hasAnyDetected) return;
    onConfirmAll(draft);
    setRawText('');
    setDraft(null);
    setVoiceHint(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diário por Voz Universal"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5E0D5] text-[#06283D] shadow-2xl">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CEC2] rounded-full mx-auto mt-3" />

        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 border-b border-[#E5E0D5] flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base text-[#06283D]">
              Falar o que fiz agora
            </h2>
            <p className="text-[11px] text-[#5B7689]">
              Identifica automaticamente sono, treino, descanso consciente, dor lombar e água
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              recognitionRef.current?.stop();
              setIsListening(false);
              onClose();
            }}
            aria-label="Fechar diário por voz"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#F8F6F1] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mic CTA + Keyboard Dictation Box */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`w-full min-h-[54px] rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isListening
                  ? 'bg-[#E63946] text-white'
                  : 'bg-[#06283D] hover:bg-[#0B3B59] text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" aria-hidden="true" />
                  <span>Parar e Analisar</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-[#7FDAD0]" aria-hidden="true" />
                  <span>Tocar e Falar (pt-BR)</span>
                </>
              )}
            </button>

            <div>
              <label htmlFor="universal-voice-input" className="block text-xs font-semibold text-[#4A6578] mb-1">
                Ou cole / use o microfone nativo do teclado do iPhone:
              </label>
              <textarea
                id="universal-voice-input"
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder='Ex: "Ontem fiz descanso consciente e dormi das 14 às 19. Hoje acordei moído com sono picado das 22:15 às 7:00 e bebi 500ml."'
                className="w-full p-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm text-[#06283D] focus:outline-2 focus:outline-[#1363DF]"
              />
            </div>

            {voiceHint && <p className="text-xs text-[#1363DF] font-medium">{voiceHint}</p>}

            <button
              type="button"
              onClick={() => analyzePhrase(rawText)}
              disabled={!rawText.trim()}
              className="w-full min-h-[44px] rounded-xl bg-[#F0F7FF] hover:bg-[#E1EFFF] disabled:opacity-50 border border-[#1363DF]/30 text-[#1363DF] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analisar Frase e Detectar Registros</span>
            </button>
          </div>

          {/* Clean Editable Confirmation Cards (ONLY what was detected) */}
          {draft && (
            <div className="pt-3 border-t border-[#E5E0D5] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#06283D]">
                  Confirmação — edite ou remova antes de salvar
                </p>
                <div className="inline-flex p-0.5 rounded-lg bg-[#F8F6F1] border border-[#E5E0D5]">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => (d ? { ...d, targetDate: todayIso, dateLabel: 'Hoje' } : d))
                    }
                    className={`min-h-[32px] px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
                      draft.targetDate === todayIso ? 'bg-[#06283D] text-white' : 'text-[#4A6578]'
                    }`}
                  >
                    Hoje ({formatPtDate(todayIso).slice(0, 5)})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) =>
                        d ? { ...d, targetDate: yesterdayIso, dateLabel: 'Ontem' } : d
                      )
                    }
                    className={`min-h-[32px] px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
                      draft.targetDate === yesterdayIso
                        ? 'bg-[#06283D] text-white'
                        : 'text-[#4A6578]'
                    }`}
                  >
                    Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
                  </button>
                </div>
              </div>

              {!hasAnyDetected && (
                <div className="rounded-xl bg-[#FFFBEB] border border-[#D97706]/35 p-3.5 text-xs text-[#78350F]">
                  Nenhum registro reconhecido nessa frase. Tente citar algo como &ldquo;dormi das 22:15 às 7:00&rdquo;, &ldquo;fiz pilates 50 min&rdquo;, &ldquo;descanso consciente&rdquo; ou &ldquo;bebi 500ml&rdquo;.
                </div>
              )}

              {/* Detected: Sleep */}
              {draft.sleep && (
                <div className="rounded-xl bg-[#F4F8FC] border border-[#1363DF]/25 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#1363DF] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#00A896]" />
                      <Moon className="w-3.5 h-3.5" />
                      <span>
                        Sono detectado · {formatDurationHoursMin(draft.sleep.totalMinutes)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => (d ? { ...d, sleep: undefined } : d))}
                      aria-label="Remover cartão de sono detectado"
                      className="text-xs text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {draft.sleep.blocks.map((blk, bIdx) => (
                    <div key={bIdx} className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        aria-label={`Sono bloco ${bIdx + 1} dormiu`}
                        value={blk.bedTime}
                        onChange={(e) => {
                          const bed = e.target.value;
                          setDraft((d) => {
                            if (!d?.sleep) return d;
                            const nextBlocks = d.sleep.blocks.map((b, i) =>
                              i === bIdx ? buildSleepBlock(bed, b.wakeTime) : b
                            );
                            return {
                              ...d,
                              sleep: {
                                ...d.sleep,
                                blocks: nextBlocks,
                                totalMinutes: sumSleepBlocksMinutes(nextBlocks),
                              },
                            };
                          });
                        }}
                        className="min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                      />
                      <input
                        type="time"
                        aria-label={`Sono bloco ${bIdx + 1} acordou`}
                        value={blk.wakeTime}
                        onChange={(e) => {
                          const wake = e.target.value;
                          setDraft((d) => {
                            if (!d?.sleep) return d;
                            const nextBlocks = d.sleep.blocks.map((b, i) =>
                              i === bIdx ? buildSleepBlock(b.bedTime, wake) : b
                            );
                            return {
                              ...d,
                              sleep: {
                                ...d.sleep,
                                blocks: nextBlocks,
                                totalMinutes: sumSleepBlocksMinutes(nextBlocks),
                              },
                            };
                          });
                        }}
                        className="min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                      />
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.sleep.fragmented}
                        onChange={(e) =>
                          setDraft((d) =>
                            d?.sleep
                              ? { ...d, sleep: { ...d.sleep, fragmented: e.target.checked } }
                              : d
                          )
                        }
                        className="w-4 h-4 accent-[#D97706]"
                      />
                      <span>Sono picado</span>
                    </label>

                    <div className="inline-flex gap-1">
                      {SLEEP_FEELINGS.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() =>
                            setDraft((d) => (d?.sleep ? { ...d, sleep: { ...d.sleep, feeling: f } } : d))
                          }
                          className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            draft.sleep?.feeling === f
                              ? 'bg-[#06283D] text-white border-[#06283D]'
                              : 'bg-white text-[#06283D] border-[#E5E0D5]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Detected: Workout */}
              {draft.workout && (
                <div className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#007A6D] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#00A896]" />
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Treino detectado</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => (d ? { ...d, workout: undefined } : d))}
                      aria-label="Remover cartão de treino detectado"
                      className="text-xs text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="Modalidade detectada"
                      value={draft.workout.modality}
                      onChange={(e) => {
                        const mod = e.target.value as Modality;
                        setDraft((d) =>
                          d?.workout
                            ? {
                                ...d,
                                workout: {
                                  ...d.workout,
                                  modality: mod,
                                  calories: estimateCalories(mod, d.workout.durationMin),
                                },
                              }
                            : d
                        );
                      }}
                      className="min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] text-xs font-semibold"
                    >
                      {MODALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      aria-label="Duração em minutos"
                      min={1}
                      max={480}
                      value={draft.workout.durationMin}
                      onChange={(e) => {
                        const mins = Number(e.target.value);
                        setDraft((d) =>
                          d?.workout
                            ? {
                                ...d,
                                workout: {
                                  ...d.workout,
                                  durationMin: mins,
                                  calories: estimateCalories(d.workout.modality, mins),
                                },
                              }
                            : d
                        );
                      }}
                      className="min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-[#335368]">
                    {draft.workout.durationMin} min · {draft.workout.calories} kcal · Lombar{' '}
                    {draft.workout.lumbarBefore}/10 → {draft.workout.lumbarAfter}/10
                  </p>
                </div>
              )}

              {/* Detected: Conscious Rest */}
              {draft.consciousRest && (
                <div className="rounded-xl bg-[#ECFDF5] border border-[#00A896]/35 p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B]">
                    <Check className="w-4 h-4 text-[#00A896]" />
                    <ShieldCheck className="w-4 h-4 text-[#00A896]" />
                    <span>Descanso Consciente detectado ({draft.dateLabel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? { ...d, consciousRest: undefined } : d))}
                    aria-label="Remover descanso consciente detectado"
                    className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Detected: Water */}
              {draft.waterMl !== undefined && (
                <div className="rounded-xl bg-[#F0F9FF] border border-[#1363DF]/25 p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#06283D]">
                    <Check className="w-4 h-4 text-[#00A896]" />
                    <Droplets className="w-4 h-4 text-[#1363DF]" />
                    <span>Hidratação detectada:</span>
                    <input
                      type="number"
                      aria-label="Água detectada em ml"
                      step={50}
                      min={50}
                      max={3000}
                      value={draft.waterMl}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, waterMl: Number(e.target.value) } : d))
                      }
                      className="w-20 min-h-[34px] px-2 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                    />
                    <span className="font-mono text-xs">ml</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? { ...d, waterMl: undefined } : d))}
                    aria-label="Remover hidratação detectada"
                    className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Detected: Lumbar Pain Update */}
              {draft.lumbarUpdate && (
                <div className="rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7F1D24]">
                    <Check className="w-4 h-4 text-[#E63946]" />
                    <ShieldAlert className="w-4 h-4 text-[#E63946]" />
                    <span>
                      Lombar detectada: {draft.lumbarUpdate.lumbarNow}/10
                      {draft.lumbarUpdate.rightLegRadiation ? ' · Alerta Perna Direita!' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? { ...d, lumbarUpdate: undefined } : d))}
                    aria-label="Remover registro de lombar detectado"
                    className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {hasAnyDetected && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full min-h-[52px] rounded-2xl bg-[#00A896] hover:bg-[#009282] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirmar e Salvar Tudo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

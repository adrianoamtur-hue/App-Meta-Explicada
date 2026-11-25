import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Check,
  Clock,
  Droplets,
  Dumbbell,
  Eraser,
  HeartPulse,
  Lightbulb,
  Mic,
  Moon,
  Pill,
  Save,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react';
import type {
  EnergyLevel,
  Modality,
  SleepFeeling,
  UniversalVoiceParsed,
} from '../types';
import {
  buildSleepBlock,
  estimateCalories,
  formatDurationHoursMin,
  formatPtDate,
  parseUniversalVoiceDiary,
  shiftIsoDate,
  sumSleepBlocksMinutes,
} from '../utils/logic';

interface SpeechRecognitionEventLike {
  resultIndex: number;
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
  abort?: () => void;
}

interface VoiceDiaryPanelProps {
  todayIso: string;
  defaultLumbar: number;
  latestWeightKg?: number;
  onConfirmAll: (payload: UniversalVoiceParsed) => void;
  onOpenManualEntry?: () => void;
  afterSave?: () => void;
}

const TELEPROMPTER_ITEMS = [
  {
    num: '1',
    title: 'Sono & Escalas',
    desc: 'hora que foi deitar/dormiu, hora que acordou (e se vai dormir agora para escala) + como levantou (zerado / médio / moído).',
  },
  {
    num: '2',
    title: 'Como me senti no dia',
    desc: 'humor, nível de energia, cansaço físico ou mental.',
  },
  {
    num: '3',
    title: 'Lombar L4-S1',
    desc: 'nota da dor (0 a 10), se mudou ao longo do dia e se houve qualquer sinal/formigamento na perna direita.',
  },
  {
    num: '4',
    title: 'Remédios & Suplementos',
    desc: 'qual remédio ou suplemento tomou hoje (e horário aproximado).',
  },
  {
    num: '5',
    title: 'Movimento ou Descanso',
    desc: 'treino feito + duração/local (Fluxo Chinês, Pilates/Wellhub, Academia, Areia, Hotel, Surfskate, Surf) ou Descanso Consciente.',
  },
  {
    num: '6',
    title: 'Peso & Cintura (1x/semana)',
    desc: 'peso atual (kg) e medida da cintura/abdômen (cm).',
  },
];

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
const ENERGY_LEVELS: EnergyLevel[] = ['Alta', 'Moderada', 'Baixa'];

function formatTimerMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const VoiceDiaryPanel: React.FC<VoiceDiaryPanelProps> = ({
  todayIso,
  defaultLumbar,
  latestWeightKg,
  onConfirmAll,
  onOpenManualEntry,
  afterSave,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);

  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micWarning, setMicWarning] = useState<string | null>(null);
  const [draft, setDraft] = useState<UniversalVoiceParsed | null>(null);

  // Refs for bulletproof continuous iPhone/PWA accumulation & auto-reconnect
  const isListeningRef = useRef(false);
  const committedTextRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live recording timer ("Gravando... 00:42")
  useEffect(() => {
    if (!isListening) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
    };
  }, []);

  const stopRecording = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    recognitionRef.current = null;
  };

  const startRecognitionSession = () => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      isListeningRef.current = false;
      setIsListening(false);
      setMicWarning(
        'Dica iPhone: toque na caixa abaixo e aperte o microfone do próprio teclado do iPhone para falar sem limite de tempo — depois toque em "Analisar Fala".'
      );
      textareaRef.current?.focus();
      return;
    }

    try {
      const rec = new SpeechRecognitionCtor();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalChunk += piece;
          } else {
            interimChunk += piece;
          }
        }

        if (finalChunk.trim()) {
          const prev = committedTextRef.current.trim();
          committedTextRef.current = prev
            ? `${prev} ${finalChunk.trim()}`
            : finalChunk.trim();
        }

        const display = [committedTextRef.current.trim(), interimChunk.trim()]
          .filter(Boolean)
          .join(' ');
        setText(display);
      };

      rec.onerror = (event) => {
        const err = event.error;
        if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
          isListeningRef.current = false;
          setIsListening(false);
          setMicWarning(
            'Microfone bloqueado pelo navegador/iOS PWA. Dica iPhone: toque na caixa abaixo e aperte o microfone do próprio teclado do iPhone para falar sem limite de tempo — depois toque em "Analisar Fala".'
          );
          textareaRef.current?.focus();
        } else if (err === 'no-speech' || err === 'network' || err === 'aborted') {
          // Non-fatal: let onend auto-reconnect if still listening
        }
      };

      rec.onend = () => {
        // Auto-reconnect after 250ms if user has NOT pressed Stop
        if (isListeningRef.current) {
          if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = window.setTimeout(() => {
            if (isListeningRef.current) {
              startRecognitionSession();
            }
          }, 250);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      setMicWarning(
        'Não foi possível iniciar o microfone aqui. Dica iPhone: toque na caixa abaixo e aperte o microfone do próprio teclado do iPhone para falar sem limite de tempo — depois toque em "Analisar Fala".'
      );
      textareaRef.current?.focus();
    }
  };

  const handleStartRecording = () => {
    setMicWarning(null);
    committedTextRef.current = text.trim();
    setElapsedSec(0);
    isListeningRef.current = true;
    setIsListening(true);
    startRecognitionSession();
  };

  const handleClear = () => {
    stopRecording();
    committedTextRef.current = '';
    setText('');
    setElapsedSec(0);
    setDraft(null);
    setMicWarning(null);
  };

  const handleAnalyze = () => {
    if (isListeningRef.current) {
      stopRecording();
    }
    const clean = text.trim();
    if (!clean) return;
    const parsed = parseUniversalVoiceDiary(clean, todayIso, defaultLumbar, latestWeightKg);
    setDraft(parsed);
  };

  const handleConfirmSave = () => {
    if (!draft) return;
    onConfirmAll(draft);
    committedTextRef.current = '';
    setText('');
    setElapsedSec(0);
    setDraft(null);
    setMicWarning(null);
    afterSave?.();
  };

  const hasStructuredItems = Boolean(
    draft &&
      ((draft.sleepSegments && draft.sleepSegments.length > 0) ||
        draft.workout ||
        draft.consciousRest ||
        draft.waterMl !== undefined ||
        draft.lumbarUpdate ||
        (draft.medications && draft.medications.length > 0) ||
        draft.mood ||
        draft.bodyMeasurement)
  );

  return (
    <div className="space-y-4">
      {/* 1. Compact 6-Item Teleprompter Card */}
      <section className="rounded-2xl bg-[#F4F8FC] border border-[#1363DF]/20 p-4 space-y-2.5">
        <p className="text-xs font-bold text-[#06283D]">
          Roteiro do que falar (só passe o olho — fale só o que quiser):
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:text-xs text-[#284559] leading-snug">
          {TELEPROMPTER_ITEMS.map((item) => (
            <li key={item.num} className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-[#1363DF] shrink-0">{item.num}.</span>
              <span>
                <strong className="text-[#06283D]">{item.title}:</strong> {item.desc}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 2. Hybrid Bulletproof Voice Controls + Live Timer */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          {!isListening ? (
            <button
              type="button"
              onClick={handleStartRecording}
              className="flex-1 min-h-[54px] px-4 rounded-2xl bg-[#06283D] hover:bg-[#0B3B59] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mic className="w-5 h-5 text-[#7FDAD0]" aria-hidden="true" />
              <span>Iniciar Gravação Contínua (pt-BR)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 min-h-[54px] px-4 rounded-2xl bg-[#E63946] hover:bg-[#C81E2B] text-white font-display font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Parar Gravação</span>
              <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-lg tabular-nums">
                Gravando... {formatTimerMMSS(elapsedSec)}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar texto ditado"
            className="min-h-[54px] px-3.5 rounded-2xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-[#06283D] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Eraser className="w-4 h-4 text-[#5B7689]" aria-hidden="true" />
            <span>Limpar</span>
          </button>
        </div>

        {/* Friendly iPhone Fallback Notice */}
        {micWarning ? (
          <div
            role="status"
            className="rounded-xl bg-[#FFFBEB] border border-[#D97706]/45 p-3 text-xs text-[#78350F] flex items-start gap-2 leading-relaxed"
          >
            <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{micWarning}</span>
          </div>
        ) : (
          <p className="text-[11px] text-[#4A6578] flex items-start gap-1.5 leading-snug">
            <Lightbulb className="w-3.5 h-3.5 text-[#1363DF] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Dica iPhone: você também pode tocar na caixa abaixo e apertar o microfone do próprio teclado do iPhone para falar sem limite de tempo — depois toque em <strong>Analisar Fala</strong>.
            </span>
          </p>
        )}

        {/* Large Editable Live Transcript Box */}
        <div>
          <label htmlFor="voice-diary-textarea" className="sr-only">
            Transcrição completa da sua fala
          </label>
          <textarea
            ref={textareaRef}
            id="voice-diary-textarea"
            rows={5}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              committedTextRef.current = e.target.value;
            }}
            placeholder='Ex: "De ontem para hoje fui dormir às 10 da noite, efetivo 2:30 da manhã até 8 da manhã, e agora estou indo dormir 9:15 e vou acordar 1:25 da manhã. Lombar nota 2 sem formigamento, tomei creatina e fiz Fluxo Chinês 16 min."'
            className={`w-full p-3.5 rounded-2xl bg-[#F8F6F1] border text-sm text-[#06283D] leading-relaxed focus:outline-2 focus:outline-[#1363DF] ${
              micWarning ? 'border-[#D97706] ring-2 ring-[#D97706]/25' : 'border-[#E5E0D5]'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!text.trim()}
          className="w-full min-h-[48px] rounded-2xl bg-[#1363DF] hover:bg-[#0F52BD] disabled:opacity-45 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          <span>Analisar Fala</span>
        </button>
      </section>

      {/* 3. Editable Preview of Extracted Entities before Saving */}
      {draft && (
        <section className="pt-3 border-t border-[#E5E0D5] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-[#06283D]">
                Prévia editável antes de salvar
              </p>
              <p className="text-[11px] text-[#5B7689]">
                A transcrição completa original sempre será salva junto no Banco de Dados Privado.
              </p>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-[#F8F6F1] border border-[#E5E0D5]">
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => (d ? { ...d, targetDate: todayIso, dateLabel: 'Hoje' } : d))
                }
                className={`min-h-[34px] px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
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
                className={`min-h-[34px] px-2.5 rounded-md text-[11px] font-bold cursor-pointer ${
                  draft.targetDate === yesterdayIso
                    ? 'bg-[#06283D] text-white'
                    : 'text-[#4A6578]'
                }`}
              >
                Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
              </button>
            </div>
          </div>

          {!hasStructuredItems && (
            <div className="rounded-xl bg-[#F4F8FC] border border-[#1363DF]/25 p-3 text-xs text-[#1E3A4C]">
              Nenhum campo numérico específico foi extraído, mas você pode salvar a transcrição completa diretamente no seu Banco de Dados Privado.
            </div>
          )}

          {/* Distinct Editable Cards for EACH Sleep / Shift Window */}
          {draft.sleepSegments &&
            draft.sleepSegments.map((seg, segIdx) => {
              const isUpcoming = seg.kind === 'upcoming_shift';
              return (
                <div
                  key={seg.id}
                  data-testid={`sleep-segment-card-${segIdx}`}
                  className={`rounded-xl border p-3.5 space-y-2.5 ${
                    isUpcoming
                      ? 'bg-[#FFFBEB] border-[#D97706]/35'
                      : 'bg-[#F4F8FC] border-[#1363DF]/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        isUpcoming ? 'text-[#B45309]' : 'text-[#1363DF]'
                      }`}
                    >
                      {isUpcoming ? (
                        <Clock className="w-4 h-4 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {seg.title}: {seg.blocks.map((b) => `${b.bedTime} → ${b.wakeTime}`).join(' + ')} (
                        {formatDurationHoursMin(seg.totalMinutes)})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                sleepSegments: d.sleepSegments?.filter((_, i) => i !== segIdx),
                              }
                            : d
                        )
                      }
                      aria-label={`Remover cartão ${seg.title}`}
                      className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {seg.inBedTime && (
                    <p className="text-[11px] text-[#4A6578]">
                      Foi deitar às <strong className="font-mono text-[#06283D]">{seg.inBedTime}</strong> (sono efetivo abaixo):
                    </p>
                  )}

                  {seg.blocks.map((blk, bIdx) => (
                    <div key={bIdx} className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-[#4A6578] mb-0.5">
                          Início / Dormiu
                        </label>
                        <input
                          type="time"
                          aria-label={`${seg.title} início`}
                          value={blk.bedTime}
                          onChange={(e) => {
                            const bed = e.target.value;
                            setDraft((d) => {
                              if (!d?.sleepSegments) return d;
                              const nextSegs = d.sleepSegments.map((s, si) => {
                                if (si !== segIdx) return s;
                                const nextBlocks = s.blocks.map((b, bi) =>
                                  bi === bIdx ? buildSleepBlock(bed, b.wakeTime) : b
                                );
                                return {
                                  ...s,
                                  blocks: nextBlocks,
                                  totalMinutes: sumSleepBlocksMinutes(nextBlocks),
                                };
                              });
                              return { ...d, sleepSegments: nextSegs };
                            });
                          }}
                          className="w-full min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs text-[#06283D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#4A6578] mb-0.5">
                          Fim / Acordou
                        </label>
                        <input
                          type="time"
                          aria-label={`${seg.title} fim`}
                          value={blk.wakeTime}
                          onChange={(e) => {
                            const wake = e.target.value;
                            setDraft((d) => {
                              if (!d?.sleepSegments) return d;
                              const nextSegs = d.sleepSegments.map((s, si) => {
                                if (si !== segIdx) return s;
                                const nextBlocks = s.blocks.map((b, bi) =>
                                  bi === bIdx ? buildSleepBlock(b.bedTime, wake) : b
                                );
                                return {
                                  ...s,
                                  blocks: nextBlocks,
                                  totalMinutes: sumSleepBlocksMinutes(nextBlocks),
                                };
                              });
                              return { ...d, sleepSegments: nextSegs };
                            });
                          }}
                          className="w-full min-h-[40px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs text-[#06283D]"
                        />
                      </div>
                    </div>
                  ))}

                  {!isUpcoming && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seg.fragmented}
                          onChange={(e) =>
                            setDraft((d) => {
                              if (!d?.sleepSegments) return d;
                              return {
                                ...d,
                                sleepSegments: d.sleepSegments.map((s, si) =>
                                  si === segIdx ? { ...s, fragmented: e.target.checked } : s
                                ),
                              };
                            })
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
                              setDraft((d) => {
                                if (!d?.sleepSegments) return d;
                                return {
                                  ...d,
                                  sleepSegments: d.sleepSegments.map((s, si) =>
                                    si === segIdx ? { ...s, feeling: f } : s
                                  ),
                                };
                              })
                            }
                            className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              seg.feeling === f
                                ? 'bg-[#06283D] text-white border-[#06283D]'
                                : 'bg-white text-[#06283D] border-[#E5E0D5]'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* Detected: Workout */}
          {draft.workout && (
            <div className="rounded-xl bg-[#F2FBF9] border border-[#00A896]/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#007A6D] flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  <span>Treino detectado</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, workout: undefined } : d))}
                  aria-label="Remover treino detectado"
                  className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
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
                              calories: estimateCalories(
                                mod,
                                d.workout.durationMin,
                                d.bodyMeasurement?.weightKg ?? latestWeightKg
                              ),
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
                              calories: estimateCalories(
                                d.workout.modality,
                                mins,
                                d.bodyMeasurement?.weightKg ?? latestWeightKg
                              ),
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
                <ShieldCheck className="w-4 h-4 text-[#00A896]" />
                <span>Descanso Consciente detectado ({draft.dateLabel})</span>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => (d ? { ...d, consciousRest: undefined } : d))}
                aria-label="Remover descanso consciente"
                className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Detected: Lumbar Pain */}
          {draft.lumbarUpdate && (
            <div className="rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#7F1D24] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#E63946]" />
                  <span>
                    Lombar L4-S1: {draft.lumbarUpdate.lumbarNow}/10
                    {draft.lumbarUpdate.rightLegRadiation ? ' · Alerta Raiz D L5' : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, lumbarUpdate: undefined } : d))}
                  aria-label="Remover registro de lombar"
                  className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range"
                aria-label="Ajustar nota lombar"
                min={0}
                max={10}
                value={draft.lumbarUpdate.lumbarNow}
                onChange={(e) =>
                  setDraft((d) =>
                    d?.lumbarUpdate
                      ? {
                          ...d,
                          lumbarUpdate: { ...d.lumbarUpdate, lumbarNow: Number(e.target.value) },
                        }
                      : d
                  )
                }
                className="w-full accent-[#E63946]"
              />
            </div>
          )}

          {/* Detected: Mood & Energy */}
          {draft.mood && (
            <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#06283D] flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-[#1363DF]" />
                  <span>Como me senti: {draft.mood.summary}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, mood: undefined } : d))}
                  aria-label="Remover registro de humor"
                  className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#4A6578] mr-1">Energia:</span>
                {ENERGY_LEVELS.map((en) => (
                  <button
                    key={en}
                    type="button"
                    onClick={() =>
                      setDraft((d) => (d?.mood ? { ...d, mood: { ...d.mood, energy: en } } : d))
                    }
                    className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      draft.mood?.energy === en
                        ? 'bg-[#06283D] text-white border-[#06283D]'
                        : 'bg-white text-[#06283D] border-[#E5E0D5]'
                    }`}
                  >
                    {en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Detected: Medications & Supplements */}
          {draft.medications && draft.medications.length > 0 && (
            <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#06283D] flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-[#1363DF]" />
                  <span>Remédios &amp; Suplementos ({draft.medications.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, medications: undefined } : d))}
                  aria-label="Remover remédios detectados"
                  className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {draft.medications.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E0D5] text-xs font-semibold text-[#06283D]"
                  >
                    {m.name}
                    {m.timeApprox ? ` (${m.timeApprox})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected: Weight & Waist */}
          {draft.bodyMeasurement && (
            <div className="rounded-xl bg-[#F4F8FC] border border-[#1363DF]/25 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#06283D] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[#1363DF]" />
                  <span>Peso &amp; Cintura (salvo no Banco Privado)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, bodyMeasurement: undefined } : d))}
                  aria-label="Remover peso e cintura"
                  className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#4A6578] mb-0.5">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={draft.bodyMeasurement.weightKg ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setDraft((d) =>
                        d?.bodyMeasurement
                          ? { ...d, bodyMeasurement: { ...d.bodyMeasurement, weightKg: val } }
                          : d
                      );
                    }}
                    className="w-full min-h-[38px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#4A6578] mb-0.5">
                    Cintura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={draft.bodyMeasurement.waistCm ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setDraft((d) =>
                        d?.bodyMeasurement
                          ? { ...d, bodyMeasurement: { ...d.bodyMeasurement, waistCm: val } }
                          : d
                      );
                    }}
                    className="w-full min-h-[38px] px-2.5 rounded-lg bg-white border border-[#E5E0D5] font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detected: Water */}
          {draft.waterMl !== undefined && (
            <div className="rounded-xl bg-[#F0F9FF] border border-[#1363DF]/25 p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#06283D]">
                <Droplets className="w-4 h-4 text-[#00A896]" />
                <span>Hidratação:</span>
                <input
                  type="number"
                  aria-label="Água em ml"
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
                aria-label="Remover hidratação"
                className="text-[#7A90A0] hover:text-[#E63946] cursor-pointer p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-[#007A6D] font-medium">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Transcrição completa original será preservada no histórico privado.</span>
          </div>

          <button
            type="button"
            onClick={handleConfirmSave}
            className="w-full min-h-[52px] rounded-2xl bg-[#00A896] hover:bg-[#009282] text-white font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Confirmar e Salvar no Banco de Dados</span>
          </button>
        </section>
      )}

      {/* Discreet Manual Fallback Link */}
      {onOpenManualEntry && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onOpenManualEntry}
            className="text-xs font-semibold text-[#5B7689] hover:text-[#06283D] underline underline-offset-4 py-2 px-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editar/lançar manualmente</span>
          </button>
        </div>
      )}
    </div>
  );
};

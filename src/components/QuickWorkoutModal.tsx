import React, { useEffect, useState } from 'react';
import { Dumbbell, X } from 'lucide-react';
import type { CheckInEntry, Modality } from '../types';
import {
  estimateCalories,
  formatPtDate,
  getProjectProgress,
  shiftIsoDate,
} from '../utils/logic';

interface QuickWorkoutModalProps {
  isOpen: boolean;
  todayIso: string;
  defaultLumbar: number;
  onClose: () => void;
  onSaveWorkout: (entry: CheckInEntry) => void;
}

const QUICK_MODALITIES: Modality[] = [
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

export const QuickWorkoutModal: React.FC<QuickWorkoutModalProps> = ({
  isOpen,
  todayIso,
  defaultLumbar,
  onClose,
  onSaveWorkout,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [modality, setModality] = useState<Modality>('Wellhub — Pilates');
  const [durationMin, setDurationMin] = useState(50);
  const [calories, setCalories] = useState(() => estimateCalories('Wellhub — Pilates', 50));
  const [lumbarBefore, setLumbarBefore] = useState(defaultLumbar);
  const [lumbarAfter, setLumbarAfter] = useState(Math.max(0, defaultLumbar - 1));
  const [rightLegRadiation, setRightLegRadiation] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setCalories(estimateCalories(modality, durationMin));
  }, [modality, durationMin]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { currentDay } = getProjectProgress(selectedDate);
    onSaveWorkout({
      id: `checkin-${Date.now()}`,
      date: selectedDate,
      dayNumber: currentDay,
      modality,
      isWellhub: modality === 'Wellhub — Pilates',
      durationMin: Math.max(0, Number(durationMin) || 0),
      calories: Math.max(0, Number(calories) || 0),
      lumbarBefore,
      lumbarAfter,
      rightLegRadiation,
      effort: 3,
      location: 'João Pessoa - PB',
      note: note.trim() || `Sessão de ${modality} concluída dentro do Escudo L4-S1.`,
      hasMediaForInsta: false,
      createdAt: new Date().toISOString(),
    });
    setNote('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar Treino Rápido"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5E0D5] text-[#06283D] shadow-xl">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CEC2] rounded-full mx-auto mt-3" />

        <div className="px-5 pt-4 pb-3 border-b border-[#E5E0D5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#1363DF]" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-base">Registrar Treino</h2>
              <p className="text-[11px] text-[#5B7689]">Apenas movimento · independente de sono</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar registro de treino"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#F8F6F1] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayIso)}
              aria-pressed={selectedDate === todayIso}
              className={`min-h-[42px] rounded-xl text-xs font-bold border cursor-pointer ${
                selectedDate === todayIso
                  ? 'bg-[#06283D] text-white border-[#06283D]'
                  : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
              }`}
            >
              Hoje ({formatPtDate(todayIso).slice(0, 5)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayIso)}
              aria-pressed={selectedDate === yesterdayIso}
              className={`min-h-[42px] rounded-xl text-xs font-bold border cursor-pointer ${
                selectedDate === yesterdayIso
                  ? 'bg-[#06283D] text-white border-[#06283D]'
                  : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
              }`}
            >
              Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_MODALITIES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModality(m)}
                aria-pressed={modality === m}
                className={`min-h-[40px] px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                  modality === m
                    ? 'bg-[#1363DF] text-white border-[#1363DF]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="qw-min" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                Duração (min)
              </label>
              <input
                id="qw-min"
                type="number"
                min={0}
                max={480}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="qw-kcal" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
                Calorias (kcal)
              </label>
              <input
                id="qw-kcal"
                type="number"
                min={0}
                max={4000}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3">
              <div className="flex justify-between text-xs font-semibold">
                <label htmlFor="qw-lb">Lombar Antes</label>
                <span className="font-mono font-bold">{lumbarBefore}/10</span>
              </div>
              <input
                id="qw-lb"
                type="range"
                min={0}
                max={10}
                value={lumbarBefore}
                onChange={(e) => setLumbarBefore(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#06283D]"
              />
            </div>
            <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3">
              <div className="flex justify-between text-xs font-semibold">
                <label htmlFor="qw-la">Lombar Depois</label>
                <span className="font-mono font-bold text-[#00A896]">{lumbarAfter}/10</span>
              </div>
              <input
                id="qw-la"
                type="range"
                min={0}
                max={10}
                value={lumbarAfter}
                onChange={(e) => setLumbarAfter(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#00A896]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 cursor-pointer">
            <input
              type="checkbox"
              checked={rightLegRadiation}
              onChange={(e) => setRightLegRadiation(e.target.checked)}
              className="w-4 h-4 accent-[#E63946]"
            />
            <span className="text-xs font-semibold text-[#7F1D24]">
              Irradiação / formigamento na perna direita (Raiz D L5)
            </span>
          </label>

          <div>
            <label htmlFor="qw-note" className="block text-[11px] font-semibold text-[#4A6578] mb-1">
              Nota rápida (opcional)
            </label>
            <input
              id="qw-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: sensação ótima na mobilidade de quadril..."
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl bg-[#1363DF] hover:bg-[#0F52BD] text-white font-display font-bold text-sm cursor-pointer"
          >
            Salvar Treino
          </button>
        </form>
      </div>
    </div>
  );
};

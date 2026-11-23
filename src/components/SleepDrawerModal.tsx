import React, { useMemo, useState } from 'react';
import { Moon, Plus, Trash2, X } from 'lucide-react';
import type { SleepEntry, SleepFeeling } from '../types';
import {
  buildSleepBlock,
  formatDurationHoursMin,
  formatPtDate,
  shiftIsoDate,
  sumSleepBlocksMinutes,
} from '../utils/logic';

interface SleepDrawerModalProps {
  isOpen: boolean;
  todayIso: string;
  onClose: () => void;
  onSaveSleep: (entry: SleepEntry) => void;
}

const FEELINGS: SleepFeeling[] = ['Zerado', 'Médio', 'Moído'];

export const SleepDrawerModal: React.FC<SleepDrawerModalProps> = ({
  isOpen,
  todayIso,
  onClose,
  onSaveSleep,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [blocks, setBlocks] = useState<{ bedTime: string; wakeTime: string }[]>([
    { bedTime: '22:15', wakeTime: '07:00' },
  ]);
  const [fragmented, setFragmented] = useState(false);
  const [feeling, setFeeling] = useState<SleepFeeling>('Médio');
  const [note, setNote] = useState('');

  const builtBlocks = useMemo(
    () => blocks.map((b) => buildSleepBlock(b.bedTime, b.wakeTime)),
    [blocks]
  );

  const totalMinutes = useMemo(() => sumSleepBlocksMinutes(builtBlocks), [builtBlocks]);

  if (!isOpen) return null;

  const handleAddBlock = () => {
    setBlocks((prev) => [...prev, { bedTime: '14:00', wakeTime: '17:00' }]);
  };

  const handleRemoveBlock = (idx: number) => {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleUpdateBlock = (idx: number, field: 'bedTime' | 'wakeTime', value: string) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNightShift = builtBlocks.some((b) => {
      const hour = parseInt(b.bedTime.split(':')[0], 10);
      return hour >= 12 && hour <= 19;
    });

    const entry: SleepEntry = {
      id: `sleep-${Date.now()}`,
      date: selectedDate,
      blocks: builtBlocks,
      totalMinutes,
      fragmented,
      isNightShift,
      feeling,
      note: note.trim() || undefined,
    };

    onSaveSleep(entry);
    setNote('');
    setFragmented(false);
    setBlocks([{ bedTime: '22:15', wakeTime: '07:00' }]);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar Sono Independente"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5E0D5] text-[#06283D] shadow-xl">
        {/* Grab handle on mobile */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CEC2] rounded-full mx-auto mt-3" />

        <div className="px-5 pt-4 pb-3 border-b border-[#E5E0D5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#1363DF]" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-base text-[#06283D]">Registrar Sono</h2>
              <p className="text-[11px] text-[#5B7689]">
                Histórico independente de treinos · suporta múltiplos blocos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar registro de sono"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#F8F6F1] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Date Selector: Hoje / Ontem */}
          <div>
            <span className="block text-xs font-bold text-[#06283D] mb-1.5">Data do registro</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                aria-pressed={selectedDate === todayIso}
                className={`min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer ${
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
                className={`min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer ${
                  selectedDate === yesterdayIso
                    ? 'bg-[#06283D] text-white border-[#06283D]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                }`}
              >
                Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
              </button>
            </div>
          </div>

          {/* Multiple Sleep Blocks */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#06283D]">
                Blocos de Sono ({blocks.length})
              </span>
              <span
                data-testid="sleep-modal-total"
                className="font-mono text-xs font-bold text-[#1363DF] tabular-nums"
              >
                Total somado: {formatDurationHoursMin(totalMinutes)}
              </span>
            </div>

            {blocks.map((block, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4A6578]">
                    Bloco {idx + 1} ·{' '}
                    <span className="font-mono text-[#06283D]">
                      {formatDurationHoursMin(builtBlocks[idx]?.durationMinutes || 0)}
                    </span>
                  </span>
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(idx)}
                      aria-label={`Remover bloco de sono ${idx + 1}`}
                      className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-[#7A90A0] hover:text-[#E63946] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor={`sleep-bed-${idx}`}
                      className="block text-[11px] font-semibold text-[#4A6578] mb-1"
                    >
                      Hora que dormiu
                    </label>
                    <input
                      id={`sleep-bed-${idx}`}
                      type="time"
                      value={block.bedTime}
                      onChange={(e) => handleUpdateBlock(idx, 'bedTime', e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`sleep-wake-${idx}`}
                      className="block text-[11px] font-semibold text-[#4A6578] mb-1"
                    >
                      Hora que acordou
                    </label>
                    <input
                      id={`sleep-wake-${idx}`}
                      type="time"
                      value={block.wakeTime}
                      onChange={(e) => handleUpdateBlock(idx, 'wakeTime', e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] font-mono text-sm text-[#06283D]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddBlock}
              className="w-full min-h-[44px] rounded-xl border border-dashed border-[#1363DF]/50 bg-[#F4F8FC] hover:bg-[#E7F0FB] text-[#1363DF] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar bloco de sono</span>
            </button>
          </div>

          {/* Fragmented Sleep Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#D97706]/35 cursor-pointer min-h-[48px]">
            <input
              type="checkbox"
              checked={fragmented}
              onChange={(e) => setFragmented(e.target.checked)}
              className="w-5 h-5 accent-[#D97706] shrink-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#78350F]">
              Sono picado / acordei várias vezes à noite
            </span>
          </label>

          {/* How I Woke Up Selector */}
          <div>
            <span className="block text-xs font-bold text-[#06283D] mb-1.5">Como acordei</span>
            <div className="grid grid-cols-3 gap-2">
              {FEELINGS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(f)}
                  aria-pressed={feeling === f}
                  className={`min-h-[44px] rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    feeling === f
                      ? f === 'Moído'
                        ? 'bg-[#E63946] text-white border-[#E63946]'
                        : f === 'Zerado'
                          ? 'bg-[#00A896] text-white border-[#00A896]'
                          : 'bg-[#1363DF] text-white border-[#1363DF]'
                      : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="sleep-modal-note" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Nota opcional
            </label>
            <input
              id="sleep-modal-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: pós-escala de madrugada, cochilo antes do turno..."
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm text-[#06283D]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[50px] rounded-2xl bg-[#06283D] hover:bg-[#0B3B59] text-white font-display font-bold text-sm cursor-pointer"
          >
            Salvar Sono ({formatDurationHoursMin(totalMinutes)})
          </button>
        </form>
      </div>
    </div>
  );
};

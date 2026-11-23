import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { formatPtDate, shiftIsoDate } from '../utils/logic';

interface QuickRestModalProps {
  isOpen: boolean;
  todayIso: string;
  onClose: () => void;
  onConfirmConsciousRest: (dateIso: string, note: string) => void;
}

export const QuickRestModal: React.FC<QuickRestModalProps> = ({
  isOpen,
  todayIso,
  onClose,
  onConfirmConsciousRest,
}) => {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onConfirmConsciousRest(
      selectedDate,
      note.trim() || 'Descanso Consciente registrado para proteger L4-S1 e Modic Tipo 1.'
    );
    setNote('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar Descanso Consciente"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5E0D5] text-[#06283D] shadow-xl">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CEC2] rounded-full mx-auto mt-3" />

        <div className="px-5 pt-4 pb-3 border-b border-[#E5E0D5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00A896]" aria-hidden="true" />
            <div>
              <h2 className="font-display font-bold text-base">Descanso Consciente</h2>
              <p className="text-[11px] text-[#5B7689]">Mantém sua correntinha ativa sem sobrecarregar L4-S1</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar descanso consciente"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#F8F6F1] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <span className="block text-xs font-bold text-[#06283D] mb-1.5">Qual dia?</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayIso)}
                aria-pressed={selectedDate === todayIso}
                className={`min-h-[46px] rounded-xl text-xs font-bold border cursor-pointer ${
                  selectedDate === todayIso
                    ? 'bg-[#00A896] text-white border-[#00A896]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                }`}
              >
                Hoje ({formatPtDate(todayIso).slice(0, 5)})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayIso)}
                aria-pressed={selectedDate === yesterdayIso}
                className={`min-h-[46px] rounded-xl text-xs font-bold border cursor-pointer ${
                  selectedDate === yesterdayIso
                    ? 'bg-[#00A896] text-white border-[#00A896]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5]'
                }`}
              >
                Ontem ({formatPtDate(yesterdayIso).slice(0, 5)})
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="rest-note" className="block text-xs font-semibold text-[#4A6578] mb-1">
              Nota rápida (opcional)
            </label>
            <input
              id="rest-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: recuperação pós-escala de madrugada..."
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full min-h-[50px] rounded-2xl bg-[#00A896] hover:bg-[#009282] text-white font-display font-bold text-sm cursor-pointer"
          >
            Confirmar Descanso Consciente
          </button>
        </div>
      </div>
    </div>
  );
};
